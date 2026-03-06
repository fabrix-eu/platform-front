import { api } from './api';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  kind: string | null;
  description: string | null;
  address: string | null;
  country_code: string | null;
  number_of_workers: number | null;
  image_url: string | null;
}

interface OrganizationsResponse {
  organizations: Organization[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    next_page: number | null;
    prev_page: number | null;
  };
}

export async function getOrganizations(params: {
  page?: number;
  per_page?: number;
  search?: string;
}): Promise<OrganizationsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);

  const suffix = qs.toString() ? `?${qs}` : '';

  // This endpoint returns { organizations, relations, meta } — not standard { data }
  const res = await fetch(`/api/organizations${suffix}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  const json = await res.json();
  return { organizations: json.organizations, meta: json.meta };
}

export async function getOrganization(id: string): Promise<Organization> {
  return api.get<Organization>(`/organizations/${id}`);
}

export async function createOrganization(data: Record<string, unknown>): Promise<Organization> {
  return api.post<Organization>('/organizations', { organization: data });
}

export async function updateOrganization(id: string, data: Record<string, unknown>): Promise<Organization> {
  return api.patch<Organization>(`/organizations/${id}`, { organization: data });
}

export async function deleteOrganization(id: string): Promise<void> {
  return api.delete(`/organizations/${id}`);
}
