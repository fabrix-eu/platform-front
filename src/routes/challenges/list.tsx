import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAllChallenges } from '../../lib/community-challenges';
import type { Challenge } from '../../lib/community-challenges';
import { LocationFilter } from '../../components/LocationFilter';
import type { LocationFilterParams } from '../../components/LocationFilter';
import {
  challengeStateBadge,
  ChallengeImage,
  ChallengeDateRange,
  ChallengeMeta,
} from '../../components/ChallengeShared';
import {
  ExploreListLayout,
  SearchBar,
  EmptyState,
  ListSkeleton,
  Pagination,
  PAGINATION_LINK_CLASS,
} from '../../components/ExploreList';

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <Link
      to="/challenges/$challengeId"
      params={{ challengeId: challenge.id }}
      className="flex items-start gap-4 bg-white border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all"
    >
      <ChallengeImage challenge={challenge} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{challenge.title}</h3>
          {challengeStateBadge(challenge.state)}
        </div>
        <ChallengeDateRange challenge={challenge} />
        <ChallengeMeta challenge={challenge} />
        {challenge.organization && (
          <p className="text-[10px] text-gray-400 mt-1">
            by {challenge.organization.name}
          </p>
        )}
        {challenge.community && (
          <p className="text-[10px] text-gray-400">
            {challenge.community.name}
          </p>
        )}
      </div>
    </Link>
  );
}

export function ChallengesListPage() {
  const navigate = useNavigate();
  const { page, search, country, lon, lat, radius, location_label } = useSearch({ strict: false }) as {
    page?: number;
    search?: string;
    country?: string;
    lon?: number;
    lat?: number;
    radius?: number;
    location_label?: string;
  };

  const locationParams: Record<string, string> = {};
  if (country) locationParams.by_country = country;
  if (lon !== undefined && lat !== undefined) {
    locationParams['within_distance[lon]'] = String(lon);
    locationParams['within_distance[lat]'] = String(lat);
    locationParams['within_distance[radius]'] = String(radius || 100);
  }

  const query = useQuery({
    queryKey: ['global_challenges', page, search, country, lon, lat, radius],
    queryFn: () => getAllChallenges({ page: page || 1, per_page: 20, search, ...locationParams }),
  });

  const challenges = query.data?.data ?? [];
  const meta = query.data?.meta;

  const locSearch = { country, lon, lat, radius, location_label };

  const handleSearch = (q: string) => {
    navigate({ to: '/challenges', search: { search: q || undefined, page: 1, ...locSearch } });
  };

  const handleLocationFilter = (params: LocationFilterParams) => {
    navigate({
      to: '/challenges',
      search: {
        search, page: 1,
        country: params.country, lon: params.lon, lat: params.lat,
        radius: params.radius, location_label: params.location_label,
      },
    });
  };

  return (
    <ExploreListLayout
      featureKey="challenges"
      title="Challenges"
      description="Explore open challenges posted by communities and organizations. Apply to contribute your expertise, collaborate on circular textile projects, and win recognition for your solutions."
    >
      <div className="space-y-3">
        <SearchBar defaultValue={search || ''} placeholder="Search challenges..." onSearch={handleSearch} />
        <LocationFilter
          value={{ country, lon, lat, radius, location_label }}
          onChange={handleLocationFilter}
        />
      </div>

      <p className="text-sm text-muted-foreground">{meta?.total_count ?? 0} challenges</p>

      {query.isLoading ? (
        <ListSkeleton />
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
            </svg>
          }
          title="No challenges yet"
          message="There are no active or completed challenges across the platform yet."
        />
      ) : (
        <div className="space-y-3">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}

      <Pagination
        meta={meta}
        renderLink={(page, label) => (
          <Link to="/challenges" search={{ search, page, ...locSearch }} className={PAGINATION_LINK_CLASS}>
            {label}
          </Link>
        )}
      />
    </ExploreListLayout>
  );
}
