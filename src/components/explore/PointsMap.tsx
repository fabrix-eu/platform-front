import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export interface MapPoint {
  id: string;
  lon: number;
  lat: number;
  color: string;
  title: string;
  subtitle?: string;
  href: string;
}

export interface MapRelationLine {
  from: [number, number]; // [lon, lat]
  to: [number, number];
  color: string;
}

interface PointsMapProps {
  points: MapPoint[];
  height?: string;
  relations?: MapRelationLine[];
  highlightId?: string;
  /** Filter-circle center [lon, lat]. When provided, map centers here instead of auto-fitting. */
  center?: [number, number];
  /** Filter-circle radius in km. When provided with center, draws a blue circle. */
  radiusKm?: number;
  /** Restrict panning/zoom to these bounds [[swLon, swLat], [neLon, neLat]]. */
  maxBounds?: [[number, number], [number, number]];
}

/** Generate a GeoJSON polygon approximating a circle on a sphere. */
function circlePolygon(center: [number, number], radiusKm: number, steps = 64) {
  const [lonDeg, latDeg] = center;
  const lat = latDeg * (Math.PI / 180);
  const lon = lonDeg * (Math.PI / 180);
  const d = radiusKm / 6371; // angular distance (Earth radius ≈ 6371 km)

  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * 2 * Math.PI;
    const pLat = Math.asin(
      Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(bearing),
    );
    const pLon = lon + Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(lat),
      Math.cos(d) - Math.sin(lat) * Math.sin(pLat),
    );
    coords.push([pLon * (180 / Math.PI), pLat * (180 / Math.PI)]);
  }

  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [coords] },
    properties: {},
  };
}

export function PointsMap({ points, height = '100%', relations, highlightId, center, radiusKm, maxBounds }: PointsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popupRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const validPoints = points.filter((p) => p.lat != null && p.lon != null && !isNaN(p.lat) && !isNaN(p.lon));

  const getDefaultCenter = useCallback((): [number, number] => {
    if (validPoints.length === 0) return [4.9, 52.4];
    const avgLon = validPoints.reduce((s, p) => s + p.lon, 0) / validPoints.length;
    const avgLat = validPoints.reduce((s, p) => s + p.lat, 0) / validPoints.length;
    return [avgLon, avgLat];
  }, [validPoints]);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: center || getDefaultCenter(),
        zoom: center ? 10 : 5,
        ...(maxBounds ? { maxBounds } : {}),
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.on('load', () => setMapLoaded(true));
    } catch {
      setMapError(true);
    }

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update layers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const update = () => {
      // Clean up existing layers
      const style = map.getStyle();
      if (style?.layers) {
        for (const layer of style.layers) {
          if (layer.id.startsWith('relation-line-')) map.removeLayer(layer.id);
        }
      }
      if (style?.sources) {
        for (const sourceId of Object.keys(style.sources)) {
          if (sourceId.startsWith('relation-')) map.removeSource(sourceId);
        }
      }
      if (map.getLayer('territory-fill')) map.removeLayer('territory-fill');
      if (map.getLayer('territory-border')) map.removeLayer('territory-border');
      if (map.getSource('territory')) map.removeSource('territory');
      if (map.getLayer('points-circles')) map.removeLayer('points-circles');
      if (map.getSource('points')) map.removeSource('points');

      // Draw filter-radius circle
      if (center && radiusKm) {
        const circle = circlePolygon(center, radiusKm);
        map.addSource('territory', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [circle] },
        });
        map.addLayer({
          id: 'territory-fill',
          type: 'fill',
          source: 'territory',
          paint: { 'fill-color': '#3B82F6', 'fill-opacity': 0.08 },
        });
        map.addLayer({
          id: 'territory-border',
          type: 'line',
          source: 'territory',
          paint: { 'line-color': '#3B82F6', 'line-width': 2, 'line-opacity': 0.4 },
        });
      }

      const fitToCircle = () => {
        if (!center || !radiusKm) return false;
        const circle = circlePolygon(center, radiusKm);
        const bounds = new maplibregl.LngLatBounds();
        for (const coord of circle.geometry.coordinates[0]) {
          bounds.extend(coord as [number, number]);
        }
        map.fitBounds(bounds, { padding: 30, maxZoom: 14, duration: 1000 });
        return true;
      };

      if (validPoints.length === 0) {
        fitToCircle();
        return;
      }

      // Draw relation lines first (under markers)
      if (relations?.length) {
        relations.forEach((rel, i) => {
          const sourceId = `relation-${i}`;
          const layerId = `relation-line-${i}`;
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [rel.from, rel.to] },
                properties: {},
              }],
            },
          });
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: { 'line-color': rel.color, 'line-width': 2, 'line-opacity': 0.7 },
          });
        });
      }

      const geojson = {
        type: 'FeatureCollection' as const,
        features: validPoints.map((point) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [point.lon, point.lat] },
          properties: {
            id: point.id,
            title: point.title,
            subtitle: point.subtitle || '',
            href: point.href,
            color: point.color,
            isMain: highlightId ? point.id === highlightId : false,
          },
        })),
      };

      map.addSource('points', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'points-circles',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-radius': ['case', ['get', 'isMain'], 10, 8],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.85,
          'circle-stroke-width': ['case', ['get', 'isMain'], 3, 2],
          'circle-stroke-color': '#ffffff',
        },
      });

      // Click popup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on('click', 'points-circles', (e: any) => {
        if (!e.features?.length) return;
        const feature = e.features[0];
        const coords = feature.geometry.coordinates.slice();
        const p = feature.properties;

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: true, maxWidth: '300px' })
          .setLngLat(coords)
          .setHTML(`
            <div style="padding:12px;min-width:180px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span style="width:12px;height:12px;border-radius:50%;flex-shrink:0;background:${p?.color}"></span>
                <strong style="font-size:13px">${p?.title || 'Unknown'}</strong>
              </div>
              ${p?.subtitle ? `<p style="font-size:12px;color:#666;margin-bottom:8px">${p.subtitle}</p>` : ''}
              <a href="${p?.href}" style="font-size:12px;color:#6d28d9">View details →</a>
            </div>
          `)
          .addTo(map);
      });

      map.on('mouseenter', 'points-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'points-circles', () => { map.getCanvas().style.cursor = ''; });

      // Fit bounds — filter circle takes priority over point positions
      if (!fitToCircle()) {
        const bounds = new maplibregl.LngLatBounds();
        validPoints.forEach((p) => bounds.extend([p.lon, p.lat]));
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 1000 });
        }
      }
    };

    const timer = setTimeout(update, 100);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validPoints, mapLoaded, relations, highlightId, center?.[0], center?.[1], radiusKm]);

  if (mapError) {
    return (
      <div
        style={{ width: '100%', height }}
        className="bg-gray-100 flex items-center justify-center text-sm text-gray-400 rounded-lg"
      >
        Map unavailable
      </div>
    );
  }

  return <div ref={mapContainerRef} style={{ width: '100%', height }} />;
}

/** Small color legend overlaid on a map corner. */
export function MapLegendOverlay({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white/95 border border-border rounded-lg shadow-sm px-3 py-2 space-y-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-xs text-gray-700">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
