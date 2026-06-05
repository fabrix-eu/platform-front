import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ORG_KINDS, createOrganization, searchOrganizations } from '../../lib/organizations';
import type { OrganizationBasic } from '../../lib/organizations';
import {
  getCommunityOrganizations,
  addCommunityOrganization,
} from '../../lib/community-organizations';
import { OrgCard, OrgListRow } from '../../components/OrgShared';
import { StepIndicator } from '../../components/org-wizard';
import { OrgDetailsStep } from '../../components/org-wizard';
import type { OrgData } from '../../components/org-wizard';
import { getInitials } from '../../lib/utils';
import { FormError } from '../../components/FieldError';

const ALL_KINDS = Object.entries(ORG_KINDS);

// ── Add member wizard ────────────────────────────────────────

type WizardStep = 'search' | 'ownership' | 'details';
type Ownership = 'owner' | 'reference';

const WIZARD_STEPS = [
  { key: 'search', label: 'Select' },
  { key: 'ownership', label: 'Ownership' },
  { key: 'details', label: 'Details' },
];

const STEP_TITLES: Record<WizardStep, string> = {
  search: 'Grow your community',
  ownership: 'Your relationship',
  details: 'Organization details',
};

const STEP_SUBTITLES: Record<WizardStep, string> = {
  search: 'Know a company that should be here? Add them.',
  ownership: 'How are you related to this organization?',
  details: 'Fill in the details to create this organization',
};

