import { BASE } from './api';

export interface FeedOwner {
  id: string;
  name: string;
  image_url: string | null;
}

export interface FeedCommunity {
  id: string;
  name: string;
  slug: string;
}

export interface FeedOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface TrackableMemberJoined {
  type: 'community_organization';
  organization: {
    id: string;
    name: string;
    slug: string;
    kind: string;
    image_url: string | null;
  };
}

export interface TrackableSpacePost {
  type: 'space_post';
  id: string;
  title: string;
  body: string | null;
  space: { id: string; name: string; icon: string | null };
}

export interface TrackableSpacePostComment {
  type: 'space_post_comment';
  id: string;
  post: { id: string; title: string; space_id: string };
}

export interface TrackableEvent {
  type: 'event';
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  location: string | null;
  image_url: string | null;
}

export interface TrackableChallenge {
  type: 'challenge';
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
}

export interface TrackableListing {
  type: 'listing';
  id: string;
  title: string;
  description: string | null;
  listing_type: string;
  image_url: string | null;
}

export interface TrackableCommunitySpace {
  type: 'community_space';
  id: string;
  name: string;
  icon: string | null;
}

export type Trackable =
  | TrackableMemberJoined
  | TrackableSpacePost
  | TrackableSpacePostComment
  | TrackableEvent
  | TrackableChallenge
  | TrackableListing
  | TrackableCommunitySpace
  | null;

export interface FeedActivity {
  id: string;
  action: string;
  created_at: string;
  owner: FeedOwner;
  community: FeedCommunity | null;
  organization: FeedOrganization | null;
  trackable: Trackable;
  metadata: Record<string, unknown> | null;
}

export interface PaginatedMeta {
  total_pages: number;
  current_page: number;
  next_page: number | null;
  prev_page: number | null;
  total_count: number;
}

export interface PaginatedFeed {
  data: FeedActivity[];
  meta: PaginatedMeta;
}

async function fetchFeed(path: string): Promise<PaginatedFeed> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
  return res.json();
}

export function getUserFeed(params: { page?: number; per_page?: number } = {}): Promise<PaginatedFeed> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  const query = qs.toString();
  return fetchFeed(`/feed${query ? `?${query}` : ''}`);
}

export function getOrgFeed(orgId: string, params: { page?: number; per_page?: number } = {}): Promise<PaginatedFeed> {
  const qs = new URLSearchParams();
  qs.set('organization_id', orgId);
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  return fetchFeed(`/feed?${qs.toString()}`);
}
