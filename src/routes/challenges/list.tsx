import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAllChallenges } from '../../lib/community-challenges';
import type { Challenge } from '../../lib/community-challenges';
import { LocationFilter } from '../../components/LocationFilter';
import type { LocationFilterParams } from '../../components/LocationFilter';

function stateBadge(state: string) {
  switch (state) {
    case 'active':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Active</span>;
    case 'completed':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Completed</span>;
    case 'cancelled':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-600">Cancelled</span>;
    default:
      return null;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <div className="flex items-start gap-4 bg-white border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      {challenge.image_url ? (
        <img
          src={challenge.image_url}
          alt={challenge.title}
          className="w-16 h-16 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{challenge.title}</h3>
          {stateBadge(challenge.state)}
        </div>
        {(challenge.start_on || challenge.end_on) && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {challenge.start_on && formatDate(challenge.start_on)}
            {challenge.start_on && challenge.end_on && ' — '}
            {challenge.end_on && formatDate(challenge.end_on)}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-0.5">
          {challenge.applications_count} application{challenge.applications_count !== 1 ? 's' : ''}
          {challenge.winners_count > 0 && ` · ${challenge.winners_count} winner${challenge.winners_count !== 1 ? 's' : ''}`}
        </p>
        {challenge.community && (
          <p className="text-[10px] text-gray-400 mt-1.5">
            {challenge.community.name}
          </p>
        )}
      </div>
    </div>
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

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get('search') as string) || '';
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
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Challenges</h1>
      </div>

      {/* Search + Location */}
      <div className="space-y-3 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            name="search"
            defaultValue={search || ''}
            placeholder="Search challenges..."
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-secondary/80"
          >
            Search
          </button>
        </form>
        <LocationFilter
          value={{ country, lon, lat, radius, location_label }}
          onChange={handleLocationFilter}
        />
      </div>

      <p className="text-sm text-muted-foreground mb-4">{meta?.total_count ?? 0} challenges</p>

      {/* Content */}
      {query.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-border rounded-lg p-4 flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="bg-white rounded-lg border border-border p-8 text-center space-y-3">
          <div className="flex justify-center text-gray-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
            </svg>
          </div>
          <h3 className="font-display font-semibold text-gray-900">No challenges yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            There are no active or completed challenges across the platform yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          {meta.prev_page && (
            <Link
              to="/challenges"
              search={{ search, page: meta.prev_page, ...locSearch }}
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
              to="/challenges"
              search={{ search, page: meta.next_page, ...locSearch }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Next &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
