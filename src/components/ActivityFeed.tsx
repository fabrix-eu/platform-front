import { useEffect, useRef, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import type { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import type { FeedActivity, PaginatedFeed } from '../lib/feed';
import { ORG_KINDS } from '../lib/organizations';
import { formatDistanceToNow, getInitials } from '../lib/utils';

function Avatar({ name, imageUrl, size = 'md' }: { name: string; imageUrl: string | null; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-9 w-9 text-xs';
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={`${cls} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${cls} rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600 shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function ActivityIcon({ action }: { action: string }) {
  const base = 'h-4 w-4';
  switch (action) {
    case 'member_joined':
      return (
        <svg className={`${base} text-green-600`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
      );
    case 'post_created':
      return (
        <svg className={`${base} text-blue-600`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      );
    case 'comment_created':
      return (
        <svg className={`${base} text-blue-500`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
        </svg>
      );
    case 'event_created':
    case 'event_updated':
      return (
        <svg className={`${base} text-orange-600`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      );
    case 'challenge_created':
    case 'challenge_updated':
      return (
        <svg className={`${base} text-yellow-600`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.52.587 6.023 6.023 0 0 1-2.52-.587" />
        </svg>
      );
    case 'listing_created':
      return (
        <svg className={`${base} text-purple-600`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a1.245 1.245 0 0 1-.546-1.026L3.75 3.675a.75.75 0 0 1 .75-.675h15a.75.75 0 0 1 .75.675l-.546 4.648a1.245 1.245 0 0 1-.546 1.026m-15.408 0a1.227 1.227 0 0 0 .546 1.026 1.227 1.227 0 0 0 1.082.237l1.134-.246m0 0a1.268 1.268 0 0 0 .737-.603l.684-1.163a.75.75 0 0 1 1.292 0l.684 1.163a1.268 1.268 0 0 0 .737.603l1.134.246a1.227 1.227 0 0 0 1.082-.237 1.227 1.227 0 0 0 .546-1.026" />
        </svg>
      );
    case 'space_created':
      return (
        <svg className={`${base} text-indigo-600`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      );
    default:
      return (
        <svg className={`${base} text-gray-400`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
  }
}

function actionDescription(activity: FeedActivity): React.ReactNode {
  const { action, owner, trackable, community } = activity;
  const ownerName = <span className="font-medium text-gray-900">{owner.name}</span>;

  switch (action) {
    case 'member_joined': {
      if (trackable?.type === 'community_organization') {
        const org = trackable.organization;
        const kindInfo = ORG_KINDS[org.kind];
        return (
          <>
            {ownerName} added{' '}
            <span className="font-medium text-gray-900">{org.name}</span>
            {kindInfo && (
              <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ml-1 ${kindInfo.badgeColor}`}>
                {kindInfo.label}
              </span>
            )}
            {community && <> to {community.name}</>}
          </>
        );
      }
      return <>{ownerName} joined{community ? ` ${community.name}` : ''}</>;
    }
    case 'post_created': {
      if (trackable?.type === 'space_post') {
        return (
          <>
            {ownerName} posted{' '}
            <span className="font-medium text-gray-900">{trackable.title}</span>
            {' '}in {trackable.space.name}
          </>
        );
      }
      return <>{ownerName} created a post</>;
    }
    case 'comment_created': {
      if (trackable?.type === 'space_post_comment') {
        return (
          <>
            {ownerName} commented on{' '}
            <span className="font-medium text-gray-900">{trackable.post.title}</span>
          </>
        );
      }
      return <>{ownerName} left a comment</>;
    }
    case 'event_created': {
      if (trackable?.type === 'event') {
        return (
          <>
            {ownerName} created event{' '}
            <span className="font-medium text-gray-900">{trackable.title}</span>
          </>
        );
      }
      return <>{ownerName} created an event</>;
    }
    case 'challenge_created': {
      if (trackable?.type === 'challenge') {
        return (
          <>
            {ownerName} launched challenge{' '}
            <span className="font-medium text-gray-900">{trackable.title}</span>
          </>
        );
      }
      return <>{ownerName} launched a challenge</>;
    }
    case 'listing_created': {
      if (trackable?.type === 'listing') {
        return (
          <>
            {ownerName} published listing{' '}
            <span className="font-medium text-gray-900">{trackable.title}</span>
          </>
        );
      }
      return <>{ownerName} published a listing</>;
    }
    case 'space_created': {
      if (trackable?.type === 'community_space') {
        return (
          <>
            {ownerName} created space{' '}
            <span className="font-medium text-gray-900">{trackable.name}</span>
          </>
        );
      }
      return <>{ownerName} created a discussion space</>;
    }
    default:
      return <>{ownerName} performed an action</>;
  }
}

function activityLink(activity: FeedActivity, orgSlug?: string): string | null {
  const { trackable, community } = activity;
  if (!trackable || !community) return null;

  const base = orgSlug ? `/${orgSlug}/communities/${community.slug}` : null;
  if (!base) return null;

  switch (trackable.type) {
    case 'community_organization':
      return `${base}/members`;
    case 'space_post':
      return `${base}/spaces/${trackable.space.id}/posts/${trackable.id}`;
    case 'space_post_comment':
      return `${base}/spaces/${trackable.post.space_id}/posts/${trackable.post.id}`;
    case 'event':
      return `${base}/events/${trackable.id}`;
    case 'challenge':
      return `${base}/challenges/${trackable.id}`;
    case 'listing':
      return `/marketplace/${trackable.id}`;
    case 'community_space':
      return `${base}/spaces/${trackable.id}`;
    default:
      return null;
  }
}

function FeedItem({ activity, orgSlug }: { activity: FeedActivity; orgSlug?: string }) {
  const link = activityLink(activity, orgSlug);

  const content = (
    <div className="flex gap-3 p-3">
      <Avatar name={activity.owner.name} imageUrl={activity.owner.image_url} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <ActivityIcon action={activity.action} />
          <p className="text-sm text-gray-600 leading-snug">
            {actionDescription(activity)}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1 ml-6">
          <span className="text-xs text-gray-400">{formatDistanceToNow(activity.created_at)}</span>
          {activity.community && orgSlug && (
            <span className="text-xs text-gray-400">
              in {activity.community.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block hover:bg-gray-50 transition-colors rounded-lg">
        {content}
      </Link>
    );
  }

  return <div className="rounded-lg">{content}</div>;
}

export function ActivityFeed({
  query,
  orgSlug,
  emptyMessage = 'No activity yet',
}: {
  query: UseInfiniteQueryResult<InfiniteData<PaginatedFeed>, Error>;
  orgSlug?: string;
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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-3 p-3">
            <div className="h-9 w-9 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
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
          <FeedItem key={activity.id} activity={activity} orgSlug={orgSlug} />
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
