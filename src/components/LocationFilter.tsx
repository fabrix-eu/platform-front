import { useState, useRef, useEffect, useCallback } from 'react';
import {
  loadGoogleMapsScript,
  isGoogleMapsLoaded,
} from '../lib/google-maps-loader';

export interface LocationFilterParams {
  country?: string;
  lon?: number;
  lat?: number;
  radius?: number;
  location_label?: string;
}

interface LocationFilterProps {
  value: LocationFilterParams;
  onChange: (params: LocationFilterParams) => void;
}

const EU_COUNTRIES: { code: string; name: string }[] = [
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DE', name: 'Germany' },
  { code: 'EE', name: 'Estonia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'GR', name: 'Greece' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'HR', name: 'Croatia' },
  { code: 'IT', name: 'Italy' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'HU', name: 'Hungary' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'AT', name: 'Austria' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'FI', name: 'Finland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'NO', name: 'Norway' },
  { code: 'TR', name: 'Turkey' },
];

const RADIUS_OPTIONS = [25, 50, 100, 200, 500];

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CitySuggestion {
  place_id: string;
  description: string;
}

export function LocationFilter({ value, onChange }: LocationFilterProps) {
  const [cityQuery, setCityQuery] = useState(value.location_label ?? '');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const autocompleteRef = useRef<any>(null);
  const placesRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (isGoogleMapsLoaded()) { setMapLoaded(true); return; }
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;
      try { await loadGoogleMapsScript(apiKey); setMapLoaded(true); } catch { /* noop */ }
    };
    load();
  }, []);

  useEffect(() => {
    if (mapLoaded && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.AutocompleteService();
      const div = document.createElement('div');
      placesRef.current = new window.google.maps.places.PlacesService(div);
    }
  }, [mapLoaded]);

  useEffect(() => {
    if (justSelectedRef.current) { justSelectedRef.current = false; return; }
    if (!cityQuery || cityQuery.length < 2 || !autocompleteRef.current) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      autocompleteRef.current.getPlacePredictions(
        { input: cityQuery, types: ['(cities)'] },
        (preds: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && preds) {
            setSuggestions(preds.map((p: any) => ({ place_id: p.place_id, description: p.description })));
          } else {
            setSuggestions([]);
          }
        },
      );
    }, 300);
    return () => clearTimeout(t);
  }, [cityQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleCitySelect = useCallback((placeId: string, description: string) => {
    if (!placesRef.current) return;
    placesRef.current.getDetails({ placeId, fields: ['geometry', 'address_components'] }, (place: any, status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        if (lat === undefined || lng === undefined) return;

        let countryCode = value.country;
        if (place.address_components) {
          for (const c of place.address_components) {
            if (c.types.includes('country')) {
              countryCode = c.short_name;
              break;
            }
          }
        }

        justSelectedRef.current = true;
        setCityQuery(description.split(',')[0]);
        setSuggestions([]);
        setShowDropdown(false);
        onChange({
          ...value,
          lon: lng,
          lat,
          radius: value.radius || 100,
          location_label: description.split(',')[0],
          country: countryCode,
        });
      }
    });
  }, [onChange, value]);

  const hasLocation = value.lon !== undefined && value.lat !== undefined;
  const hasAnyFilter = value.country || hasLocation;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-gray-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      </div>

      {/* Country */}
      <select
        value={value.country || ''}
        onChange={(e) => {
          const country = e.target.value || undefined;
          onChange({ ...value, country });
        }}
        className="border border-border rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All countries</option>
        {EU_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </select>

      {/* City search */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={cityQuery}
          onChange={(e) => {
            setCityQuery(e.target.value);
            setShowDropdown(true);
            if (!e.target.value) {
              onChange({ ...value, lon: undefined, lat: undefined, radius: undefined, location_label: undefined });
            }
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search city..."
          className="border border-border rounded-lg px-2.5 py-1.5 text-sm w-44 bg-white focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 bg-white border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1"
          >
            {suggestions.map((s) => (
              <button
                key={s.place_id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                onClick={() => handleCitySelect(s.place_id, s.description)}
              >
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span className="truncate">{s.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Radius */}
      {hasLocation && (
        <select
          value={value.radius || 100}
          onChange={(e) => onChange({ ...value, radius: Number(e.target.value) })}
          className="border border-border rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>{r} km</option>
          ))}
        </select>
      )}

      {/* Clear */}
      {hasAnyFilter && (
        <button
          onClick={() => {
            setCityQuery('');
            onChange({});
          }}
          className="text-xs text-gray-500 hover:text-gray-700 px-1.5"
        >
          Clear location
        </button>
      )}
    </div>
  );
}
