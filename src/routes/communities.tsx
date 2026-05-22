import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getCommunities } from '../lib/communities';
import { getMe } from '../lib/auth';
import { useFeatureInfo, FeatureIntro, FeatureInfoTrigger } from '../components/FeatureIntro';

export function CommunitiesPage() {
  const communitiesInfo = useFeatureInfo('communities');
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['communities', { search }],
    queryFn: () => getCommunities({ search: search || undefined }),
  });

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const communities = query.data?.data ?? [];
  const canCreate = meQuery.data?.role === 'facilitator' || meQuery.data?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-gray-900">Communities</h1>
            <FeatureInfoTrigger info={communitiesInfo} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Discover communities and request to join with your organization.
          </p>
        </div>
        {canCreate && (
          <Link
            to="/communities/new"
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            Create community
          </Link>
        )}
      </div>

      <FeatureIntro
        info={communitiesInfo}
        title="Communities"
        description="Communities bring together organizations around shared goals in circular textile. Join a community to access events, challenges, matchmaking, and collaboration with facilitators and peers."
      />

      <input
        type="text"
        placeholder="Search communities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
      />

      {query.isLoading && (
        <div className="text-gray-500 text-sm">Loading...</div>
      )}

      {communities.length === 0 && !query.isLoading && (
        <p className="text-sm text-gray-500">No communities found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {communities.map((c) => {
          const initials = c.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <Link
              key={c.id}
              to="/communities/$id"
              params={{ id: c.slug || c.id }}
              className="block bg-white rounded-xl border border-border hover:border-gray-300 hover:shadow-md transition-all group"
            >
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-base text-gray-900 truncate group-hover:text-primary transition-colors">
                        {c.name}
                      </h3>
                      {c.is_member && (
                        <span className="text-[10px] font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex-shrink-0">
                          Member
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                        </svg>
                        {c.organizations_count} {c.organizations_count === 1 ? 'org' : 'orgs'}
                      </span>
                      {c.center_address && (
                        <span className="flex items-center gap-1 truncate">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          <span className="truncate">{c.center_address}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {c.description && (
                  <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">{c.description}</p>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-primary font-medium group-hover:underline">
                    View community &rarr;
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
