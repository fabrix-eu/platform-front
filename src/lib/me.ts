import { api } from './api';

// ── Types ────────────────────────────────────────────────────

export interface UpdateMePayload {
  name?: string;
  email?: string;
  image_url?: string | null;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}

export interface NotificationPreference {
  notification_type: string;
  enabled: boolean;
  in_app: boolean;
  email: boolean;
  mandatory: boolean;
}

// ── Friendly labels for notification types ───────────────────
// The API still lists preferences for retired features (communities,
// challenges); only the types below are shown to the user.

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  event_created: 'New event created',
  nearby_organization_created: 'Nearby organization registered',
  organization_invitation_accepted: 'Organization invitation accepted',
  organization_member_joined: 'New member joined organization',
  organization_claimed: 'Organization claimed',
  join_request_received: 'Join request received',
  join_request_accepted: 'Join request accepted',
  join_request_declined: 'Join request declined',
};

// ── API functions ────────────────────────────────────────────

export async function updateMe(data: UpdateMePayload): Promise<void> {
  await api.patch('/me', { user: data });
}

export async function deleteMe(): Promise<void> {
  await api.delete('/me');
}

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  return api.get<NotificationPreference[]>('/notification_preferences');
}

export async function updateNotificationPreference(
  data: Pick<NotificationPreference, 'notification_type' | 'enabled' | 'in_app' | 'email'>,
): Promise<NotificationPreference> {
  return api.patch<NotificationPreference>('/notification_preferences/update', {
    notification_preference: data,
  });
}
