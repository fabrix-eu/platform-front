import { useState, useRef, useEffect } from 'react';
import { Link, useParams, useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe, getActiveOrgSlug, setActiveOrgSlug, isPersonalMode, setPersonalMode, type MeOrganization } from '../lib/auth';
import { ORG_KINDS } from '../lib/organizations';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { getInitials } from '../lib/utils';

function UserAvatar({ user }: { user: { name: string; image_url: string | null } }) {
  return (
    <Avatar>
      <AvatarImage src={user.image_url ?? undefined} alt={user.name} />
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

function OrgAvatar({ org }: { org: MeOrganization }) {
  const initials = org.organization_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Avatar>
      <AvatarImage src={org.organization_image_url ?? undefined} alt={org.organization_name} />
      <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
    </Avatar>
  );
}

/**
 * Compute the destination when switching org, based on current context:
 * - Shell A: go to /$newSlug/dashboard
 * - Shell B (/$orgSlug/profile): preserve section → /$newSlug/profile
 * - Shell C (/$orgSlug/communities/$c/...): don't preserve community → /$newSlug/communities
 */
function getOrgSwitchPath(
  currentSlug: string | undefined,
  newSlug: string,
  pathname: string
): string {
  if (!currentSlug) {
    return `/${newSlug}/dashboard`;
  }

  const communityMatch = pathname.match(
    new RegExp(`^/${currentSlug}/communities/[^/]+`)
  );
  if (communityMatch) {
    return `/${newSlug}/communities`;
  }

  return pathname.replace(`/${currentSlug}`, `/${newSlug}`);
}

const ChevronDown = () => (
  <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const params = useParams({ strict: false });
  const router = useRouter();
  const orgSlug = (params as Record<string, string | undefined>).orgSlug;

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const user = me.data;
  const organizations = user?.organizations ?? [];

  const personalMode = !orgSlug && isPersonalMode();
  const resolvedSlug = orgSlug || getActiveOrgSlug();
  const currentOrg = personalMode
    ? null
    : (resolvedSlug
      ? organizations.find((o) => o.organization_slug === resolvedSlug)
      : null) ?? organizations[0] ?? null;

  // Persist active org whenever it changes
  useEffect(() => {
    if (currentOrg) setActiveOrgSlug(currentOrg.organization_slug);
  }, [currentOrg]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (organizations.length === 0) return null;

  const activeSlug = currentOrg?.organization_slug;

  const handleOrgClick = (org: MeOrganization) => {
    setOpen(false);
    const pathname = router.state.location.pathname;
    const dest = getOrgSwitchPath(orgSlug, org.organization_slug, pathname);
    router.navigate({ to: dest });
  };

  const handlePersonalClick = () => {
    setOpen(false);
    setPersonalMode();
    router.navigate({ to: '/' });
  };

  return (
    <nav className="flex items-center gap-0 text-sm min-w-0">
      {/* Org switcher dropdown */}
      <div ref={dropdownRef} className="relative min-w-0">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-gray-100 transition-colors min-w-0"
        >
          {personalMode && user ? (
            <>
              <UserAvatar user={user} />
              <span className="truncate font-medium text-gray-700">
                {user.name}
              </span>
            </>
          ) : currentOrg ? (
            <>
              <OrgAvatar org={currentOrg} />
              <span className="truncate font-medium text-gray-700">
                {currentOrg.organization_name}
              </span>
            </>
          ) : (
            <span className="text-gray-400 italic truncate">
              Select an organization
            </span>
          )}
          <ChevronDown />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-border rounded-lg shadow-lg z-50 py-1">
            {user && (
              <button
                type="button"
                onClick={handlePersonalClick}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left ${
                  personalMode ? 'bg-gray-50 font-medium' : 'text-gray-700'
                }`}
              >
                <UserAvatar user={user} />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{user.name}</div>
                  <span className="text-[10px] text-gray-400">Personal account</span>
                </div>
              </button>
            )}
            <div className="border-t border-border mt-1 pt-1">
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Organizations
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {organizations.map((org) => {
                const kind = org.organization_kind ? ORG_KINDS[org.organization_kind] : null;
                return (
                  <button
                    key={org.organization_id}
                    type="button"
                    onClick={() => handleOrgClick(org)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left ${
                      org.organization_slug === activeSlug ? 'bg-gray-50 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <OrgAvatar org={org} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{org.organization_name}</div>
                      {kind && (
                        <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ${kind.badgeColor}`}>
                          {kind.label}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border mt-1 pt-1">
              <Link
                to="/organizations/new"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Organization
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
