import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { api, BASE } from './api';
import { isAuthenticated } from './auth';

// ── Types ────────────────────────────────────────────────────

export interface Notification {
  id: string;
  notification_type: string;
  scope: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
  message: string;
  metadata: Record<string, string>;
  actor: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
  notifiable: {
    id: string;
    type: string;
  };
}

// ── API functions ────────────────────────────────────────────

async function getUnreadCount(): Promise<number> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/notifications/unread_count`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return 0;
  const json = await res.json();
  return json.count ?? 0;
}

async function getNotifications(page = 1, perPage = 10): Promise<Notification[]> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/notifications?page=${page}&per_page=${perPage}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.notifications ?? [];
}

async function markAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/mark_as_read`, {});
}

async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/mark_all_as_read', {});
}

// ── Query keys ───────────────────────────────────────────────

export const notificationKeys = {
  unreadCount: ['notifications', 'unread_count'] as const,
  list: ['notifications'] as const,
};

// ── Hooks ────────────────────────────────────────────────────

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadCount,
    enabled: isAuthenticated(),
    refetchOnWindowFocus: true,
    staleTime: 0, // always refetch on window focus
  });
}

export function useNotifications(perPage = 10) {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => getNotifications(1, perPage),
    enabled: isAuthenticated(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount });
      qc.invalidateQueries({ queryKey: notificationKeys.list });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount });
      qc.invalidateQueries({ queryKey: notificationKeys.list });
    },
  });
}

/** Invalidate unread count on every route navigation */
export function useRefreshOnNavigate() {
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    return router.subscribe('onLoad', () => {
      if (isAuthenticated()) {
        qc.invalidateQueries({ queryKey: notificationKeys.unreadCount });
      }
    });
  }, [router, qc]);
}
