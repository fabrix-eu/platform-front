import { Link, useParams, useRouter } from '@tanstack/react-router';
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
  const router = useRouter();
  const pathname = router.state.location.pathname;

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const user = me.data;

  if (!user || user.organizations.length === 0) return null;

  const orgSlug = params.orgSlug || getActiveOrgSlug() || user.organizations[0].organization_slug;
  const userOrg = user.organizations.find((o) => o.organization_slug === orgSlug);

  return (
    <aside className="w-64 border-r border-border bg-white flex-shrink-0 flex flex-col">
      <nav className="p-2 flex-1">
        {/* Org section */}
        <OrgNav orgSlug={orgSlug} userOrg={userOrg} pathname={pathname} />

        {/* Explore section */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            Explore
          </div>
          <ExploreNav pathname={pathname} />
        </div>

        {/* Communities section — disabled for now
        {communities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              Communities
            </div>
            <ul className="space-y-0.5">
              {communities.map((c) => {
                const initials = c.community_name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <li key={c.community_id}>
                    <Link
                      to="/$orgSlug/communities/$communitySlug"
                      params={{ orgSlug, communitySlug: c.community_slug }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      activeProps={{ className: 'flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-blue-50 text-blue-700 font-medium' }}
                    >
                      {c.community_image_url ? (
                        <img
                          src={c.community_image_url}
                          alt={c.community_name}
                          className="h-5 w-5 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-semibold flex-shrink-0">
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
        )}
        */}
      </nav>
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
    {
      key: 'communities',
      label: 'Communities',
      href: `/${orgSlug}/communities`,
      badge: userOrg?.communities.length || null,
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

const exploreItems = [
  { key: 'directory', label: 'Directory', href: '/organizations' },
  { key: 'map', label: 'Map', href: '/map' },
  { key: 'marketplace', label: 'Marketplace', href: '/marketplace' },
  { key: 'events', label: 'Events', href: '/events' },
  { key: 'challenges', label: 'Challenges', href: '/challenges' },
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
