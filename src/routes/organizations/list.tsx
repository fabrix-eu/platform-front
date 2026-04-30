import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrganizations, ORG_KINDS } from '../../lib/organizations';
import { LocationFilter } from '../../components/LocationFilter';
import type { LocationFilterParams } from '../../components/LocationFilter';
import { OrgCard, OrgListRow } from '../../components/OrgShared';

const ALL_KINDS = Object.entries(ORG_KINDS);

export function OrganizationsListPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as {
    search?: string;
    page?: number;
    kinds?: string;
    claimed?: string;
    country?: string;
    lon?: number;
    lat?: number;
    radius?: number;
    location_label?: string;
  };

  const { search, page, kinds, claimed, country, lon, lat, radius } = searchParams;

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

  const query = useQuery({
    queryKey: ['organizations', { page, search, kinds, claimed: claimedFilter, country, lon, lat, radius }],
    queryFn: () => getOrganizations({
      page: page || 1,
      per_page: 20,
      search,
      kinds,
      by_claimed: byClaimedParam,
      by_country: country,
      lon,
      lat,
      radius,
    }),
  });

  const updateSearch = (updates: Record<string, unknown>) => {
    navigate({
      to: '/directory',
      search: { ...searchParams, page: 1, ...updates },
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

  const [view, setView] = useState<'list' | 'cards'>('cards');
  const meta = query.data?.meta;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Directory</h1>

      {/* Search bar + Filter icon + View toggle + Add */}
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

        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            title="List view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setView('cards')}
            className={`px-3 py-2 text-sm border-l border-border ${view === 'cards' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            title="Cards view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
          </button>
        </div>

        <Link
          to="/organizations/new"
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
        >
          New Organization
        </Link>
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

      {/* Content */}
      {query.isLoading && <p className="text-muted-foreground">Loading...</p>}
      {query.error && <p className="text-destructive">Failed to load organizations</p>}

      {query.data && (
        <>
          <p className="text-sm text-muted-foreground">{meta?.total_count ?? 0} results</p>

          {view === 'list' && (
            <div className="divide-y divide-border border border-border rounded-lg bg-card">
              {query.data.organizations.map((org) => (
                <OrgListRow
                  key={org.id}
                  org={org}
                  linkTo={`/organizations/${org.slug || org.id}`}
                />
              ))}
              {query.data.organizations.length === 0 && (
                <p className="px-4 py-8 text-center text-muted-foreground">No organizations found</p>
              )}
            </div>
          )}

          {view === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {query.data.organizations.map((org) => (
                <OrgCard key={org.id} org={org} linkTo={`/organizations/${org.slug || org.id}`} />
              ))}
              {query.data.organizations.length === 0 && (
                <p className="text-center text-muted-foreground col-span-2">No organizations found</p>
              )}
            </div>
          )}

          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              {meta.prev_page && (
                <Link
                  to="/directory"
                  search={{ ...searchParams, page: meta.prev_page }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  &larr; Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {meta.current_page} of {meta.total_pages}
              </span>
              {meta.next_page && (
                <Link
                  to="/directory"
                  search={{ ...searchParams, page: meta.next_page }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
