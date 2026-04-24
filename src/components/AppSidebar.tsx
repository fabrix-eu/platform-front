import { Link, useParams, useLocation } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe, getActiveOrgSlug, type MeOrganization } from '../lib/auth';
import { getMyApplications } from '../lib/community-challenges';

interface SidebarItem {
  key: string;
  label: string;
  href: string;
  badge?: string | number | null;
  badgeVariant?: 'default' | 'highlight';
}

export function AppSidebar() {
  const params = useParams({ strict: false }) as Record<string, string | undefined>;
  const { pathname } = useLocation();

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const user = me.data;

  if (!user) return null;

  const hasOrgs = user.organizations.length > 0;
  const orgSlug = hasOrgs
    ? params.orgSlug || getActiveOrgSlug() || user.organizations[0].organization_slug
    : undefined;
  const userOrg = orgSlug ? user.organizations.find((o) => o.organization_slug === orgSlug) : undefined;

  return (
    <aside className="w-64 border-r border-border bg-white flex-shrink-0 flex flex-col min-h-[calc(100vh-56px)]">
      <nav className="p-2 flex-1">
        {/* Org section */}
        {orgSlug && <OrgNav orgSlug={orgSlug} userOrg={userOrg} pathname={pathname} />}

        {/* My communities */}
        {orgSlug && (
          <CommunitiesNav orgSlug={orgSlug} communities={userOrg?.communities ?? []} pathname={pathname} />
        )}

        {/* Explore section */}
        <div className={hasOrgs ? 'mt-4 pt-4 border-t border-border' : ''}>
          <div className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Explore
          </div>
          <ExploreNav pathname={pathname} />
        </div>
      </nav>

      {/* User section — pinned to viewport bottom */}
      <div className="p-2 border-t border-border bg-white sticky bottom-0">
        <UserNav pathname={pathname} />
      </div>
    </aside>
  );
}

function OrgNav({
  orgSlug,
  userOrg,
  pathname,
}: {
  orgSlug: string;
  userOrg?: MeOrganization;
  pathname: string;
}) {
  const pendingQuery = useQuery({
    queryKey: ['my_challenge_applications_pending_count'],
    queryFn: () => getMyApplications({ status: 'pending', per_page: 1 }),
  });
  const pendingCount = pendingQuery.data?.meta.total_count ?? 0;

  const navItems: SidebarItem[] = [
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
    {
      key: 'opportunities',
      label: 'Opportunities',
      href: `/${orgSlug}/opportunities`,
      badge: pendingCount || null,
      badgeVariant: 'highlight',
    },
  ];

  return (
    <ul className="space-y-0.5">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
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
              {item.label}
              {item.badge != null && (
                <span className={
                  item.badgeVariant === 'highlight'
                    ? 'text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium tabular-nums'
                    : 'text-[11px] tabular-nums text-gray-400 font-normal'
                }>
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
      <li>
        <Link
          to="/$orgSlug/settings/members"
          params={{ orgSlug }}
          className={`block px-3 py-2 text-sm rounded-md transition-colors ${
            pathname.startsWith(`/${orgSlug}/settings`)
              ? 'bg-gray-100 text-gray-900 font-medium'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          Members
        </Link>
      </li>
    </ul>
  );
}

function UserNav({ pathname }: { pathname: string }) {
  const items = [
    { key: 'home', label: 'Home', href: '/', exact: true, icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    )},
    { key: 'messages', label: 'Personal Messages', href: '/messages', exact: false, icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    )},
    { key: 'notifications', label: 'Notifications', href: '/notifications', exact: false, icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    )},
  ];

  return (
    <ul className="flex items-center justify-center gap-1">
      {items.map((item) => {
        const isActive = item.exact ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <li key={item.key}>
            <Link
              to={item.href}
              className={`flex items-center justify-center h-9 w-9 rounded-full transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
              title={item.label}
            >
              {item.icon}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CommunitiesNav({
  orgSlug,
  communities,
  pathname,
}: {
  orgSlug: string;
  communities: MeOrganization['communities'];
  pathname: string;
}) {
  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
        Communities
      </div>
      <ul className="space-y-0.5">
        {communities.map((c) => {
          const href = `/${orgSlug}/communities/${c.community_slug}`;
          const isActive = pathname.startsWith(href);
          const initials = c.community_name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <li key={c.community_id}>
              <Link
                to={href}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {c.community_image_url ? (
                  <img
                    src={c.community_image_url}
                    alt={c.community_name}
                    className="h-5 w-5 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[8px] font-semibold flex-shrink-0">
                    {initials}
                  </div>
                )}
                <span className="truncate">{c.community_name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const exploreItems = [
  { key: 'directory', label: 'Directory', href: '/organizations' },
  { key: 'map', label: 'Map', href: '/map' },
  { key: 'marketplace', label: 'Marketplace', href: '/marketplace' },
  { key: 'events', label: 'Events', href: '/events' },
  { key: 'challenges', label: 'Challenges', href: '/challenges' },
  { key: 'communities', label: 'Communities', href: '/communities' },
];

function ExploreNav({ pathname }: { pathname: string }) {
  return (
    <ul className="space-y-0.5">
      {exploreItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <li key={item.key}>
            <Link
              to={item.href}
              className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
