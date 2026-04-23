import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { ORG_KINDS } from '../../lib/organizations';
import type { Organization } from '../../lib/organizations';
import {
  getCommunityOrganizations,
  addCommunityOrganization,
} from '../../lib/community-organizations';
import { getOrganizations } from '../../lib/organizations';
import { OrgAvatar, KindBadge, OrgCard, OrgListRow } from '../../components/OrgShared';

const ALL_KINDS = Object.entries(ORG_KINDS);

// ── Add member modal ─────────────────────────────────────────

function AddMemberModal({
  communitySlug,
  onClose,
  onAdded,
}: {
  communitySlug: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Organization | null>(null);

  const searchQuery = useQuery({
    queryKey: ['organizations', 'search-add-member', search],
    queryFn: () => getOrganizations({ page: 1, per_page: 10, search }),
    enabled: search.length >= 2,
  });

  const addMutation = useMutation({
    mutationFn: (orgId: string) => addCommunityOrganization(communitySlug, orgId),
    onSuccess: () => {
      onAdded();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl border border-border w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900">Add organization to community</h3>
        </div>

        <div className="p-4 space-y-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
            placeholder="Search organizations..."
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />

          {search.length >= 2 && !selected && (
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {searchQuery.isLoading && (
                <p className="px-3 py-2 text-sm text-gray-400">Searching...</p>
              )}
              {searchQuery.data?.organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelected(org)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <OrgAvatar org={org} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                    <KindBadge kind={org.kind} />
                  </div>
                </button>
              ))}
              {searchQuery.data && searchQuery.data.organizations.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-400">No organizations found</p>
              )}
            </div>
          )}

          {selected && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <OrgAvatar org={selected} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{selected.name}</p>
                <KindBadge kind={selected.kind} />
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {addMutation.error && (
            <p className="text-sm text-red-600">
              {(addMutation.error as Error).message || 'Failed to add organization'}
            </p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => selected && addMutation.mutate(selected.id)}
            disabled={!selected || addMutation.isPending}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {addMutation.isPending ? 'Adding...' : 'Add member'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────

export function CommunityMembersPage() {
  const { orgSlug, communitySlug } = useParams({ strict: false }) as { orgSlug: string; communitySlug: string };
  const navigate = useNavigate();
  const qc = useQueryClient();
  const searchParams = useSearch({ strict: false }) as { search?: string; page?: number; kinds?: string };
  const { search, page, kinds } = searchParams;

  const selectedKinds = kinds ? kinds.split(',') : [];
  const [view, setView] = useState<'list' | 'cards'>('cards');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        filtersOpen &&
        filterRef.current && !filterRef.current.contains(e.target as Node) &&
        filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)
      ) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filtersOpen]);

  const activeFilterCount = selectedKinds.length > 0 ? 1 : 0;

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = me.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  const query = useQuery({
    queryKey: ['community_organizations', communitySlug, { page, search, kinds }],
    queryFn: () => getCommunityOrganizations(communitySlug, { page: page || 1, per_page: 20, search, kinds }),
  });

  const meta = query.data?.meta;
  const members = query.data?.data ?? [];

  const updateSearch = (updates: Record<string, unknown>) => {
    navigate({
      to: '/$orgSlug/communities/$communitySlug/members',
      params: { orgSlug, communitySlug },
      search: { ...searchParams, page: 1, ...updates },
    });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get('search') as string) || '';
    updateSearch({ search: q || undefined });
  };

  const toggleKind = (kind: string) => {
    const next = selectedKinds.includes(kind)
      ? selectedKinds.filter((k) => k !== kind)
      : [...selectedKinds, kind];
    updateSearch({ kinds: next.length > 0 ? next.join(',') : undefined });
  };

  const setPage = (p: number) => {
    updateSearch({ page: p > 1 ? p : undefined });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-lg font-display font-bold text-gray-900">Members</h2>

      {/* Search + Filter + View toggle + Add */}
      <div className="flex gap-2 items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            name="search"
            defaultValue={search || ''}
            placeholder="Search members..."
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </form>

        <div className="relative">
          <button
            ref={filterBtnRef}
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`relative border rounded-lg px-3 py-2 text-sm transition-colors ${
              filtersOpen || activeFilterCount > 0
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
            title="Filters"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75M10.5 18a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 18H7.5m6-6h6.75M13.5 12a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12h7.5" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

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
            onClick={() => setView('cards')}
            className={`px-3 py-2 text-sm border-l border-border ${view === 'cards' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            title="Cards view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
          </button>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
          >
            Add member
          </button>
        )}
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div ref={filterRef} className="border border-border rounded-lg bg-white p-4 space-y-4 shadow-sm">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Organization type</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_KINDS.map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleKind(key)}
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedKinds.includes(key)
                      ? `${cfg.badgeColor} ring-2 ring-offset-1 ring-primary/30`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => updateSearch({ kinds: undefined })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {query.isLoading && <p className="text-muted-foreground">Loading...</p>}
      {query.error && <p className="text-destructive">Failed to load members</p>}

      {query.data && (
        <>
          <p className="text-sm text-muted-foreground">{meta?.total_count ?? 0} members</p>

          {view === 'list' && (
            <div className="divide-y divide-border border border-border rounded-lg bg-card">
              {members.map((m) => (
                <OrgListRow
                  key={m.id}
                  org={m.organization}
                  linkTo={`/${orgSlug}/communities/${communitySlug}/members/${m.id}`}
                />
              ))}
              {members.length === 0 && (
                <p className="px-4 py-8 text-center text-muted-foreground">No members found</p>
              )}
            </div>
          )}

          {view === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members.map((m) => (
                <OrgCard
                  key={m.id}
                  org={m.organization}
                  linkTo={`/${orgSlug}/communities/${communitySlug}/members/${m.id}`}
                />
              ))}
              {members.length === 0 && (
                <p className="text-center text-muted-foreground col-span-2">No members found</p>
              )}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              {meta.prev_page && (
                <button
                  onClick={() => setPage(meta.prev_page!)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  &larr; Previous
                </button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {meta.current_page} of {meta.total_pages}
              </span>
              {meta.next_page && (
                <button
                  onClick={() => setPage(meta.next_page!)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Next &rarr;
                </button>
              )}
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <AddMemberModal
          communitySlug={communitySlug}
          onClose={() => setShowAddModal(false)}
          onAdded={() => qc.invalidateQueries({ queryKey: ['community_organizations', communitySlug] })}
        />
      )}
    </div>
  );
}
