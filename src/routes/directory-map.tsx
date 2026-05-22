import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getOrganizations, ORG_KINDS } from '../lib/organizations';
import { taxonomyToSpecialties } from '../lib/listings';
import { LocationFilter } from '../components/LocationFilter';
import type { LocationFilterParams } from '../components/LocationFilter';
import { DirectoryMapLayout } from '../components/DirectoryMapLayout';

const ALL_KINDS = Object.entries(ORG_KINDS);
const PER_PAGE = 20;
const EUROPE_BOUNDS: [[number, number], [number, number]] = [[-11, 34], [45, 58]];

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
    by_type?: string;
    by_category?: string;
    by_subcategory?: string;
  };

  const { search, kinds, claimed, country, lon, lat, radius, by_type, by_category, by_subcategory } = searchParams;

  const claimedFilter = claimed ?? 'true';
  const byClaimedParam = claimedFilter === 'all' ? undefined : claimedFilter;
  const selectedKinds = kinds ? kinds.split(',') : [];

  const specialties = taxonomyToSpecialties({ by_type, by_category, by_subcategory });

  const activeFilterCount =
    (claimedFilter !== 'true' ? 1 : 0) +
    (selectedKinds.length > 0 ? 1 : 0) +
    (country || lon !== undefined ? 1 : 0);

  const filterParams = { search, kinds, claimed: claimedFilter, country, lon, lat, radius, specialties };

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
      specialties,
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

  const mapQuery = useQuery({
    queryKey: ['organizations', 'map', filterParams],
    queryFn: () => getOrganizations({
      per_page: 1000,
      search,
      kinds,
      specialties,
      by_claimed: byClaimedParam,
      by_country: country,
      lon,
      lat,
      radius,
    }),
  });

  const updateSearch = (updates: Record<string, unknown>) => {
    navigate({
      to: '/global',
      search: { ...searchParams, ...updates },
    });
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

  return (
    <DirectoryMapLayout
      searchDefault={search}
      searchPlaceholder="Search organizations..."
      onSearchSubmit={(q) => updateSearch({ search: q || undefined })}
      activeFilterCount={activeFilterCount}
      filterContent={
        <>
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
                onClick={() => updateSearch({
                  kinds: undefined,
                  claimed: undefined,
                  country: undefined,
                  lon: undefined,
                  lat: undefined,
                  radius: undefined,
                  location_label: undefined,
                })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </>
      }
      by_type={by_type}
      by_category={by_category}
      by_subcategory={by_subcategory}
      onTaxonomyFilter={(params) => updateSearch({ ...params })}
      actionButton={
        <Link
          to="/organizations/new"
          className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-primary/90 whitespace-nowrap"
        >
          + Add Member
        </Link>
      }
      items={organizations.map((org) => ({
        key: org.id,
        org,
        linkTo: `/organizations/${org.slug || org.id}`,
      }))}
      totalCount={totalCount}
      resultLabel="results"
      isLoading={isLoading}
      error={error}
      hasNextPage={hasNextPage ?? false}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      mapOrganizations={mapQuery.data?.organizations ?? []}
      mapLoading={mapQuery.isLoading}
      selectedKinds={selectedKinds}
      maxBounds={EUROPE_BOUNDS}
    />
  );
}
