import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getOrganizations, getOrganizationsMap, ORG_KINDS } from '../lib/organizations';
import { taxonomyToSpecialties } from '../lib/listings';
import {
  useMyOrgLocation,
  resolveLocation,
  geoApiParams,
  EUROPE_BOUNDS,
  type ViewMode,
  type ExploreLocationSearch,
} from '../lib/explore';
import { ExploreShell, InfiniteScrollSentinel } from '../components/explore/ExploreShell';
import {
  SearchSection,
  LocationSection,
  TaxonomySection,
  FilterSection,
  type FilterUpdates,
} from '../components/explore/ExploreFilters';
import { PointsMap, MapLegendOverlay, type MapPoint } from '../components/explore/PointsMap';
import { OrgCard, OrgListRow } from '../components/OrgShared';
import { EmptyState, GridSkeleton, ListSkeleton } from '../components/ExploreList';

const ALL_KINDS = Object.entries(ORG_KINDS);

type DirectorySearch = ExploreLocationSearch & {
  search?: string;
  view?: ViewMode;
  kinds?: string;
  claimed?: string;
  by_type?: string;
  by_category?: string;
  by_subcategory?: string;
};

export function DirectoryMapPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as DirectorySearch;
  const { search, kinds, claimed, country, by_type, by_category, by_subcategory } = searchParams;
  const view = searchParams.view ?? 'cards';

  const claimedFilter = claimed ?? 'true';
  const byClaimedParam = claimedFilter === 'all' ? undefined : claimedFilter;
  const selectedKinds = kinds ? kinds.split(',') : [];
  const specialties = taxonomyToSpecialties({ by_type, by_category, by_subcategory });

  const myLocation = useMyOrgLocation();
  const location = resolveLocation(searchParams, myLocation);
  const geo = geoApiParams(location, country);

  const apiParams = {
    search,
    kinds,
    specialties,
    by_claimed: byClaimedParam,
    by_country: geo.country,
    lon: geo.lon,
    lat: geo.lat,
    radius: geo.radius,
  };

  const listQuery = useInfiniteQuery({
    queryKey: ['organizations', 'explore', apiParams],
    queryFn: ({ pageParam }) => getOrganizations({ ...apiParams, page: pageParam, per_page: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page ?? undefined,
    enabled: view !== 'map',
  });

  const mapQuery = useQuery({
    queryKey: ['organizations', 'explore-map', apiParams],
    queryFn: () => getOrganizationsMap(apiParams),
    enabled: view === 'map',
  });

  const organizations = listQuery.data?.pages.flatMap((p) => p.organizations) ?? [];
  const totalCount =
    view === 'map'
      ? mapQuery.data?.meta.total_count
      : listQuery.data?.pages[0]?.meta.total_count;

  const update = (updates: FilterUpdates) => {
    navigate({ to: '/global', search: { ...searchParams, ...updates } });
  };

  const toggleKind = (kind: string) => {
    const next = selectedKinds.includes(kind)
      ? selectedKinds.filter((k) => k !== kind)
      : [...selectedKinds, kind];
    update({ kinds: next.length > 0 ? next.join(',') : undefined });
  };

  const mapPoints: MapPoint[] = (mapQuery.data?.organizations ?? [])
    .filter((org) => org.lon != null && org.lat != null)
    .map((org) => ({
      id: org.id,
      lon: org.lon!,
      lat: org.lat!,
      color: ORG_KINDS[org.kind ?? '']?.hex ?? '#6B7280',
      title: org.name,
      subtitle: org.address || undefined,
      href: `/organizations/${org.slug || org.id}`,
    }));

  const isEmpty = !listQuery.isLoading && organizations.length === 0;

  return (
    <ExploreShell
      featureKey="directory"
      title="Directory"
      description="Discover organizations across the circular textile ecosystem — designers, producers, collectors, recyclers, brands and more."
      action={
        <Link
          to="/organizations/new"
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
        >
          + Add Member
        </Link>
      }
      view={view}
      onViewChange={(v) => update({ view: v === 'cards' ? undefined : v })}
      resultCount={totalCount}
      resultLabel="organizations"
      filters={
        <>
          <SearchSection
            defaultValue={search}
            placeholder="Search organizations..."
            onSearch={(q) => update({ search: q || undefined })}
          />
          <LocationSection
            location={location}
            hasMyLocation={myLocation !== null}
            country={country}
            onChange={update}
          />
          <FilterSection title="Organization type">
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
          </FilterSection>
          <TaxonomySection
            by_type={by_type}
            by_category={by_category}
            by_subcategory={by_subcategory}
            onChange={update}
          />
          <FilterSection title="Status">
            <div className="flex gap-2">
              {([
                { value: 'true', label: 'Claimed' },
                { value: 'false', label: 'Unclaimed' },
                { value: 'all', label: 'All' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ claimed: opt.value === 'true' ? undefined : opt.value })}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    claimedFilter === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </FilterSection>
        </>
      }
    >
      {view === 'map' ? (
        <>
          <PointsMap
            points={mapPoints}
            center={location.active ? [location.lon!, location.lat!] : undefined}
            radiusKm={location.active ? location.radius : undefined}
            maxBounds={EUROPE_BOUNDS}
          />
          <MapLegendOverlay
            items={(selectedKinds.length > 0 ? ALL_KINDS.filter(([k]) => selectedKinds.includes(k)) : ALL_KINDS)
              .map(([, cfg]) => ({ label: cfg.label, color: cfg.hex }))}
          />
        </>
      ) : listQuery.isLoading ? (
        view === 'cards' ? <GridSkeleton /> : <ListSkeleton />
      ) : listQuery.error ? (
        <p className="text-destructive">Failed to load organizations</p>
      ) : isEmpty ? (
        <EmptyState
          icon={
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
          title="No organizations found"
          message="Try adjusting your filters or search terms."
        />
      ) : (
        <>
          {view === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <OrgCard key={org.id} org={org} linkTo={`/organizations/${org.slug || org.id}`} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {organizations.map((org) => (
                <OrgListRow key={org.id} org={org} linkTo={`/organizations/${org.slug || org.id}`} />
              ))}
            </div>
          )}
          <InfiniteScrollSentinel
            hasNextPage={listQuery.hasNextPage ?? false}
            isFetchingNextPage={listQuery.isFetchingNextPage}
            fetchNextPage={listQuery.fetchNextPage}
          />
        </>
      )}
    </ExploreShell>
  );
}
