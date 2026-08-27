import { Link, useNavigate, useSearch } from '@tanstack/react-router';
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
import { AddOrganizationForm } from '../../components/facilitator/AddOrganizationForm';
import { getInitials } from '../../lib/utils';

const ALL_KINDS = Object.entries(ORG_KINDS);

function HealthBadge({ level }: { level: string }) {
  if (level === 'unknown') return null;
  const cfg = HEALTH_LEVELS[level];
  if (!cfg) return null;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.badgeColor}`}>{cfg.label}</span>;
}

function NetworkOrgCard({ record, networkSlug }: { record: NetworkOrganization; networkSlug: string }) {
  const org = record.organization;
  const kind = org.kind ? ORG_KINDS[org.kind] : null;
  return (
    <Link
      to="/facilitator/network/$norgId"
      params={{ norgId: record.id }}
      search={{ network: networkSlug }}
      className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all p-4"
    >
      <div className="flex items-start gap-3">
        {org.image_url ? (
          <img src={org.image_url} alt={org.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(org.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-sm text-gray-900 truncate">{org.name}</h3>
          {kind && (
            <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full mt-1 ${kind.badgeColor}`}>{kind.label}</span>
          )}
          {org.address && <p className="text-xs text-gray-400 mt-1 truncate">{org.address}</p>}
          <div className="flex items-center gap-1.5 mt-2">
            <HealthBadge level={record.economic_health} />
            <HealthBadge level={record.environmental_score} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function NetworkOrgRow({ record, networkSlug }: { record: NetworkOrganization; networkSlug: string }) {
  const org = record.organization;
  const kind = org.kind ? ORG_KINDS[org.kind] : null;
  return (
    <Link
      to="/facilitator/network/$norgId"
      params={{ norgId: record.id }}
      search={{ network: networkSlug }}
      className="flex items-center gap-3 bg-white border border-border rounded-lg px-4 py-2.5 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-gray-900 truncate block">{org.name}</span>
        {org.address && <span className="text-xs text-gray-400 truncate block">{org.address}</span>}
      </div>
      {kind && <span className={`shrink-0 text-[10px] px-1.5 py-0 rounded-full ${kind.badgeColor}`}>{kind.label}</span>}
      <HealthBadge level={record.economic_health} />
    </Link>
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

  return (
    <ExploreShell
      featureKey="facilitator-network"
      title="My Network"
      description="The organizations your structure follows — their health, needs and history. This CRM is private to your facilitator team."
      view={view}
      onViewChange={(v) => update({ view: v === 'cards' ? undefined : v })}
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
      {view === 'map' ? (
        <>
          <PointsMap points={mapPoints} maxBounds={EUROPE_BOUNDS} />
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
                <NetworkOrgCard key={record.id} record={record} networkSlug={network.slug} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <NetworkOrgRow key={record.id} record={record} networkSlug={network.slug} />
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
