import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { searchCity, type GeocodingSuggestion } from '../../lib/geocoding';
import { EU_COUNTRIES } from '../../lib/countries';
import {
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_SUBCATEGORIES,
  CATEGORIES_BY_TYPE,
} from '../../lib/listings';
import { RADIUS_OPTIONS, type ResolvedLocation } from '../../lib/explore';

/** URL updates pushed by a filter section (undefined removes the param). */
export type FilterUpdates = Record<string, string | number | undefined>;

export function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      {children}
    </section>
  );
}

// ── Text search ──────────────────────────────────────────────

export function SearchSection({
  defaultValue,
  placeholder,
  onSearch,
}: {
  defaultValue?: string;
  placeholder: string;
  onSearch: (value: string) => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSearch((fd.get('search') as string) || '');
      }}
    >
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          key={defaultValue || ''}
          name="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </form>
  );
}

// ── Location: Near ("Me" | city) + radius + country ──────────

export function LocationSection({
  location,
  hasMyLocation,
  country,
  onChange,
}: {
  location: ResolvedLocation;
  hasMyLocation: boolean;
  country?: string;
  onChange: (updates: FilterUpdates) => void;
}) {
  const [cityQuery, setCityQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const justSelectedRef = useRef(false);

  // Debounced city search via Photon
  useEffect(() => {
    if (justSelectedRef.current) { justSelectedRef.current = false; return; }
    if (!cityQuery || cityQuery.length < 2) return;
    const t = setTimeout(() => {
      searchCity(cityQuery).then(setSuggestions);
    }, 300);
    return () => clearTimeout(t);
  }, [cityQuery]);

  const visibleSuggestions = cityQuery.length >= 2 ? suggestions : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectCity = (s: GeocodingSuggestion) => {
    const label = s.city || s.label.split(',')[0];
    justSelectedRef.current = true;
    setCityQuery('');
    setSuggestions([]);
    // Note: deliberately does NOT touch the country filter — picking a city
    // must not silently exclude results from other countries.
    onChange({
      near: undefined,
      lon: s.lon,
      lat: s.lat,
      location_label: label,
    });
  };

  const selectMe = () => {
    setCityQuery('');
    onChange({ near: undefined, lon: undefined, lat: undefined, location_label: undefined });
  };

  const clearLocation = () => {
    setCityQuery('');
    onChange({ near: 'all', lon: undefined, lat: undefined, location_label: undefined });
  };

  return (
    <FilterSection title="Location">
      <div className="space-y-2.5">
        {/* Active location chip */}
        {location.active ? (
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-2.5 py-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate flex-1" title={location.label}>
              {location.isMe ? `Me — ${location.label ?? 'my organization'}` : location.label ?? 'Selected place'}
            </span>
            <button type="button" onClick={clearLocation} aria-label="Clear location" className="hover:opacity-70 shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400 px-0.5">All locations</p>
        )}

        {/* Me shortcut */}
        {hasMyLocation && !location.isMe && (
          <button
            type="button"
            onClick={selectMe}
            className="w-full text-left border border-border rounded-lg px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Near me (my organization)
          </button>
        )}

        {/* City search */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={cityQuery}
            onChange={(e) => setCityQuery(e.target.value)}
            placeholder="Near a city..."
            className="w-full border border-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {visibleSuggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-30 left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden"
            >
              {visibleSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectCity(s)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Radius */}
        {location.active && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Radius</label>
            <select
              value={location.radius}
              onChange={(e) => onChange({ radius: Number(e.target.value) })}
              className="flex-1 border border-border rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {RADIUS_OPTIONS.map((km) => (
                <option key={km} value={km}>{km} km</option>
              ))}
            </select>
          </div>
        )}

        {/* Country */}
        <select
          value={country || ''}
          onChange={(e) => onChange({ country: e.target.value || undefined })}
          className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All countries</option>
          {EU_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>
    </FilterSection>
  );
}

// ── Listing type taxonomy (type → category → subcategory) ────

export function TaxonomySection({
  by_type,
  by_category,
  by_subcategory,
  onChange,
}: {
  by_type?: string;
  by_category?: string;
  by_subcategory?: string;
  onChange: (updates: FilterUpdates) => void;
}) {
  return (
    <FilterSection title="Type">
      <ul className="space-y-1">
        {Object.entries(LISTING_TYPES).map(([typeKey, typeCfg]) => {
          const isTypeActive = by_type === typeKey;
          return (
            <li key={typeKey}>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    by_type: isTypeActive ? undefined : typeKey,
                    by_category: undefined,
                    by_subcategory: undefined,
                  })
                }
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isTypeActive ? typeCfg.badgeColor : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {typeCfg.label}
              </button>

              {isTypeActive && (
                <ul className="ml-2.5 mt-1 space-y-0.5 border-l border-border pl-2.5">
                  {(CATEGORIES_BY_TYPE[typeKey] ?? []).map((catKey) => {
                    const isCatActive = by_category === catKey;
                    const subcats = LISTING_SUBCATEGORIES[catKey] ?? {};
                    return (
                      <li key={catKey}>
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              by_type: typeKey,
                              by_category: isCatActive ? undefined : catKey,
                              by_subcategory: undefined,
                            })
                          }
                          className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                            isCatActive ? 'text-primary font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {LISTING_CATEGORIES[catKey]?.label ?? catKey}
                        </button>

                        {isCatActive && Object.keys(subcats).length > 0 && (
                          <ul className="ml-2 mt-0.5 space-y-0.5 border-l border-border pl-2">
                            {Object.entries(subcats).map(([subKey, subCfg]) => {
                              const isSubActive = by_subcategory === subKey;
                              return (
                                <li key={subKey}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onChange({
                                        by_type: typeKey,
                                        by_category: catKey,
                                        by_subcategory: isSubActive ? undefined : subKey,
                                      })
                                    }
                                    className={`w-full text-left px-2 py-0.5 rounded text-[13px] transition-colors ${
                                      isSubActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                  >
                                    {subCfg.label}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </FilterSection>
  );
}
