import { api, BASE } from './api';

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  happens_at: string;
  address: string;
  lon: number | null;
  lat: number | null;
  online: boolean;
  online_url: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CommunityEventsResponse {
  data: CommunityEvent[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    next_page: number | null;
    prev_page: number | null;
  };
}

export async function getCommunityEvents(
  communityId: string,
  params: { page?: number; per_page?: number } = {},
): Promise<CommunityEventsResponse> {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', String(params.page));
  if (params.per_page) qp.set('per_page', String(params.per_page));

  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/communities/${communityId}/community_events?${qp}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    return { data: [], meta: { current_page: 1, total_pages: 1, total_count: 0, next_page: null, prev_page: null } };
  }

  return res.json();
}

export interface EventParticipant {
  id: string;
  status: 'going' | 'maybe' | 'not_going';
  rsvp_at: string;
  created_at: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    image_url: string | null;
  };
}

export async function getCommunityEvent(
  communityId: string,
  eventId: string,
): Promise<CommunityEvent> {
  return api.get<CommunityEvent>(`/communities/${communityId}/community_events/${eventId}`);
}

export async function createCommunityEvent(
  communityId: string,
  data: {
    title: string;
    description?: string;
    happens_at: string;
    address?: string;
    lon?: number;
    lat?: number;
    online: boolean;
    online_url?: string;
    image_url?: string;
  },
): Promise<CommunityEvent> {
  return api.post<CommunityEvent>(`/communities/${communityId}/community_events`, {
    community_event: data,
  });
}

export async function updateCommunityEvent(
  communityId: string,
  eventId: string,
  data: Partial<{
    title: string;
    description: string;
    happens_at: string;
    address: string;
    lon: number;
    lat: number;
    online: boolean;
    online_url: string;
    image_url: string;
  }>,
): Promise<CommunityEvent> {
  return api.patch<CommunityEvent>(`/communities/${communityId}/community_events/${eventId}`, {
    community_event: data,
  });
}

export async function deleteCommunityEvent(
  communityId: string,
  eventId: string,
): Promise<void> {
  return api.delete(`/communities/${communityId}/community_events/${eventId}`);
}

export async function getEventParticipants(
  communityId: string,
  eventId: string,
): Promise<EventParticipant[]> {
  return api.get<EventParticipant[]>(`/communities/${communityId}/community_events/${eventId}/participants`);
}

export async function rsvpToEvent(
  communityId: string,
  eventId: string,
  status: 'going' | 'maybe' | 'not_going' = 'going',
): Promise<EventParticipant> {
  return api.post<EventParticipant>(
    `/communities/${communityId}/community_events/${eventId}/participants`,
    { status },
  );
}

export async function cancelRsvp(
  communityId: string,
  eventId: string,
  participantId: string,
): Promise<void> {
  return api.delete(
    `/communities/${communityId}/community_events/${eventId}/participants/${participantId}`,
  );
}
