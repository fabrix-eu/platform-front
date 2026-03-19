import { api, BASE } from './api';

// ── Types ────────────────────────────────────────────────────

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  next_page: number | null;
  prev_page: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  image_url: string | null;
  created_at: string;
}

export interface AdminOrganization {
  id: string;
  name: string;
  slug: string;
  kind: string | null;
  country_code: string | null;
  claimed: boolean;
  created_at: string;
}

export interface AdminCommunity {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface AdminFeedback {
  id: string;
  category: string;
  message: string;
  screenshot_url: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

// ── Paginated fetch helper ───────────────────────────────────

async function adminGet<T>(path: string): Promise<PaginatedResponse<T>> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Admin API error ${res.status}`);
  }
  const json = await res.json();
  return { data: json.data, meta: json.meta };
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== '') qs.set(key, String(val));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

// ── API functions ────────────────────────────────────────────

export function getAdminUsers(params: { page?: number; per_page?: number; search?: string } = {}) {
  return adminGet<AdminUser>(`/admin/users${buildQuery(params)}`);
}

export function getAdminOrganizations(params: { page?: number; per_page?: number; search?: string } = {}) {
  return adminGet<AdminOrganization>(`/admin/organizations${buildQuery(params)}`);
}

export function getAdminCommunities(params: { page?: number; per_page?: number; search?: string } = {}) {
  return adminGet<AdminCommunity>(`/admin/communities${buildQuery(params)}`);
}

export function getAdminFeedbacks(params: { page?: number; per_page?: number; search?: string; category?: string } = {}) {
  return adminGet<AdminFeedback>(`/admin/feedbacks${buildQuery(params)}`);
}

export function getAdminFeedback(id: string) {
  return api.get<AdminFeedback>(`/admin/feedbacks/${id}`);
}

export function deleteAdminUser(id: string) {
  return api.delete(`/admin/users/${id}`);
}

export function deleteAdminOrganization(id: string) {
  return api.delete(`/admin/organizations/${id}`);
}

export function deleteAdminCommunity(id: string) {
  return api.delete(`/admin/communities/${id}`);
}
