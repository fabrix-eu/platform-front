import { useParams, useLocation } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe, getActiveOrgSlug, isPersonalMode, type User, type MeOrganization } from './auth';

export type RailSelection =
  | { kind: 'personal' }
  | { kind: 'org'; orgSlug: string }
  | { kind: 'community'; orgSlug: string; communitySlug: string }
  | { kind: 'explore' };

const PERSONAL_PATHS = ['/settings', '/notification-preferences'];

function computeSelection(
  params: Record<string, string | undefined>,
  pathname: string,
): RailSelection {
  const { orgSlug, communitySlug } = params;

  if (communitySlug && orgSlug) {
    return { kind: 'community', orgSlug, communitySlug };
  }
  if (orgSlug) {
    return { kind: 'org', orgSlug };
  }
  if (isPersonalMode() || PERSONAL_PATHS.some((p) => pathname.startsWith(p))) {
    return { kind: 'personal' };
  }
  return { kind: 'explore' };
}

export function useNavigationContext() {
  const params = useParams({ strict: false }) as Record<string, string | undefined>;
  const { pathname } = useLocation();

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe, retry: false });
  const user = meQuery.data ?? undefined;

  const selection = computeSelection(params, pathname);

  const hasOrgs = (user?.organizations.length ?? 0) > 0;
  const resolvedOrgSlug =
    selection.kind === 'org' || selection.kind === 'community'
      ? selection.orgSlug
      : getActiveOrgSlug() ?? undefined;

  const currentOrg = hasOrgs && resolvedOrgSlug
    ? user?.organizations.find((o) => o.organization_slug === resolvedOrgSlug)
    : undefined;

  const communities = currentOrg?.communities ?? [];

  return { selection, user, currentOrg, communities } as {
    selection: RailSelection;
    user: User | undefined;
    currentOrg: MeOrganization | undefined;
    communities: MeOrganization['communities'];
  };
}
