import { Link } from '@tanstack/react-router';
import { useNavigationContext } from '../lib/useNavigationContext';
import { isPersonalMode } from '../lib/auth';

function RailIcon({
  active,
  href,
  title,
  unread,
  children,
}: {
  active: boolean;
  href: string;
  title: string;
  unread?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={href}
      title={title}
      className={`relative flex items-center justify-center h-11 w-11 rounded-lg transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
      }`}
    >
      {children}
      {unread && !active && (
        <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-white" />
      )}
    </Link>
  );
}

const CompassIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

function CommunityIcon({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (imageUrl) {
    return (
      <img src={imageUrl} alt={name} className="h-full w-full rounded-lg object-cover" />
    );
  }

  return (
    <span className="text-[10px] font-bold leading-none">{initials}</span>
  );
}

export function AppRail() {
  const { selection, user, currentOrg, communities, unreadBySlug } = useNavigationContext();

  if (!user) return null;

  const personalMode = isPersonalMode() && !('orgSlug' in selection && selection.orgSlug);
  const orgSlug = currentOrg?.organization_slug;

  return (
    <aside className="w-[72px] border-r border-border bg-white flex-shrink-0 flex flex-col items-center py-3 gap-1.5">
      {/* Personal mode: user icon */}
      {personalMode && (
        <RailIcon
          active={selection.kind === 'personal'}
          href="/"
          title={user.name}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </RailIcon>
      )}

      {/* Org mode: org icon */}
      {!personalMode && orgSlug && (
        <RailIcon
          active={selection.kind === 'org'}
          href={`/${orgSlug}/dashboard`}
          title={currentOrg?.organization_name ?? 'My organization'}
        >
          {currentOrg?.organization_image_url ? (
            <img
              src={currentOrg.organization_image_url}
              alt={currentOrg.organization_name}
              className="h-6 w-6 rounded object-cover"
            />
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          )}
        </RailIcon>
      )}

      {/* Community icons */}
      {!personalMode && orgSlug && communities.map((c) => {
        const isActive =
          selection.kind === 'community' && selection.communitySlug === c.community_slug;
        const unread = (unreadBySlug.get(c.community_slug) ?? []).length > 0;

        return (
          <RailIcon
            key={c.community_id}
            active={isActive}
            href={`/${orgSlug}/communities/${c.community_slug}`}
            title={c.community_name}
            unread={unread}
          >
            <CommunityIcon name={c.community_name} imageUrl={c.community_image_url} />
          </RailIcon>
        );
      })}

      {/* Separator before explore */}
      <div className="w-6 border-t border-border my-1" />

      {/* Explore */}
      <RailIcon
        active={selection.kind === 'explore'}
        href="/global"
        title="Explore"
      >
        <CompassIcon />
      </RailIcon>
    </aside>
  );
}
