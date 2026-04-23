import { Link } from '@tanstack/react-router';
import { ORG_KINDS } from '../lib/organizations';
import type { Organization } from '../lib/organizations';

export function OrgAvatar({
  org,
  size = 'md',
  variant = 'default',
}: {
  org: { name: string; image_url: string | null };
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'profile';
}) {
  const sizeClasses = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-20 h-20 text-2xl' };
  const sizeClass = sizeClasses[size];

  const imgStyle = variant === 'profile'
    ? `${sizeClass} rounded-full object-cover bg-white shadow-lg border-4 border-white`
    : `${sizeClass} rounded-full object-cover bg-gray-100`;

  const placeholderStyle = variant === 'profile'
    ? `${sizeClass} rounded-full bg-white text-primary flex items-center justify-center font-bold shadow-lg border-4 border-white`
    : `${sizeClass} rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold`;

  if (org.image_url) {
    return <img src={org.image_url} alt={org.name} className={imgStyle} />;
  }

  const initials = (org.name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return <div className={placeholderStyle}>{initials}</div>;
}

export function KindBadge({ kind }: { kind: string | null }) {
  if (!kind) return null;
  const config = ORG_KINDS[kind] || ORG_KINDS.other;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}>
      {config.label}
    </span>
  );
}

export function OrgCard({ org, linkTo }: { org: Organization; linkTo: string }) {
  const kind = org.kind ? ORG_KINDS[org.kind] || ORG_KINDS.other : null;

  return (
    <Link
      to={linkTo}
      className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <OrgAvatar org={org} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-gray-900 truncate">
                {org.name}
              </h3>
              <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {kind && (
                <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ${kind.badgeColor}`}>
                  {kind.label}
                </span>
              )}
              {org.claimed === false && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 uppercase tracking-wide">
                  Unclaimed
                </span>
              )}
            </div>
            {org.address && (
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {[org.address, org.country_code].filter(Boolean).join(', ')}
              </p>
            )}
            {org.relations_count > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{org.relations_count} relations</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function OrgListRow({ org, linkTo }: { org: Organization; linkTo: string }) {
  return (
    <Link
      to={linkTo}
      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      <OrgAvatar org={org} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{org.name}</p>
          {org.claimed === false && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 uppercase tracking-wide">
              Unclaimed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <KindBadge kind={org.kind} />
          {org.address && (
            <span className="text-xs text-muted-foreground truncate">
              {[org.address, org.country_code].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {org.relations_count > 0 && (
          <span className="text-xs text-muted-foreground">
            {org.relations_count} rel.
          </span>
        )}
        <span className="text-muted-foreground">&rarr;</span>
      </div>
    </Link>
  );
}
