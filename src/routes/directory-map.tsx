import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getOrganizations, ORG_KINDS } from '../lib/organizations';
import { LocationFilter } from '../components/LocationFilter';
import type { LocationFilterParams } from '../components/LocationFilter';
import { OrgListRow } from '../components/OrgShared';
import { OrganizationsMap } from '../components/OrganizationsMap';

const ALL_KINDS = Object.entries(ORG_KINDS);
const ALL_KIND_KEYS = Object.keys(ORG_KINDS);
const PER_PAGE = 20;

export function DirectoryMapPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as {
    search?: string;
    kinds?: string;
    claimed?: string;
    country?: string;
    lon?: number;
    lat?: number;
    radius?: number;
    location_label?: string;
  };

  const { search, kinds, claimed, country, lon, lat, radius } = searchParams;

  const claimedFilter = claimed ?? 'true';
  const byClaimedParam = claimedFilter === 'all' ? undefined : claimedFilter;

  const selectedKinds = kinds ? kinds.split(',') : [];
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        filtersOpen &&
        filterRef.current && !filterRef.current.contains(e.target as Node) &&
        filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)
      ) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filtersOpen]);

  const activeFilterCount =
    (claimedFilter !== 'true' ? 1 : 0) +
    (selectedKinds.length > 0 ? 1 : 0) +
    (country || lon !== undefined ? 1 : 0);

  const filterParams = { search, kinds, claimed: claimedFilter, country, lon, lat, radius };

  // Infinite scroll list query
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['organizations', 'directory-map', filterParams],
    queryFn: ({ pageParam }) => getOrganizations({
      page: pageParam,
      per_page: PER_PAGE,
      search,
      kinds,
      by_claimed: byClaimedParam,
      by_country: country,
      lon,
      lat,
      radius,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page ?? undefined,
  });

  const organizations = data?.pages.flatMap((p) => p.organizations) ?? [];
  const totalCount = data?.pages[0]?.meta.total_count ?? 0;

  // Map query — same filters, no pagination
  const mapQuery = useQuery({
    queryKey: ['organizations', 'map', filterParams],
    queryFn: () => getOrganizations({
      per_page: 1000,
      search,
      kinds,
      by_claimed: byClaimedParam,
      by_country: country,
      lon,
      lat,
      radius,
    }),
  });

  // Intersection observer for infinite scroll
  const observerRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const updateSearch = (updates: Record<string, unknown>) => {
    navigate({
      to: '/organizations',
      search: { ...searchParams, ...updates },
    });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get('search') as string) || '';
    updateSearch({ search: q || undefined });
  };

  const toggleKind = (kind: string) => {
    const next = selectedKinds.includes(kind)
      ? selectedKinds.filter((k) => k !== kind)
      : [...selectedKinds, kind];
    updateSearch({ kinds: next.length > 0 ? next.join(',') : undefined });
  };

  const handleLocationChange = (loc: LocationFilterParams) => {
    updateSearch({
      country: loc.country || undefined,
      lon: loc.lon,
      lat: loc.lat,
      radius: loc.radius,
      location_label: loc.location_label,
    });
  };

  const clearAllFilters = () => {
    updateSearch({
      kinds: undefined,
      claimed: undefined,
      country: undefined,
      lon: undefined,
      lat: undefined,
      radius: undefined,
      location_label: undefined,
    });
  };

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left panel — list */}
      <div className="w-[420px] flex-shrink-0 border-r border-border bg-white flex flex-col overflow-hidden">
        <div className="p-4 space-y-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Directory Map</h1>
            <Link
              to="/organizations/new"
              className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-primary/90 whitespace-nowrap"
            >
              + New
            </Link>
          </div>

          {/* Search bar + Filter icon + View toggle */}
          <div className="flex gap-2 items-center">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                name="search"
                defaultValue={search || ''}
                placeholder="Search organizations..."
                className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </form>

            <div className="relative">
              <button
                ref={filterBtnRef}
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`relative border rounded-lg px-3 py-2 text-sm transition-colors ${
                  filtersOpen || activeFilterCount > 0
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
                title="Filters"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75M10.5 18a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 18H7.5m6-6h6.75M13.5 12a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12h7.5" />
                </svg>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Filter panel */}
          {filtersOpen && (
            <div ref={filterRef} className="border border-border rounded-lg bg-white p-4 space-y-4 shadow-sm">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Status</label>
                <div className="flex gap-2">
                  {([
                    { value: 'true', label: 'Claimed' },
                    { value: 'false', label: 'Unclaimed' },
                    { value: 'all', label: 'All' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSearch({ claimed: opt.value === 'true' ? undefined : opt.value })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        claimedFilter === opt.value
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Organization type</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_KINDS.map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleKind(key)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedKinds.includes(key)
                          ? `${cfg.badgeColor} ring-2 ring-offset-1 ring-primary/30`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Location</label>
                <LocationFilter
                  value={{ country, lon, lat, radius, location_label: searchParams.location_label }}
                  onChange={handleLocationChange}
                />
              </div>

              {activeFilterCount > 0 && (
                <div className="pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && <p className="p-4 text-muted-foreground">Loading...</p>}
          {error && <p className="p-4 text-destructive">Failed to load organizations</p>}

          {data && (
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">{totalCount} results</p>

              <div className="divide-y divide-border border border-border rounded-lg bg-card">
                {organizations.map((org) => (
                  <OrgListRow
                    key={org.id}
                    org={org}
                    linkTo={`/organizations/${org.slug || org.id}`}
                  />
                ))}
                {organizations.length === 0 && (
                  <p className="px-4 py-8 text-center text-muted-foreground">No organizations found</p>
                )}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={observerRef} className="h-4" />
              {isFetchingNextPage && (
                <p className="text-center text-sm text-muted-foreground">Loading more...</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right panel — map */}
      <div className="flex-1 relative">
        {mapQuery.isLoading && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading map...
          </div>
        )}
        {mapQuery.data && (
          <OrganizationsMap
            organizations={mapQuery.data.organizations}
            selectedKinds={selectedKinds.length > 0 ? selectedKinds : ALL_KIND_KEYS}
            height="100%"
          />
        )}
      </div>
    </div>
  );
}
