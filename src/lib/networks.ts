import { api, BASE } from './api';

// ── Types (mirroring the backend blueprints) ─────────────────

export interface Network {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  organizations_count: number;
  center_address: string | null;
  center_lat: number | null;
  center_lon: number | null;
  radius_km: number | null;
  role?: string; // present on /my/networks
  organization: { id: string; name: string; slug: string | null; image_url: string | null } | null;
}

export interface NetworkOrganizationOrg {
  id: string;
  name: string;
  slug: string | null;
  kind: string | null;
  address: string | null;
  country_code: string | null;
  image_url: string | null;
  lon: number | null;
  lat: number | null;
  specialties?: string[];
  description?: string | null;
}

export const HEALTH_LEVELS: Record<string, { label: string; badgeColor: string }> = {
  unknown: { label: 'Unknown', badgeColor: 'bg-gray-100 text-gray-600' },
  excellent: { label: 'Excellent', badgeColor: 'bg-emerald-100 text-emerald-800' },
  good: { label: 'Good', badgeColor: 'bg-green-100 text-green-800' },
  warning: { label: 'Warning', badgeColor: 'bg-amber-100 text-amber-800' },
  critical: { label: 'Critical', badgeColor: 'bg-red-100 text-red-800' },
};

export interface NetworkOrganization {
  id: string;
  organization_id: string;
  status: string;
  notes: string | null;
  economic_health: string;
  environmental_score: string;
  specialization: string | null;
  annual_turnover: number | string | null;
  number_of_employees: number | null;
  growth_rate: number | string | null;
  needs: Record<string, unknown>;
  added_at: string | null;
  created_at: string;
  organization: NetworkOrganizationOrg;
  added_by: { id: string; name: string } | null;
}

export interface NetworkMember {
  id: string;
  role: string;
  active: boolean;
  created_at: string;
  user: { id: string; name: string; email: string; image_url: string | null };
}

export interface NetworkInvitation {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
  network?: Network;
  invited_by?: { id: string; name: string };
}

export const CONTACT_KINDS: Record<string, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  visit: 'Visit',
  other: 'Other',
};

export interface ContactPoint {
  id: string;
  kind: string;
  occurred_at: string;
  summary: string;
  created_at: string;
  author: { id: string; name: string; image_url: string | null } | null;
}

export interface NetworkTask {
  id: string;
  title: string;
  notes: string | null;
  due_on: string | null;
  done_at: string | null;
  network_organization_id: string | null;
  created_at: string;
  created_by: { id: string; name: string } | null;
  organization: { id: string; name: string; slug: string | null; image_url: string | null } | null;
}

interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    next_page: number | null;
    prev_page: number | null;
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

// ── Networks ─────────────────────────────────────────────────

export async function getMyNetworks(): Promise<Network[]> {
  const json = await fetchJson<{ data: Network[] }>('/my/networks');
  return json.data;
}

export async function createNetwork(data: {
  name: string;
  description?: string;
  center_address?: string;
  center_lat?: number;
  center_lon?: number;
  radius_km?: number;
}): Promise<Network> {
  return api.post<Network>('/networks', { network: data });
}

// ── Followed organizations (CRM records) ─────────────────────

export interface NetworkOrgParams {
  page?: number;
  per_page?: number;
  view?: 'map';
  search?: string;
  kinds?: string;
  specialties?: string;
  economic_health?: string;
  country?: string;
}

export async function getNetworkOrganizations(
  networkSlug: string,
  params: NetworkOrgParams = {},
): Promise<Paginated<NetworkOrganization>> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.view) qs.set('view', params.view);
  if (params.search) qs.set('search', params.search);
  if (params.kinds) qs.set('kinds', params.kinds);
  if (params.specialties) qs.set('specialties', params.specialties);
  if (params.economic_health) qs.set('economic_health', params.economic_health);
  if (params.country) qs.set('country', params.country);
  return fetchJson(`/networks/${networkSlug}/organizations?${qs}`);
}

export async function getNetworkOrganization(networkSlug: string, id: string): Promise<NetworkOrganization> {
  return api.get<NetworkOrganization>(`/networks/${networkSlug}/organizations/${id}`);
}

export interface OrgPerson {
  id: string;
  role: string;
  user: { id: string; name: string; email: string; image_url: string | null };
}

/** The people working at a followed organization (its active members). */
export async function getNetworkOrgPeople(networkSlug: string, id: string): Promise<OrgPerson[]> {
  const json = await fetchJson<{ data: OrgPerson[] }>(`/networks/${networkSlug}/organizations/${id}/people`);
  return json.data;
}

export async function addNetworkOrganization(networkSlug: string, organizationId: string): Promise<NetworkOrganization> {
  return api.post<NetworkOrganization>(`/networks/${networkSlug}/organizations`, {
    network_organization: { organization_id: organizationId },
  });
}

export async function updateNetworkOrganization(
  networkSlug: string,
  id: string,
  data: Partial<{
    status: string;
    notes: string;
    economic_health: string;
    environmental_score: string;
    specialization: string;
    annual_turnover: number | null;
    number_of_employees: number | null;
    growth_rate: number | null;
    needs: Record<string, unknown>;
  }>,
): Promise<NetworkOrganization> {
  return api.patch<NetworkOrganization>(`/networks/${networkSlug}/organizations/${id}`, {
    network_organization: data,
  });
}

