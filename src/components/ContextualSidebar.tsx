import { Link, useLocation } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useNavigationContext } from '../lib/useNavigationContext';
import { getMe, type MeOrganization } from '../lib/auth';
import { getMyApplications } from '../lib/community-challenges';
import { getListings, listingKeys } from '../lib/listings';

interface SidebarItem {
  key: string;
  label: string;
  href: string;
  exact?: boolean;
  badge?: string | number | null;
  badgeVariant?: 'default' | 'highlight';
  unreadDot?: boolean;
}

function NavItems({ items, pathname }: { items: SidebarItem[]; pathname: string }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <li key={item.key}>
            <Link
              to={item.href}
              className={`flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                {item.label}
                {item.unreadDot && !isActive && (
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
              </span>
              {item.badge != null && (
                <span
                  className={
                    item.badgeVariant === 'highlight'
                      ? 'text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium tabular-nums'
                      : 'text-[11px] tabular-nums text-gray-400 font-normal'
                  }
                >
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-3 mb-3 pb-3 border-b border-border">
      <h2 className="text-sm font-display font-bold text-gray-900 truncate">{title}</h2>
      {subtitle && (
        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{subtitle}</p>
      )}
    </div>
  );
}

function PersonalSidebar({ pathname }: { pathname: string }) {
  const items: SidebarItem[] = [
    { key: 'dashboard', label: 'Dashboard', href: '/', exact: true },
    { key: 'messages', label: 'Messages', href: '/messages' },
    { key: 'notifications', label: 'Notifications', href: '/notifications' },
    { key: 'settings', label: 'Settings', href: '/settings' },
  ];

  return (
    <>
      <SectionTitle title="Personal" />
      <NavItems items={items} pathname={pathname} />
    </>
  );
}

function OrgSidebar({
  orgSlug,
  userOrg,
  pathname,
}: {
  orgSlug: string;
  userOrg?: MeOrganization;
  pathname: string;
}) {
  const orgId = userOrg?.organization_id;

  const pendingQuery = useQuery({
    queryKey: ['my_challenge_applications_pending_count'],
    queryFn: () => getMyApplications({ status: 'pending', per_page: 1 }),
  });
  const pendingCount = pendingQuery.data?.meta.total_count ?? 0;

  const listingsCountParams = { by_organization: orgId!, per_page: 1 };
  const listingsCountQuery = useQuery({
    queryKey: listingKeys.list(listingsCountParams),
    queryFn: () => getListings(listingsCountParams),
    enabled: !!orgId,
  });
  const listingsCount = listingsCountQuery.data?.meta.total_count ?? 0;

  const items: SidebarItem[] = [
    { key: 'dashboard', label: 'Dashboard', href: `/${orgSlug}/dashboard` },
    { key: 'profile', label: 'Profile', href: `/${orgSlug}/profile` },
    {
      key: 'assessments',
      label: 'Impact Compass',
      href: `/${orgSlug}/assessments`,
      badge: userOrg ? `${userOrg.assessments_completed}/${userOrg.assessments_total}` : null,
    },
    {
      key: 'relations',
      label: 'Relations',
      href: `/${orgSlug}/relations`,
      badge: userOrg?.relations_count ?? null,
    },
    { key: 'messages', label: 'Messages', href: `/${orgSlug}/messages` },
    { key: 'listings', label: 'Listings', href: `/${orgSlug}/listings`, badge: listingsCount || null },
    {
      key: 'challenges',
      label: 'Challenges',
      href: `/${orgSlug}/challenges`,
      badge: pendingCount || null,
      badgeVariant: 'highlight',
    },
    { key: 'members', label: 'Members', href: `/${orgSlug}/settings/members` },
  ];

  return (
    <>
      <SectionTitle title={userOrg?.organization_name ?? 'Organization'} subtitle="Organization" />
      <NavItems items={items} pathname={pathname} />
    </>
  );
}

function CommunitySidebar({
  orgSlug,
  communitySlug,
  pathname,
}: {
  orgSlug: string;
  communitySlug: string;
  pathname: string;
}) {
  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });

  const community = meQuery.data?.accessible_communities?.find(
    (c) => c.slug === communitySlug,
  );
  const isAdmin = community?.is_admin ?? false;
  const communityName = community?.name ?? communitySlug;
  const unread = new Set(community?.unread_sections ?? []);

  const basePath = `/${orgSlug}/communities/${communitySlug}`;

  const items: SidebarItem[] = [
    { key: 'overview', label: 'Overview', href: basePath, exact: true, unreadDot: unread.has('overview') },
    { key: 'members', label: 'Members', href: `${basePath}/members` },
    { key: 'spaces', label: 'Spaces', href: `${basePath}/spaces`, unreadDot: unread.has('spaces') },
    { key: 'events', label: 'Events', href: `${basePath}/events`, unreadDot: unread.has('events') },
    { key: 'challenges', label: 'Challenges', href: `${basePath}/challenges`, unreadDot: unread.has('challenges') },
    { key: 'marketplace', label: 'Marketplace', href: `${basePath}/marketplace`, unreadDot: unread.has('marketplace') },
    { key: 'matchmaking', label: 'Matchmaking', href: `${basePath}/matchmaking` },
  ];

  const adminItems: SidebarItem[] = isAdmin
    ? [
        { key: 'join-requests', label: 'Join Requests', href: `${basePath}/join-requests` },
        { key: 'settings', label: 'Settings', href: `${basePath}/settings` },
      ]
    : [];

  return (
    <>
      <SectionTitle title={communityName} subtitle="Community" />
      <NavItems items={items} pathname={pathname} />
      {adminItems.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <NavItems items={adminItems} pathname={pathname} />
        </div>
      )}
    </>
  );
}

function ExploreSidebar({ pathname }: { pathname: string }) {
  const items: SidebarItem[] = [
    { key: 'directory', label: 'Directory', href: '/directory' },
    { key: 'map', label: 'Map', href: '/map' },
    { key: 'events', label: 'Events', href: '/events' },
    { key: 'challenges', label: 'Challenges', href: '/challenges' },
    { key: 'marketplace', label: 'Marketplace', href: '/marketplace' },
    { key: 'communities', label: 'Communities', href: '/communities' },
  ];

  return (
    <>
      <SectionTitle title="Explore" />
      <NavItems items={items} pathname={pathname} />
    </>
  );
}

export function ContextualSidebar() {
  const { selection } = useNavigationContext();
  const { pathname } = useLocation();

  return (
    <aside className="w-[220px] border-r border-border bg-white flex-shrink-0 overflow-y-auto">
      <nav className="p-2">
        {selection.kind === 'personal' && <PersonalSidebar pathname={pathname} />}
        {selection.kind === 'org' && (
          <OrgSidebarWrapper orgSlug={selection.orgSlug} pathname={pathname} />
        )}
        {selection.kind === 'community' && (
          <CommunitySidebar
            orgSlug={selection.orgSlug}
            communitySlug={selection.communitySlug}
            pathname={pathname}
          />
        )}
        {selection.kind === 'explore' && <ExploreSidebar pathname={pathname} />}
      </nav>
    </aside>
  );
}

function OrgSidebarWrapper({ orgSlug, pathname }: { orgSlug: string; pathname: string }) {
  const { currentOrg } = useNavigationContext();
  return <OrgSidebar orgSlug={orgSlug} userOrg={currentOrg} pathname={pathname} />;
}
