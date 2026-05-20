import { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  searchAddress,
  reverseGeocode,
  type GeocodingSuggestion,
} from '../lib/geocoding';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export interface AddressData {
  address: string;
  lat: number;
  lon: number;
  country_code: string;
  city?: string;
  postal_code?: string;
  country_name?: string;
}

interface Props {
  onSelect: (location: AddressData) => void;
  placeholder?: string;
  label?: string;
  initialAddress?: string;
  initialLocation?: AddressData | null;
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export function PhotonAddressAutocomplete({
  onSelect,
  placeholder = 'Start typing at least 3 characters...',
  label = 'Address',
  initialAddress = '',
  initialLocation = null,
}: Props) {
  const [address, setAddress] = useState(
    initialLocation?.address || initialAddress
  );
  const [selectedLocation, setSelectedLocation] =
    useState<AddressData | null>(initialLocation);
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const justSelectedRef = useRef(false);
  const draggedRef = useRef(false);
  const userTypedRef = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  // Debounced search via Photon
  useEffect(() => {
    if (!userTypedRef.current) return;
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (!address || address.length < 3) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
      searchAddress(address).then((results) => {
        setSuggestions(results);
        setSelectedIndex(-1);
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [address]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [mapError, setMapError] = useState(false);

  // Init or update mini map when location changes
  useEffect(() => {
    if (!selectedLocation || !mapContainerRef.current) return;

    const { lon, lat } = selectedLocation;

    if (mapRef.current) {
      if (draggedRef.current) {
        draggedRef.current = false;
        return;
      }
      mapRef.current.flyTo({ center: [lon, lat], zoom: 15 });
      markerRef.current?.setLngLat([lon, lat]);
      return;
    }

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        center: [lon, lat],
        zoom: 15,
        attributionControl: false,
      });

      const marker = new maplibregl.Marker({ draggable: true, color: '#7c3aed' })
        .setLngLat([lon, lat])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        reverseGeocode(lngLat.lat, lngLat.lng).then((result) => {
          const updated: AddressData = result
            ? {
                address: result.address,
                lat: lngLat.lat,
                lon: lngLat.lng,
                country_code: result.country_code || '',
                city: result.city,
                postal_code: result.postal_code,
                country_name: result.country_name,
              }
            : {
                address: selectedLocation.address,
                lat: lngLat.lat,
                lon: lngLat.lng,
                country_code: selectedLocation.country_code,
                city: selectedLocation.city,
                postal_code: selectedLocation.postal_code,
                country_name: selectedLocation.country_name,
              };
          draggedRef.current = true;
          justSelectedRef.current = true;
          setSelectedLocation(updated);
          setAddress(updated.address);
          onSelect(updated);
        });
      });

      mapRef.current = map;
      markerRef.current = marker;
    } catch {
      setMapError(true);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation?.lat, selectedLocation?.lon]);

  const handlePlaceSelect = useCallback(
    (suggestion: GeocodingSuggestion) => {
      const data: AddressData = {
        address: suggestion.address,
        lat: suggestion.lat,
        lon: suggestion.lon,
        country_code: suggestion.country_code || '',
        city: suggestion.city,
        postal_code: suggestion.postal_code,
        country_name: suggestion.country_name,
      };
      justSelectedRef.current = true;
      setSelectedLocation(data);
      setAddress(suggestion.label);
      onSelect(data);
      setSuggestions([]);
    },
    [onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? suggestions.length - 1 : prev - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handlePlaceSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setSuggestions([]);
        break;
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="address-autocomplete"
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id="address-autocomplete"
          type="text"
          value={address}
          onChange={(e) => {
            const value = e.target.value;
            userTypedRef.current = true;
            setAddress(value);
            if (selectedLocation && value !== selectedLocation.address) {
              setSelectedLocation(null);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
          >
            {suggestions.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                  i === selectedIndex ? 'bg-blue-50 text-blue-700' : ''
                }`}
                onClick={() => handlePlaceSelect(s)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <PinIcon className="h-4 w-4 text-gray-400 shrink-0" />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-t border border-green-200">
            <PinIcon className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">{selectedLocation.address}</div>
              {selectedLocation.city && selectedLocation.country_name && (
                <div className="text-xs text-green-500">
                  {selectedLocation.city}, {selectedLocation.country_name}
                </div>
              )}
              {!mapError && (
                <div className="text-xs text-green-500 mt-0.5">
                  Drag the marker to adjust the position
                </div>
              )}
            </div>
          </div>
          {!mapError && (
            <div
              ref={mapContainerRef}
              className="h-48 rounded-b border border-t-0 border-green-200"
            />
          )}
        </div>
      )}
    </div>
  );
}
