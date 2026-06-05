import { useState } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { ORG_KINDS } from '../../lib/organizations';
import { taxonomyToSpecialties } from '../../lib/listings';
import { getCommunity } from '../../lib/communities';
import { getCommunityOrganizations } from '../../lib/community-organizations';
import { DirectoryMapLayout } from '../../components/DirectoryMapLayout';
import { AddMemberModal } from './members';

const ALL_KINDS = Object.entries(ORG_KINDS);
const PER_PAGE = 20;

export function CommunityOverviewPage() {
  const { orgSlug, communitySlug } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
  };
  const navigate = useNavigate();
  const qc = useQueryClient();
  const searchParams = useSearch({ strict: false }) as {
    search?: string;
    kinds?: string;
    by_type?: string;
    by_category?: string;
    by_subcategory?: string;
  };

  const { search, kinds, by_type, by_category, by_subcategory } = searchParams;
  const selectedKinds = kinds ? kinds.split(',') : [];
  const specialties = taxonomyToSpecialties({ by_type, by_category, by_subcategory });
  const [showAddModal, setShowAddModal] = useState(false);

  const activeFilterCount = selectedKinds.length > 0 ? 1 : 0;

  const basePath = `/${orgSlug}/communities/${communitySlug}`;

  const communityQuery = useQuery({
    queryKey: ['communities', communitySlug],
    queryFn: () => getCommunity(communitySlug),
  });

  const community = communityQuery.data;
  const communityCenter: [number, number] | undefined =
    community?.center_lat != null && community?.center_lon != null
      ? [community.center_lon, community.center_lat]
      : undefined;
  const communityRadiusKm = community?.radius_km ?? undefined;

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['community_organizations', communitySlug, 'directory', { search, kinds, specialties }],
    queryFn: ({ pageParam }) => getCommunityOrganizations(communitySlug, {
      page: pageParam,
      per_page: PER_PAGE,
      search,
      kinds,
      specialties,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page ?? undefined,
  });

  const members = data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount = data?.pages[0]?.meta.total_count ?? 0;

  const mapQuery = useQuery({
    queryKey: ['community_organizations', communitySlug, 'map'],
    queryFn: () => getCommunityOrganizations(communitySlug, { per_page: 1000 }),
  });

  const mapOrgs = mapQuery.data?.data.map((co) => co.organization) ?? [];
  const membershipByOrgId = new Map(
    (mapQuery.data?.data ?? []).map((co) => [co.organization.id, co.id]),
  );

  const updateSearch = (updates: Record<string, unknown>) => {
    navigate({
      to: '/$orgSlug/communities/$communitySlug',
      params: { orgSlug, communitySlug },
      search: { ...searchParams, ...updates },
    });
  };

  const toggleKind = (kind: string) => {
    const next = selectedKinds.includes(kind)
      ? selectedKinds.filter((k) => k !== kind)
      : [...selectedKinds, kind];
    updateSearch({ kinds: next.length > 0 ? next.join(',') : undefined });
  };

  const linkBuilder = (org: { id: string; slug: string }) => {
    const membershipId = membershipByOrgId.get(org.id);
    return membershipId
      ? `${basePath}/members/${membershipId}`
      : `/organizations/${org.slug || org.id}`;
  };

  return (
    <DirectoryMapLayout
      searchDefault={search}
      searchPlaceholder="Search members..."
      onSearchSubmit={(q) => updateSearch({ search: q || undefined })}
      activeFilterCount={activeFilterCount}
      filterContent={
        <>
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

          {activeFilterCount > 0 && (
            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => updateSearch({ kinds: undefined })}
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
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-primary/90 whitespace-nowrap"
        >
          + Add
        </button>
      }
      items={members.map((m) => ({
        key: m.id,
        org: m.organization,
        linkTo: `${basePath}/members/${m.id}`,
      }))}
      totalCount={totalCount}
      resultLabel="members"
      isLoading={isLoading}
      error={error}
      hasNextPage={hasNextPage ?? false}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      mapOrganizations={mapOrgs}
      mapLoading={mapQuery.isLoading}
      selectedKinds={selectedKinds}
      mapLinkBuilder={linkBuilder}
      mapCenter={communityCenter}
      mapRadiusKm={communityRadiusKm}
    >
      {showAddModal && (
        <AddMemberModal
          communitySlug={communitySlug}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            qc.invalidateQueries({ queryKey: ['community_organizations', communitySlug] });
            setShowAddModal(false);
          }}
        />
      )}
    </DirectoryMapLayout>
  );
}
