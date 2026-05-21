import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Organization } from '../lib/organizations';
import { ORG_KINDS } from '../lib/organizations';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export interface MapRelationLine {
  from: [number, number]; // [lon, lat]
  to: [number, number];
  color: string;
}

interface OrganizationsMapProps {
  organizations: Organization[];
  height?: string;
  selectedKinds: string[];
  linkBuilder?: (org: { id: string; slug: string }) => string;
  relations?: MapRelationLine[];
  highlightOrgId?: string;
  /** Community center [lon, lat]. When provided, map centers here instead of auto-fitting to orgs. */
  center?: [number, number];
  /** Community territory radius in km. When provided with center, draws a blue circle. */
  radiusKm?: number;
  /** Restrict panning/zoom to these bounds [[swLon, swLat], [neLon, neLat]]. */
  maxBounds?: [[number, number], [number, number]];
}

function getKindColor(org: { kind: string | null }): string {
  return ORG_KINDS[org.kind ?? '']?.hex ?? '#6B7280';
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

export function OrganizationsMap({ organizations, height = '500px', selectedKinds, linkBuilder, relations, highlightOrgId, center, radiusKm, maxBounds }: OrganizationsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popupRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Filter orgs with valid coords + matching selected kinds
  const validOrgs = organizations.filter(
    (org) =>
      org.lat != null && org.lon != null &&
      !isNaN(org.lat) && !isNaN(org.lon) &&
      (selectedKinds.length === 0 || (org.kind && selectedKinds.includes(org.kind)))
  );

  const getDefaultCenter = useCallback((): [number, number] => {
    if (validOrgs.length === 0) return [4.9, 52.4];
    const avgLon = validOrgs.reduce((s, o) => s + o.lon!, 0) / validOrgs.length;
    const avgLat = validOrgs.reduce((s, o) => s + o.lat!, 0) / validOrgs.length;
    return [avgLon, avgLat];
  }, [validOrgs]);

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

  // Update layer
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
      if (map.getLayer('organizations-circles')) map.removeLayer('organizations-circles');
      if (map.getSource('organizations')) map.removeSource('organizations');

      // Draw territory circle
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

      if (validOrgs.length === 0) {
        // Still fit to territory if no orgs
        if (center && radiusKm) {
          const circle = circlePolygon(center, radiusKm);
          const bounds = new maplibregl.LngLatBounds();
          for (const coord of circle.geometry.coordinates[0]) {
            bounds.extend(coord as [number, number]);
          }
          map.fitBounds(bounds, { padding: 30, maxZoom: 14, duration: 1000 });
        }
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
        features: validOrgs.map((org) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [org.lon!, org.lat!] },
          properties: {
            id: org.id,
            name: org.name,
            slug: org.slug,
            kind: org.kind,
            address: org.address || '',
            color: getKindColor(org),
            isMain: highlightOrgId ? org.id === highlightOrgId : false,
          },
        })),
      };

      map.addSource('organizations', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'organizations-circles',
        type: 'circle',
        source: 'organizations',
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
      map.on('click', 'organizations-circles', (e: any) => {
        if (!e.features?.length) return;
        const feature = e.features[0];
        const coords = feature.geometry.coordinates.slice();
        const p = feature.properties;

        const link = linkBuilder
          ? linkBuilder({ id: p?.id, slug: p?.slug })
          : `/organizations/${p?.slug || p?.id}`;

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: true, maxWidth: '300px' })
          .setLngLat(coords)
          .setHTML(`
            <div style="padding:12px;min-width:180px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span style="width:12px;height:12px;border-radius:50%;flex-shrink:0;background:${p?.color}"></span>
                <strong style="font-size:13px">${p?.name || 'Unknown'}</strong>
              </div>
              ${p?.address ? `<p style="font-size:12px;color:#666;margin-bottom:8px">${p.address}</p>` : ''}
              <a href="${link}" style="font-size:12px;color:#6d28d9">View details →</a>
            </div>
          `)
          .addTo(map);
      });

      map.on('mouseenter', 'organizations-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'organizations-circles', () => { map.getCanvas().style.cursor = ''; });

      // Fit bounds — territory circle takes priority over org positions
      if (center && radiusKm) {
        const circle = circlePolygon(center, radiusKm);
        const bounds = new maplibregl.LngLatBounds();
        for (const coord of circle.geometry.coordinates[0]) {
          bounds.extend(coord as [number, number]);
        }
        map.fitBounds(bounds, { padding: 30, maxZoom: 14, duration: 1000 });
      } else {
        const bounds = new maplibregl.LngLatBounds();
        validOrgs.forEach((o) => bounds.extend([o.lon!, o.lat!]));
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 1000 });
        }
      }
    };

    const timer = setTimeout(update, 100);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validOrgs, mapLoaded, relations, highlightOrgId, center?.[0], center?.[1], radiusKm]);

  if (mapError) {
    return (
      <div
        style={{ width: '100%', height, borderRadius: '8px' }}
        className="bg-gray-100 flex items-center justify-center text-sm text-gray-400"
      >
        Map unavailable
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height, borderRadius: '8px' }}
    />
  );
}
