import { useParams } from '@tanstack/react-router';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getCommunity } from '../../lib/communities';
import { getCommunityFeed } from '../../lib/feed';
import { ActivityFeed } from '../../components/ActivityFeed';

const PER_PAGE = 20;

export function CommunityOverviewPage() {
  const { orgSlug, communitySlug } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
  };

  const communityQuery = useQuery({
    queryKey: ['communities', communitySlug],
    queryFn: () => getCommunity(communitySlug),
  });

  const communityId = communityQuery.data?.id;

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed', 'community', communityId],
    queryFn: ({ pageParam }) => getCommunityFeed(communityId!, { page: pageParam, per_page: PER_PAGE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page ?? undefined,
    enabled: !!communityId,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-display font-bold text-gray-900">Activity</h2>
        <p className="text-sm text-gray-500 mt-1">Recent activity in this community</p>
      </div>

      <div className="bg-white rounded-lg border border-border">
        <ActivityFeed
          query={feedQuery}
          orgSlug={orgSlug}
          emptyMessage="No activity yet in this community"
        />
      </div>
    </div>
  );
}
