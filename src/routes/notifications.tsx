import { useCallback, useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { getInitials } from '../lib/utils';
import type { User } from '../lib/auth';
import {
  notificationKeys,
  useMarkAsRead,
  useMarkAllAsRead,
  getNotificationUrl,
  type Notification,
} from '../lib/notifications';
import { BASE } from '../lib/api';

const PER_PAGE = 20;

async function fetchPage(page: number): Promise<{ notifications: Notification[]; nextPage: number | null }> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/notifications?page=${page}&per_page=${PER_PAGE}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return { notifications: [], nextPage: null };
  const json = await res.json();
  const notifications: Notification[] = json.notifications ?? [];
  return {
    notifications,
    nextPage: notifications.length === PER_PAGE ? page + 1 : null,
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function NotificationsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const me = qc.getQueryData<User>(['me']) ?? null;
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [...notificationKeys.list, 'full'],
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];

  // Intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  function handleClick(n: Notification) {
    if (!n.read) {
      markAsRead.mutate(n.id);
    }
    const url = getNotificationUrl(n, me);
    if (url) {
      navigate({ to: url });
    }
  }

  function handleMarkAllAsRead() {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [...notificationKeys.list, 'full'] });
      },
    });
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-border rounded-lg divide-y divide-border">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors ${
                  !n.read ? 'bg-primary/5' : ''
                }`}
              >
                <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
                  <AvatarImage src={n.actor?.image_url ?? undefined} alt={n.actor?.name ?? ''} />
                  <AvatarFallback className="text-xs">
                    {n.actor ? getInitials(n.actor.name) : '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                </div>

                {!n.read && (
                  <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                )}
              </button>
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="py-4 text-center">
            {isFetchingNextPage && (
              <p className="text-sm text-gray-400">Loading more...</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
