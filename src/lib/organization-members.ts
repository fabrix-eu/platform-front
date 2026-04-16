import { api } from './api';

// --- Types (matching backend blueprints) ---

export interface OrganizationMember {
  id: string;
  role: 'owner' | 'member';
  status: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    image_url: string | null;
  };
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: 'owner' | 'member';
  invitation_type: string;
  expires_at: string;
  created_at: string;
  expired: boolean;
  organization: {
    id: string;
    name: string;
  };
  invited_by: {
    id: string;
    name: string;
    email: string;
  };
}

// --- API functions ---

export async function getOrgMembers(orgId: string): Promise<OrganizationMember[]> {
  return api.get<OrganizationMember[]>(`/organizations/${orgId}/users`);
}

export async function getOrgInvitations(orgId: string): Promise<OrganizationInvitation[]> {
  return api.get<OrganizationInvitation[]>(`/organizations/${orgId}/invitations`);
}

export async function inviteMember(
  orgId: string,
  data: { email: string; role: string },
): Promise<void> {
  await api.post(`/organizations/${orgId}/invitations`, { invitation: data });
}

export async function updateMemberRole(
  orgId: string,
  orgUserId: string,
  role: string,
): Promise<OrganizationMember> {
  return api.patch<OrganizationMember>(
    `/organizations/${orgId}/users/${orgUserId}`,
    { organization_user: { role } },
  );
}

export async function removeMember(orgId: string, orgUserId: string): Promise<void> {
  await api.delete(`/organizations/${orgId}/users/${orgUserId}`);
}

export async function cancelInvitation(orgId: string, invitationId: string): Promise<void> {
  await api.delete(`/organizations/${orgId}/invitations/${invitationId}`);
}

export async function resendInvitation(orgId: string, invitationId: string): Promise<void> {
  await api.post(`/organizations/${orgId}/invitations/${invitationId}/resend`, {});
}
