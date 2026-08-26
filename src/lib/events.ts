import { api, BASE } from './api';

export interface Event {
  id: string;
  title: string;
  description: string;
  happens_at: string;
  address: string;
  country_code: string | null;
  lon: number | null;
  lat: number | null;
  online: boolean;
  online_url: string | null;
  image_url: string | null;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventsResponse {
  data: Event[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    next_page: number | null;
    prev_page: number | null;
  };
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

export interface GlobalEventParams {
  page?: number;
  per_page?: number;
  view?: 'map';
  search?: string;
  country?: string;
  lon?: number;
  lat?: number;
  radius?: number;
  upcoming?: boolean;
  past?: boolean;
}

export async function getAllEvents(
  params: GlobalEventParams = {},
): Promise<EventsResponse> {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', String(params.page));
  if (params.per_page) qp.set('per_page', String(params.per_page));
  if (params.view) qp.set('view', params.view);
  if (params.search) qp.set('search', params.search);
  if (params.country) qp.set('by_country', params.country);
  if (params.upcoming) qp.set('upcoming', 'true');
  if (params.past) qp.set('past', 'true');
  if (params.lon !== undefined && params.lat !== undefined) {
    qp.set('within_distance[lon]', String(params.lon));
    qp.set('within_distance[lat]', String(params.lat));
    if (params.radius) qp.set('within_distance[radius]', String(params.radius));
  }

  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/events?${qp}`, {
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

export async function getEvent(eventId: string): Promise<Event> {
  return api.get<Event>(`/events/${eventId}`);
}

export interface EventPayload {
  title: string;
  description?: string;
  happens_at: string;
  address?: string;
  country_code?: string;
  lon?: number;
  lat?: number;
  online: boolean;
  online_url?: string;
  image_url?: string;
}

export async function createGlobalEvent(data: EventPayload): Promise<Event> {
  return api.post<Event>('/events', { event: data });
}

export async function updateGlobalEvent(
  eventId: string,
  data: Partial<EventPayload>,
): Promise<Event> {
  return api.patch<Event>(`/events/${eventId}`, { event: data });
}

export async function deleteGlobalEvent(eventId: string): Promise<void> {
  return api.delete(`/events/${eventId}`);
}

// ── RSVP / participants ──────────────────────────────────────

export async function getEventParticipants(
  eventId: string,
): Promise<EventParticipant[]> {
  return api.get<EventParticipant[]>(`/events/${eventId}/participants`);
}

export async function rsvpToEvent(
  eventId: string,
  status: 'going' | 'maybe' | 'not_going' = 'going',
): Promise<EventParticipant> {
  return api.post<EventParticipant>(`/events/${eventId}/participants`, { status });
}

export async function cancelRsvp(
  eventId: string,
  participantId: string,
): Promise<void> {
  return api.delete(`/events/${eventId}/participants/${participantId}`);
}