function SearchStep({
  onSelectExisting,
  onCreateNew,
}: {
  onSelectExisting: (org: OrganizationBasic) => void;
  onCreateNew: (query: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OrganizationBasic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    try {
      const orgs = await searchOrganizations(q.trim());
      setResults(orgs);
      setHasSearched(true);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const trimmedQuery = query.trim();

  return (
    <div className="space-y-4">
      {/* Referral prompt — visible before searching */}
      {!hasSearched && !isSearching && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-2">
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Add a supplier, partner, or any organization you know
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Even if they&apos;re not on Fabrix yet. You&apos;ll be able to invite
                the owner by email so they can claim their profile.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Type an organization name..."
          autoFocus
          className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isSearching && (
        <p className="text-center text-sm text-gray-400 py-4">Searching...</p>
      )}

      {!isSearching && hasSearched && (
        <div className="space-y-1">
          {trimmedQuery.length >= 2 && (
            <button
              onClick={() => onCreateNew(trimmedQuery)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-primary">
                  Add &ldquo;{trimmedQuery}&rdquo; to the community
                </p>
                <p className="text-xs text-gray-500">Not on Fabrix yet? Create their profile and invite them</p>
              </div>
            </button>
          )}

          {results.map((org) => {
            const kindInfo = ORG_KINDS[org.kind] || ORG_KINDS.other;
            return (
              <button
                key={org.id}
                onClick={() => onSelectExisting(org)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
              >
                {org.image_url ? (
                  <img src={org.image_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                    {getInitials(org.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{org.name}</p>
                  {org.address && <p className="text-xs text-gray-500 truncate">{org.address}</p>}
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${kindInfo.badgeColor}`}>
                  {kindInfo.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OwnershipStep({
  onBack,
  onContinue,
}: {
  onBack: () => void;
  onContinue: (ownership: Ownership) => void;
}) {
  const [selected, setSelected] = useState<Ownership | null>(null);

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">How are you related to this organization?</p>

      <div className="space-y-3">
        <label
          className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            selected === 'owner' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input type="radio" name="ownership" value="owner" checked={selected === 'owner'} onChange={() => setSelected('owner')} className="mt-0.5 h-4 w-4 text-primary focus:ring-primary" />
          <div>
            <p className="font-medium text-sm text-gray-900">I represent this organization</p>
            <p className="text-xs text-gray-500 mt-0.5">You will be the owner and manage this profile on Fabrix</p>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            selected === 'reference' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input type="radio" name="ownership" value="reference" checked={selected === 'reference'} onChange={() => setSelected('reference')} className="mt-0.5 h-4 w-4 text-primary focus:ring-primary" />
          <div>
            <p className="font-medium text-sm text-gray-900">Adding for reference</p>
            <p className="text-xs text-gray-500 mt-0.5">Add a partner or organization you know about &mdash; it won&apos;t be linked to your account</p>
          </div>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button type="button" onClick={() => selected && onContinue(selected)} disabled={!selected} className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          Continue
        </button>
      </div>
    </div>
  );
}

export function AddMemberModal({
  communitySlug,
  onClose,
  onAdded,
}: {
  communitySlug: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [step, setStep] = useState<WizardStep>('search');
  const [ownership, setOwnership] = useState<Ownership>('owner');
  const [orgData, setOrgData] = useState<OrgData>({ name: '', kind: '', address: '', country_code: '' });
  const [ownerEmail, setOwnerEmail] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const addMutation = useMutation({
    mutationFn: (orgId: string) => addCommunityOrganization(communitySlug, orgId),
    onSuccess: () => {
      onAdded();
      onClose();
    },
  });

  const createAndAddMutation = useMutation({
    mutationFn: async (data: OrgData) => {
      const ownerEmailValue = ownership === 'owner' ? '' : ownerEmail.trim() || undefined;
      const org = await createOrganization({
        name: data.name,
        kind: data.kind,
        address: data.address,
        country_code: data.country_code,
        lat: data.lat,
        lon: data.lon,
        specialties: data.specialties,
        claimed: ownership === 'owner',
        owner_email: ownerEmailValue,
      });
      await addCommunityOrganization(communitySlug, org.id);
      return org;
    },
    onSuccess: () => {
      onAdded();
      onClose();
    },
  });

  const handleSelectExisting = (org: OrganizationBasic) => {
    addMutation.mutate(org.id);
  };

  const handleCreateNew = (query: string) => {
    setOrgData((prev) => ({ ...prev, name: query }));
    setStep('ownership');
  };

  const handleOwnershipContinue = (o: Ownership) => {
    setOwnership(o);
    setStep('details');
  };

  const handleDetailsContinue = (data: OrgData) => {
    setOrgData(data);
    createAndAddMutation.mutate(data);
  };

  const isAdding = addMutation.isPending || createAndAddMutation.isPending;
  const mutationError = addMutation.error || createAndAddMutation.error;

  const scrollToError = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl border border-border w-full max-w-lg mx-4 flex flex-col max-h-[calc(100vh-64px)]" onClick={(e) => e.stopPropagation()}>
        {/* Header — fixed */}
        <div className="px-6 pt-5 pb-3 shrink-0 border-b border-border">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900">{STEP_TITLES[step]}</h3>
            <p className="text-sm text-gray-500 mt-1">{STEP_SUBTITLES[step]}</p>
          </div>

          {step !== 'search' && (
            <div className="mt-4">
              <StepIndicator steps={WIZARD_STEPS} currentKey={step} />
            </div>
          )}
        </div>

        {/* Content — scrollable */}
        <div ref={contentRef} className="px-6 py-5 overflow-y-auto min-h-0 flex-1">
          {mutationError && (
            <div key={String(addMutation.failureCount + createAndAddMutation.failureCount)} ref={scrollToError} className="mb-4">
              {addMutation.error ? (
                <FormError mutation={addMutation} />
              ) : (
                <FormError mutation={createAndAddMutation} />
              )}
            </div>
          )}

          {step === 'search' && (
            <>
              <SearchStep
                onSelectExisting={handleSelectExisting}
                onCreateNew={handleCreateNew}
              />
              {isAdding && (
                <p className="mt-3 text-sm text-gray-500 text-center">Adding...</p>
              )}
            </>
          )}

          {step === 'ownership' && (
            <OwnershipStep
              onBack={() => setStep('search')}
              onContinue={handleOwnershipContinue}
            />
          )}

          {step === 'details' && (
            <OrgDetailsStep
              initialData={orgData}
              mode="create"
              onBack={() => setStep('ownership')}
              onContinue={handleDetailsContinue}
              mutation={createAndAddMutation}
              submitLabel="Add member"
              pendingLabel="Adding..."
              onValidationError={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              footer={
                <div className="space-y-3">
                  {ownership === 'reference' && (
                    <div>
                      <label htmlFor="owner-email" className="block text-sm font-medium text-gray-700 mb-1">
                        Owner&apos;s email <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="owner-email"
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="owner@company.com"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        If provided, they will receive an invitation to claim this organization.
                      </p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      {ownership === 'owner'
                        ? 'You will be the owner of this organization and manage its profile on Fabrix.'
                        : "This organization will be added to the community but won't be linked to your account."}
                    </p>
                  </div>
                </div>
              }
            />
          )}
        </div>

        {/* Footer — fixed */}
        {step === 'search' && (
          <div className="px-6 py-3 border-t border-border flex justify-end shrink-0">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Cancel
            </button>
          </div>
        )}
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
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

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
        >
          Add member
        </button>
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
