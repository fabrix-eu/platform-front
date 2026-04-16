import { api } from './api';

export const RELATION_TYPES: Record<string, { label: string; description: string; hex: string }> = {
  input_output: { label: 'Supplier / Customer',        description: 'Exchange of materials, goods, or components — this can go in or out.', hex: '#ef4444' },
  energetic:    { label: 'Industrial Symbiosis',        description: 'Flows between organisations (e.g. shared heating system, reuse of waste heat).', hex: '#22c55e' },
  rnd:          { label: 'R&D',                         description: 'Joint R&D, co-development of circular solutions, or shared research.', hex: '#3b82f6' },
  services:     { label: 'Service Provider / Client',   description: 'One offers logistics, repair, design, consulting or other services to the other.', hex: '#facc15' },
  membership:   { label: 'Membership',                  description: 'Part of one community, incubator or accelerator.', hex: '#a855f7' },
  shareholder:  { label: 'Shareholder',                 description: 'Has a financial stake in the business.', hex: '#f97316' },
};

export interface Relation {
  id: string;
  from_organization_id: string;
  to_organization_id: string;
  relation_type: string;
  description: string | null;
}

export async function createRelation(data: {
  from_organization_id: string;
  to_organization_id: string;
  relation_type: string;
  description?: string;
}): Promise<Relation> {
  return api.post<Relation>('/relations', { relation: data });
}

export async function deleteRelation(id: string): Promise<void> {
  return api.delete(`/relations/${id}`);
}