export async function removeNetworkOrganization(networkSlug: string, id: string): Promise<void> {
  await api.delete(`/networks/${networkSlug}/organizations/${id}`);
}

// ── Graph ────────────────────────────────────────────────────

export interface NetworkGraphData {
  nodes: {
    id: string;
    organization_id: string;
    name: string;
    kind: string | null;
    image_url: string | null;
    number_of_workers: number | null;
    economic_health: string;
  }[];
  links: { source: string; target: string; relation_type: string; kind: string }[];
}

export async function getNetworkGraph(networkSlug: string): Promise<NetworkGraphData> {
  const json = await fetchJson<{ data: NetworkGraphData }>(`/networks/${networkSlug}/graph`);
  return json.data;
}

// ── Contact points ───────────────────────────────────────────

export async function getContactPoints(
  networkSlug: string,
  networkOrgId: string,
  page = 1,
): Promise<Paginated<ContactPoint>> {
  return fetchJson(`/networks/${networkSlug}/organizations/${networkOrgId}/contact_points?page=${page}&per_page=50`);
}

export async function createContactPoint(
  networkSlug: string,
  networkOrgId: string,
  data: { kind: string; occurred_at?: string; summary: string },
): Promise<ContactPoint> {
  return api.post<ContactPoint>(`/networks/${networkSlug}/organizations/${networkOrgId}/contact_points`, {
    contact_point: data,
  });
}

export async function deleteContactPoint(networkSlug: string, networkOrgId: string, id: string): Promise<void> {
  await api.delete(`/networks/${networkSlug}/organizations/${networkOrgId}/contact_points/${id}`);
}

// ── Tasks ────────────────────────────────────────────────────

export async function getNetworkTasks(
  networkSlug: string,
  params: { open?: boolean; done?: boolean; network_organization_id?: string } = {},
): Promise<Paginated<NetworkTask>> {
  const qs = new URLSearchParams();
  if (params.open) qs.set('open', 'true');
  if (params.done) qs.set('done', 'true');
  if (params.network_organization_id) qs.set('network_organization_id', params.network_organization_id);
  return fetchJson(`/networks/${networkSlug}/tasks?${qs}`);
}

export async function createNetworkTask(
  networkSlug: string,
  data: { title: string; notes?: string; due_on?: string; network_organization_id?: string },
): Promise<NetworkTask> {
  return api.post<NetworkTask>(`/networks/${networkSlug}/tasks`, { network_task: data });
}

export async function updateNetworkTask(
  networkSlug: string,
  id: string,
  data: Partial<{ title: string; notes: string; due_on: string | null; done: boolean }>,
): Promise<NetworkTask> {
  return api.patch<NetworkTask>(`/networks/${networkSlug}/tasks/${id}`, { network_task: data });
}

export async function deleteNetworkTask(networkSlug: string, id: string): Promise<void> {
  await api.delete(`/networks/${networkSlug}/tasks/${id}`);
}

// ── Members & invitations ────────────────────────────────────

export async function getNetworkMembers(networkSlug: string): Promise<NetworkMember[]> {
  const json = await fetchJson<Paginated<NetworkMember>>(`/networks/${networkSlug}/members?per_page=100`);
  return json.data;
}

export async function inviteNetworkMember(networkSlug: string, email: string): Promise<void> {
  await api.post(`/networks/${networkSlug}/members`, { email });
}

export interface NetworkCandidate {
  id: string;
  name: string;
  email: string;
  image_url: string | null;
}

/** Colleagues of the central organization without facilitator access yet */
export async function getNetworkCandidates(networkSlug: string): Promise<NetworkCandidate[]> {
  const json = await fetchJson<{ data: NetworkCandidate[] }>(`/networks/${networkSlug}/members/candidates`);
  return json.data;
}

export async function grantNetworkAccess(networkSlug: string, userId: string): Promise<void> {
  await api.post(`/networks/${networkSlug}/members`, { user_id: userId });
}

export async function removeNetworkMember(networkSlug: string, memberId: string): Promise<void> {
  await api.delete(`/networks/${networkSlug}/members/${memberId}`);
}

export async function getNetworkInvitations(networkSlug: string): Promise<NetworkInvitation[]> {
  const json = await fetchJson<{ data: NetworkInvitation[] }>(`/networks/${networkSlug}/invitations`);
  return json.data;
}

export async function cancelNetworkInvitation(networkSlug: string, id: string): Promise<void> {
  await api.delete(`/networks/${networkSlug}/invitations/${id}`);
}

// ── Invitation acceptance (public page) ──────────────────────

export async function getInvitationByToken(token: string): Promise<NetworkInvitation> {
  return api.get<NetworkInvitation>(`/network-invitation/${encodeURIComponent(token)}`);
}

export async function acceptInvitation(token: string): Promise<NetworkInvitation> {
  return api.post<NetworkInvitation>(`/network-invitation/${encodeURIComponent(token)}/accept`, {});
}
