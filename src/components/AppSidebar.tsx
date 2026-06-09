import { useQuery } from '@tanstack/react-query';
import { getMe, isPersonalMode, type MeOrganization } from '../lib/auth';
import { useNavigationContext } from '../lib/useNavigationContext';
import { SidebarNav, type NavItem, type NavGroup } from './SidebarNav';

function buildOrgGroup(orgSlug: string, userOrg?: MeOrganization): NavGroup {
  return {
    label: userOrg?.organization_name ?? 'Organization',
    children: [
      { to: `/${orgSlug}/dashboard`, label: 'Dashboard' },
      { to: `/${orgSlug}/profile`, label: 'Profile' },
      {
        to: `/${orgSlug}/assessments`,
        label: 'Impact Compass',
        badge: userOrg ? `${userOrg.assessments_completed}/${userOrg.assessments_total}` : null,
      },
      {
        to: `/${orgSlug}/relations`,
        label: 'Relations',
        badge: userOrg?.relations_count ?? null,
      },
      { to: `/${orgSlug}/messages`, label: 'Messages' },
      { to: `/${orgSlug}/listings`, label: 'Listings' },
      { to: `/${orgSlug}/challenges`, label: 'Challenges' },
      { to: `/${orgSlug}/settings/members`, label: 'Members' },
    ],
  };
}

function buildCommunityGroup(
  orgSlug: string,
  community: MeOrganization['communities'][number],
  unreadSections: string[],
  isAdmin: boolean,
): NavGroup {
  const base = `/${orgSlug}/communities/${community.community_slug}`;
  const unread = new Set(unreadSections);

  const children = [
    { to: base, label: 'Overview', exact: true, unreadDot: unread.has('overview') },
    { to: `${base}/members`, label: 'Members' },
    { to: `${base}/spaces`, label: 'Spaces', unreadDot: unread.has('spaces') },
    { to: `${base}/events`, label: 'Events', unreadDot: unread.has('events') },
    { to: `${base}/challenges`, label: 'Challenges', unreadDot: unread.has('challenges') },
    { to: `${base}/marketplace`, label: 'Marketplace', unreadDot: unread.has('marketplace') },
    { to: `${base}/matchmaking`, label: 'Matchmaking' },
  ];

  if (isAdmin) {
    children.push(
      { to: `${base}/join-requests`, label: 'Join Requests' },
      { to: `${base}/settings`, label: 'Settings' },
    );
  }

  return {
    label: community.community_name,
    children,
    unreadDot: unreadSections.length > 0,
  };
}

const EXPLORE_GROUP: NavGroup = {
  label: 'Explore',
  children: [
    { to: '/global', label: 'Directory Map' },
    { to: '/events', label: 'Events' },
    { to: '/challenges', label: 'Challenges' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/communities', label: 'Communities' },
  ],
};

export function AppSidebar() {
  const { user, currentOrg, communities, unreadBySlug } = useNavigationContext();
  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const accessibleCommunities = meQuery.data?.accessible_communities ?? [];

  if (!user) return null;

  const orgSlug = currentOrg?.organization_slug;
  const personalMode = isPersonalMode() && !orgSlug;

  const items: NavItem[] = [];

  if (personalMode) {
    items.push(
      { to: '/', label: 'Home', exact: true },
      { to: '/messages', label: 'Messages' },
      { to: '/notifications', label: 'Notifications' },
      { to: '/settings', label: 'Settings' },
    );
  }

  if (orgSlug) {
    items.push(buildOrgGroup(orgSlug, currentOrg));

    for (const c of communities) {
      const accessible = accessibleCommunities.find((ac) => ac.slug === c.community_slug);
      const isAdmin = accessible?.is_admin ?? false;
      const unreadSections = unreadBySlug.get(c.community_slug) ?? [];
      items.push(buildCommunityGroup(orgSlug, c, unreadSections, isAdmin));
    }
  }

  items.push(EXPLORE_GROUP);

  return (
    <aside className="w-56 border-r border-border bg-white flex-shrink-0 overflow-y-auto">
      <nav className="p-2">
        <SidebarNav items={items} />
      </nav>
    </aside>
  );
}
