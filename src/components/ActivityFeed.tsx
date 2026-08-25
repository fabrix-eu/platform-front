import { useEffect, useRef, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import type { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import type { FeedActivity, PaginatedFeed } from '../lib/feed';
import { ORG_KINDS } from '../lib/organizations';
import { formatDistanceToNow, getInitials } from '../lib/utils';

const LISTING_TYPE_LABELS: Record<string, string> = {
  material: 'Material',
  capacity: 'Capacity',
  service: 'Service',
  product: 'Product',
  distribution: 'Distribution',
};

function Avatar({ name, imageUrl, size = 'md' }: { name: string; imageUrl: string | null; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs';
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={`${cls} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${cls} rounded-full bg-gray-100 flex items-center justify-center font-medium text-gray-500 shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function ActionLabel({ action }: { action: string }) {
  const labels: Record<string, { text: string; color: string }> = {
    member_joined: { text: 'added a member', color: 'text-green-600' },
    post_created: { text: 'posted', color: 'text-blue-600' },
    comment_created: { text: 'commented', color: 'text-blue-500' },
    event_created: { text: 'created an event', color: 'text-orange-600' },
    challenge_created: { text: 'launched a challenge', color: 'text-yellow-600' },
    listing_created: { text: 'published a listing', color: 'text-purple-600' },
    space_created: { text: 'created a space', color: 'text-indigo-600' },
  };
  const info = labels[action] ?? { text: action, color: 'text-gray-500' };
  return <span className={`text-xs font-medium ${info.color}`}>{info.text}</span>;
}

function activityLink(activity: FeedActivity): string | null {
  const { trackable } = activity;
  if (!trackable) return null;

  switch (trackable.type) {
    case 'community_organization':
      return `/organizations/${trackable.organization.slug}`;
    case 'event':
      return `/events/${trackable.id}`;
    case 'listing':
      return `/marketplace/${trackable.id}`;
    default:
      // Legacy trackables (spaces, posts, challenges) no longer have a page —
      // render the card without a link.
      return null;
  }
}

function MemberJoinedCard({ activity }: { activity: FeedActivity }) {
  if (activity.trackable?.type !== 'community_organization') return null;
  const org = activity.trackable.organization;
  const kindInfo = ORG_KINDS[org.kind];

  return (
    <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-lg">
      {org.image_url ? (
        <img src={org.image_url} alt={org.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-500 shrink-0">
          {getInitials(org.name)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">{org.name}</p>
        {kindInfo && (
          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-0.5 ${kindInfo.badgeColor}`}>
            {kindInfo.label}
          </span>
        )}
      </div>
    </div>
  );
}

function ImageCard({
  imageUrl,
  title,
  description,
  meta,
}: {
  imageUrl: string | null;
  title: string;
  description: string | null;
  meta?: React.ReactNode;
}) {
  return (
    <div className="mt-2 rounded-lg border border-gray-100 overflow-hidden bg-gray-50">
      {imageUrl && (
        <img src={imageUrl} alt={title} className="w-full h-40 object-cover" />
      )}
      <div className="p-3">
        <p className="font-medium text-sm text-gray-900">{title}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{description}</p>
        )}
        {meta && <div className="mt-2">{meta}</div>}
      </div>
    </div>
  );
}

function PostCard({ activity }: { activity: FeedActivity }) {
  if (activity.trackable?.type !== 'space_post') return null;
  const { title, body, space } = activity.trackable;

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <p className="font-medium text-sm text-gray-900">{title}</p>
      {body && (
        <p className="text-xs text-gray-600 mt-1 line-clamp-3">{body}</p>
      )}
      <p className="text-[10px] text-gray-400 mt-2">in {space.name}</p>
    </div>
  );
}

function TrackableContent({ activity }: { activity: FeedActivity }) {
  const { trackable } = activity;
  if (!trackable) return null;

  switch (trackable.type) {
    case 'community_organization':
      return <MemberJoinedCard activity={activity} />;

    case 'space_post':
      return <PostCard activity={activity} />;

    case 'space_post_comment':
      return (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500">
            on <span className="font-medium text-gray-700">{trackable.post.title}</span>
          </p>
        </div>
      );

    case 'event':
      return (
        <ImageCard
          imageUrl={trackable.image_url}
          title={trackable.title}
          description={trackable.description}
          meta={
            <div className="flex items-center gap-3 text-[11px] text-gray-400">
              {trackable.starts_at && (
                <span className="flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  {new Date(trackable.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              {trackable.location && (
                <span className="flex items-center gap-1 truncate">
                  <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  {trackable.location}
                </span>
              )}
            </div>
          }
        />
      );

    case 'challenge':
      return (
        <ImageCard
          imageUrl={trackable.image_url}
          title={trackable.title}
          description={trackable.description}
        />
      );

    case 'listing':
      return (
        <ImageCard
          imageUrl={trackable.image_url}
          title={trackable.title}
          description={trackable.description}
          meta={
            trackable.listing_type ? (
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                {LISTING_TYPE_LABELS[trackable.listing_type] ?? trackable.listing_type}
              </span>
            ) : null
          }
        />
      );

    case 'community_space':
      return (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm shrink-0">
            {trackable.icon ?? '💬'}
          </div>
          <p className="font-medium text-sm text-gray-900">{trackable.name}</p>
        </div>
      );

    default:
      return null;
  }
}

function FeedItem({ activity }: { activity: FeedActivity }) {
  const link = activityLink(activity);

  const card = (
    <div className="px-4 py-3">
      {/* Header: avatar + owner name + action + time */}
      <div className="flex items-center gap-3">
        <Avatar name={activity.owner.name} imageUrl={activity.owner.image_url} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-semibold text-sm text-gray-900">{activity.owner.name}</span>
            <ActionLabel action={activity.action} />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-gray-400">{formatDistanceToNow(activity.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Rich content */}
      <div className="ml-[52px]">
        <TrackableContent activity={activity} />
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block hover:bg-gray-50/50 transition-colors">
        {card}
      </Link>
    );
  }

  return card;
}

export function ActivityFeed({
  query,
  emptyMessage = 'No activity yet',
}: {
  query: UseInfiniteQueryResult<InfiniteData<PaginatedFeed>, Error>;
  emptyMessage?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

  if (isLoading) {
    return (
      <div className="space-y-1 divide-y divide-gray-100">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse px-4 py-3">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-48" />
                <div className="h-2.5 bg-gray-100 rounded w-24" />
              </div>
            </div>
            <div className="ml-[52px] mt-2 h-16 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600 p-4">Failed to load activity feed</p>;
  }

  const activities = data?.pages.flatMap((p) => p.data) ?? [];

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-gray-100">
        {activities.map((activity) => (
          <FeedItem key={activity.id} activity={activity} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="text-center py-3">
          <span className="text-sm text-gray-400">Loading more...</span>
        </div>
      )}
    </div>
  );
}
