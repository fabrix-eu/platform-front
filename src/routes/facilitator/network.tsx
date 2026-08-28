import { useNavigate, useSearch } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ORG_KINDS } from '../../lib/organizations';
import {
  getNetworkOrganizations,
  HEALTH_LEVELS,
  type NetworkOrganization,
  type NetworkOrgParams,
} from '../../lib/networks';
import { useFacilitatorNetwork } from '../../lib/useFacilitatorNetwork';
import { EUROPE_BOUNDS, type ViewMode } from '../../lib/explore';
import { ExploreShell, InfiniteScrollSentinel } from '../../components/explore/ExploreShell';
import { SearchSection, FilterSection, type FilterUpdates } from '../../components/explore/ExploreFilters';
import { PointsMap, MapLegendOverlay, type MapPoint } from '../../components/explore/PointsMap';
import { EmptyState, GridSkeleton, ListSkeleton } from '../../components/ExploreList';
import { OrgCard, OrgListRow } from '../../components/OrgShared';
import { AddOrganizationForm } from '../../components/facilitator/AddOrganizationForm';
import { NetworkGraph } from '../../components/facilitator/NetworkGraph';

const ALL_KINDS = Object.entries(ORG_KINDS);

function HealthBadge({ level }: { level: string }) {
  if (level === 'unknown') return null;
  const cfg = HEALTH_LEVELS[level];
  if (!cfg) return null;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.badgeColor}`}>{cfg.label}</span>;
}

function HealthBadges({ record }: { record: NetworkOrganization }) {
  return (
    <>
      <HealthBadge level={record.economic_health} />
      <HealthBadge level={record.environmental_score} />
    </>
  );
}

type NetworkSearch = {
  network?: string;
  search?: string;
  view?: ViewMode;
  kinds?: string;
  economic_health?: string;
};

export function FacilitatorNetworkPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as NetworkSearch;
  const { network, isLoading: networkLoading } = useFacilitatorNetwork();
  const view = searchParams.view ?? 'cards';
  const { search, kinds, economic_health } = searchParams;
  const selectedKinds = kinds ? kinds.split(',') : [];

  const apiParams: NetworkOrgParams = { search, kinds, economic_health };

  const listQuery = useInfiniteQuery({
    queryKey: ['network_organizations', network?.slug, 'list', apiParams],
    queryFn: ({ pageParam }) =>
      getNetworkOrganizations(network!.slug, { ...apiParams, page: pageParam, per_page: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page ?? undefined,
    enabled: !!network && view !== 'map',
  });

  const mapQuery = useQuery({
    queryKey: ['network_organizations', network?.slug, 'map', apiParams],
    queryFn: () => getNetworkOrganizations(network!.slug, { ...apiParams, view: 'map' }),
    enabled: !!network && view === 'map',
  });

  if (networkLoading) return <div className="p-6 text-gray-500">Loading...</div>;
  if (!network) return <div className="p-6 text-gray-500">No network yet — create one from the dashboard.</div>;

  const records = listQuery.data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount = view === 'map' ? mapQuery.data?.meta.total_count : listQuery.data?.pages[0]?.meta.total_count;

  const update = (updates: FilterUpdates) => {
    navigate({ to: '/facilitator/network', search: { ...searchParams, ...updates } });
  };

  const mapPoints: MapPoint[] = (mapQuery.data?.data ?? [])
    .filter((r) => r.organization.lon != null && r.organization.lat != null)
    .map((r) => ({
      id: r.id,
      lon: r.organization.lon!,
      lat: r.organization.lat!,
      color: ORG_KINDS[r.organization.kind ?? '']?.hex ?? '#6B7280',
      title: r.organization.name,
      subtitle: r.organization.address || undefined,
      href: `/facilitator/network/${r.id}?network=${network.slug}`,
    }));

  // Map center: the network's own territory if set, else its central organization
  const mapCenter: [number, number] | undefined =
    network.center_lon != null && network.center_lat != null
      ? [network.center_lon, network.center_lat]
      : network.organization?.lon != null && network.organization?.lat != null
        ? [network.organization.lon, network.organization.lat]
        : undefined;

  return (
    <ExploreShell
      featureKey="facilitator-network"
      title="My Network"
      description="The organizations your structure follows — their health, needs and history. This CRM is private to your facilitator team."
      view={view}
      onViewChange={(v) => update({ view: v === 'cards' ? undefined : v })}
      viewModes={['cards', 'list', 'map', 'graph']}
      resultCount={totalCount}
      resultLabel="organizations"
      filters={
        <>
          <SearchSection
            defaultValue={search}
            placeholder="Search my network..."
            onSearch={(q) => update({ search: q || undefined })}
          />
          <FilterSection title="Add">
            <AddOrganizationForm networkSlug={network.slug} />
          </FilterSection>
          <FilterSection title="Organization type">
            <div className="flex flex-wrap gap-1.5">
              {ALL_KINDS.map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    const next = selectedKinds.includes(key)
                      ? selectedKinds.filter((k) => k !== key)
                      : [...selectedKinds, key];
                    update({ kinds: next.length > 0 ? next.join(',') : undefined });
                  }}
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
          <FilterSection title="Economic health">
            <select
              value={economic_health || ''}
              onChange={(e) => update({ economic_health: e.target.value || undefined })}
              className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All levels</option>
              {Object.entries(HEALTH_LEVELS).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </FilterSection>
        </>
      }
    >
      {view === 'graph' ? (
        <NetworkGraph networkSlug={network.slug} />
      ) : view === 'map' ? (
        <>
          <PointsMap
            points={mapPoints}
            center={mapCenter}
            radiusKm={mapCenter ? (network.radius_km ?? 25) : undefined}
            maxBounds={EUROPE_BOUNDS}
          />
          <MapLegendOverlay
            items={ALL_KINDS.map(([, cfg]) => ({ label: cfg.label, color: cfg.hex }))}
          />
        </>
      ) : listQuery.isLoading ? (
        view === 'cards' ? <GridSkeleton /> : <ListSkeleton />
      ) : records.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18" />
            </svg>
          }
          title="No organizations yet"
          message="Use the search on the left to add organizations from the directory to your network."
        />
      ) : (
        <>
          {view === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {records.map((record) => (
                <OrgCard
                  key={record.id}
                  org={record.organization}
                  linkTo={`/facilitator/network/${record.id}`}
                  search={{ network: network.slug }}
                  extra={<HealthBadges record={record} />}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <OrgListRow
                  key={record.id}
                  org={record.organization}
                  linkTo={`/facilitator/network/${record.id}`}
                  search={{ network: network.slug }}
                  extra={<HealthBadges record={record} />}
                />
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
