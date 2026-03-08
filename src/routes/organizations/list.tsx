import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrganizations, ORG_KINDS } from '../../lib/organizations';
import type { Organization } from '../../lib/organizations';
import { OrganizationsMap } from '../../components/OrganizationsMap';
import { MapLegend } from '../../components/MapLegend';

const ALL_KINDS = Object.keys(ORG_KINDS);

function OrgAvatar({ org }: { org: Organization }) {
  if (org.image_url) {
    return (
      <img
        src={org.image_url}
        alt={org.name}
        className="w-10 h-10 rounded-full object-cover bg-gray-100"
      />
    );
  }

  const initials = org.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
      {initials}
    </div>
  );
}

function KindBadge({ kind }: { kind: string | null }) {
  if (!kind) return null;
  const config = ORG_KINDS[kind] || ORG_KINDS.other;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export function OrganizationsListPage() {
  const navigate = useNavigate();
  const { search, page } = useSearch({ strict: false }) as { search?: string; page?: number };

  const query = useQuery({
    queryKey: ['organizations', { page, search }],
    queryFn: () => getOrganizations({ page: page || 1, per_page: 20, search }),
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get('search') as string) || '';
    navigate({
      to: '/organizations',
      search: { search: q || undefined, page: 1 },
    });
  };

  const [view, setView] = useState<'list' | 'map'>('list');
  const [selectedKinds, setSelectedKinds] = useState<string[]>(ALL_KINDS);
  const meta = query.data?.meta;

  // For map view: fetch all orgs (no pagination)
  const mapQuery = useQuery({
    queryKey: ['organizations', 'map', { search }],
    queryFn: () => getOrganizations({ per_page: 1000, search }),
    enabled: view === 'map',
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">Organizations</h1>

      {/* Search + Add */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          name="search"
          defaultValue={search || ''}
          placeholder="Search organizations..."
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-secondary/80"
        >
          Search
        </button>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            title="List view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setView('map')}
            className={`px-3 py-2 text-sm border-l border-border ${view === 'map' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            title="Map view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
          </button>
        </div>
        <Link
          to="/organizations/new"
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          New Organization
        </Link>
      </form>

      {/* Content */}
      {query.isLoading && <p className="text-muted-foreground">Loading...</p>}
      {query.error && <p className="text-destructive">Failed to load organizations</p>}

      {query.data && view === 'list' && (
        <>
          <p className="text-sm text-muted-foreground">{meta?.total_count ?? 0} results</p>

          <div className="divide-y divide-border border border-border rounded-lg bg-card">
            {query.data.organizations.map((org) => (
              <Link
                key={org.id}
                to="/organizations/$id"
                params={{ id: org.slug || org.id }}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <OrgAvatar org={org} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{org.name}</p>
                    {!org.claimed && (
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
                  <span className="text-muted-foreground">→</span>
                </div>
              </Link>
            ))}
            {query.data.organizations.length === 0 && (
              <p className="px-4 py-8 text-center text-muted-foreground">No organizations found</p>
            )}
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              {meta.prev_page && (
                <Link
                  to="/organizations"
                  search={{ search, page: meta.prev_page }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {meta.current_page} of {meta.total_pages}
              </span>
              {meta.next_page && (
                <Link
                  to="/organizations"
                  search={{ search, page: meta.next_page }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {view === 'map' && (
        <div className="relative border border-border rounded-lg overflow-hidden">
          {mapQuery.isLoading && (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground">
              Loading map...
            </div>
          )}
          {mapQuery.data && (
            <>
              <MapLegend selectedKinds={selectedKinds} onKindsChange={setSelectedKinds} />
              <OrganizationsMap
                organizations={mapQuery.data.organizations}
                selectedKinds={selectedKinds}
                height="500px"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
