import { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrganization, submitClaim, ORG_KINDS } from '../lib/organizations';
import type { Organization } from '../lib/organizations';
import { COVER_IMAGES } from '../lib/mockOrgData';
import { getMe } from '../lib/auth';
import type { MeOrganization } from '../lib/auth';
import { useListings, LISTING_TYPES, LISTING_CATEGORIES } from '../lib/listings';
import type { Listing } from '../lib/listings';
import { createRelation, deleteRelation, RELATION_TYPES } from '../lib/relations';
import type { Relation } from '../lib/relations';
import { createJoinRequest, getMyJoinRequests } from '../lib/join-requests';
import { uploadFile } from '../lib/uploads';
import { FieldError, FormError } from './FieldError';
import { OrgAvatar, KindBadge } from './OrgShared';

// ── Listings ────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: Listing }) {
  const categoryConfig = LISTING_CATEGORIES[listing.category];
  return (
    <Link
      to="/marketplace/$id"
      params={{ id: listing.id }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-gray-300 transition-all"
    >
      {listing.thumbnail_url ? (
        <img src={listing.thumbnail_url} alt="" className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-gray-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
        {categoryConfig && (
          <span className={`inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${categoryConfig.badgeColor}`}>
            {categoryConfig.label}
          </span>
        )}
        {listing.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{listing.description}</p>
        )}
      </div>
    </Link>
  );
}

function ListingsSection({ orgId, listingType }: { orgId: string; listingType: string }) {
  const listingsQuery = useListings({ by_organization: orgId, by_type: listingType, per_page: 6 });
  const listings = listingsQuery.data?.data ?? [];
  const typeConfig = LISTING_TYPES[listingType];

  if (listingsQuery.isLoading || listings.length === 0) return null;

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{typeConfig?.label ?? listingType}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}

// ── Claim & Join ────────────────────────────────────────────────

function ClaimButton({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [justification, setJustification] = useState('');

  const mutation = useMutation({
    mutationFn: (text: string) => submitClaim(orgId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['my', 'organization_claims'] });
    },
  });

  if (mutation.isSuccess) {
    return (
      <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200">
        Claim request sent
      </span>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="bg-yellow-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-yellow-600 transition-colors"
      >
        Claim
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-80">
      <p className="text-xs text-gray-500">Explain why you should manage this organization (min. 20 characters)</p>
      <textarea
        value={justification}
        onChange={(e) => setJustification(e.target.value)}
        placeholder="I am the owner of this organization..."
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
      />
      <FieldError mutation={mutation} field="justification" />
      <FormError mutation={mutation} />
      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate(justification.trim())}
          disabled={justification.trim().length < 20 || mutation.isPending}
          className="bg-yellow-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-yellow-600 disabled:opacity-50"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit claim'}
        </button>
        <button
          onClick={() => { setShowForm(false); setJustification(''); }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function JoinRequestButton({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const myRequestsQuery = useQuery({
    queryKey: ['my', 'join-requests'],
    queryFn: getMyJoinRequests,
  });

  const mutation = useMutation({
    mutationFn: (msg: string) => createJoinRequest(orgId, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my', 'join-requests'] });
      setShowForm(false);
      setMessage('');
    },
  });

  const pendingRequest = myRequestsQuery.data?.find(
    (r) => r.organization.id === orgId && r.status === 'pending',
  );

  if (pendingRequest) {
    return (
      <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-amber-100 text-amber-800">
        Request pending
      </span>
    );
  }

  if (mutation.isSuccess) {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        Request sent! You will be notified once reviewed.
      </p>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Request to join
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-72">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Why do you want to join this organization? (min. 10 characters)"
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
      />
      <FieldError mutation={mutation} field="message" />
      <FormError mutation={mutation} />
      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate(message)}
          disabled={message.trim().length < 10 || mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Sending...' : 'Send request'}
        </button>
        <button
          onClick={() => { setShowForm(false); setMessage(''); }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Upload buttons ──────────────────────────────────────────────

function CoverUploadButton({ orgId, onDone, hasCover }: { orgId: string; onDone: () => void; hasCover: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'Organization', orgId);
      await updateOrganization(orgId, { cover_url: url });
      onDone();
    } catch {
      // silently ignore
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    await updateOrganization(orgId, { cover_url: null });
    onDone();
  }

  return (
    <>
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover/cover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-black/50 hover:bg-black/70 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
          </svg>
          {uploading ? 'Uploading...' : 'Change cover'}
        </button>
        {hasCover && (
          <button
            type="button"
            onClick={handleRemove}
            className="bg-black/50 hover:bg-red-600 text-white rounded-lg p-1.5 text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </>
  );
}

function AvatarUploadButton({ orgId, onDone, hasImage }: { orgId: string; onDone: () => void; hasImage: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'Organization', orgId);
      await updateOrganization(orgId, { image_url: url });
      onDone();
    } catch {
      // silently ignore
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    await updateOrganization(orgId, { image_url: null });
    onDone();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 hover:bg-black/40 text-white opacity-0 group-hover/avatar:opacity-100 transition-all"
      >
        <svg className="w-5 h-5 drop-shadow" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
        </svg>
      </button>
      {hasImage && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -top-1 -right-1 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-300 text-gray-500 hover:text-red-600 rounded-full p-0.5 opacity-0 group-hover/avatar:opacity-100 transition-all shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </>
  );
}

// ── Connect button + dialog ─────────────────────────────────────

function ConnectDialog({
  targetOrg,
  myOrgs,
  onClose,
}: {
  targetOrg: Organization;
  myOrgs: MeOrganization[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [fromOrgId, setFromOrgId] = useState(myOrgs.length === 1 ? myOrgs[0].organization_id : '');
  const [relationType, setRelationType] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createRelation({
        from_organization_id: fromOrgId,
        to_organization_id: targetOrg.id,
        relation_type: relationType,
        description: description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl border border-border w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900">Connect with {targetOrg.name}</h3>
        </div>

        <div className="p-4 space-y-3">
          {myOrgs.length > 1 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Connect from</label>
              <select
                value={fromOrgId}
                onChange={(e) => setFromOrgId(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select your organization...</option>
                {myOrgs.map((o) => (
                  <option key={o.organization_id} value={o.organization_id}>
                    {o.organization_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Relation type</label>
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {Object.entries(RELATION_TYPES).map(([key, { label, description: desc }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRelationType(key)}
                  className={`w-full text-left px-3 py-2 transition-colors ${
                    relationType === key ? 'bg-primary/8' : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe this relation..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {mutation.error && (
            <p className="text-sm text-red-600">
              {(mutation.error as Error).message || 'Failed to create relation'}
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
            onClick={() => mutation.mutate()}
            disabled={!fromOrgId || !relationType || mutation.isPending}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConnectButton({ org, myOrgs }: { org: Organization; myOrgs: MeOrganization[] }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        showDropdown &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

  const orgRelations = (org.relations ?? []) as Relation[];
  const myOrgIds = myOrgs.map((o) => o.organization_id);

  const existingRelations = orgRelations.filter((r) =>
    (myOrgIds.includes(r.from_organization_id) && r.to_organization_id === org.id) ||
    (myOrgIds.includes(r.to_organization_id) && r.from_organization_id === org.id)
  );

  const isConnected = existingRelations.length > 0;

  const removeMutation = useMutation({
    mutationFn: (relationId: string) => deleteRelation(relationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setShowDropdown(false);
    },
  });

  if (isConnected) {
    return (
      <div className="relative">
        <button
          ref={btnRef}
          onClick={() => setShowDropdown(!showDropdown)}
          className="inline-flex items-center gap-1.5 border border-green-300 bg-green-50 text-green-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Connected
          <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showDropdown && (
          <div ref={dropdownRef} className="absolute right-0 top-full mt-1 w-64 bg-white border border-border rounded-lg shadow-lg z-50">
            {existingRelations.map((rel) => {
              const myOrg = myOrgs.find(
                (o) => o.organization_id === rel.from_organization_id || o.organization_id === rel.to_organization_id
              );
              const typeConfig = RELATION_TYPES[rel.relation_type];
              return (
                <div key={rel.id} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-b-0">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {myOrgs.length > 1 && myOrg ? `${myOrg.organization_name} — ` : ''}
                      {typeConfig?.label ?? rel.relation_type}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Remove this relation?')) {
                        removeMutation.mutate(rel.id);
                      }
                    }}
                    disabled={removeMutation.isPending}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0"
                    title="Remove"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
            <button
              onClick={() => { setShowDropdown(false); setShowDialog(true); }}
              className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-gray-50 font-medium"
            >
              + Add another relation
            </button>
          </div>
        )}
        {showDialog && (
          <ConnectDialog targetOrg={org} myOrgs={myOrgs} onClose={() => setShowDialog(false)} />
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
        Connect
      </button>
      {showDialog && (
        <ConnectDialog targetOrg={org} myOrgs={myOrgs} onClose={() => setShowDialog(false)} />
      )}
    </>
  );
}

// ── Three-dots more menu ────────────────────────────────────────

function MoreMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        open &&
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="border border-gray-300 rounded-lg p-2 text-gray-500 hover:bg-gray-50 transition-colors"
        title="More options"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
      </button>
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 min-w-48 bg-white border border-border rounded-lg shadow-lg z-50 py-1"
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main OrgProfile component ───────────────────────────────────

export function OrgProfile({
  org,
  backLink,
}: {
  org: Organization;
  backLink: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const me = meQuery.data;
  const memberOrg = me?.organizations.find((o) => o.organization_id === org.id);
  const isMember = !!memberOrg;
  const isLoggedIn = !!me;
  const kindConfig = org.kind ? ORG_KINDS[org.kind] || ORG_KINDS.other : null;
  const coverUrl = org.cover_url || (org.kind && COVER_IMAGES[org.kind]) || COVER_IMAGES.default;

  const invalidateOrg = () => {
    queryClient.invalidateQueries({ queryKey: ['organizations'] });
    queryClient.invalidateQueries({ queryKey: ['community_organization'] });
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Back link */}
      <div className="px-6 py-4">{backLink}</div>

      {/* Cover + Header */}
      <div className="relative">
        <div className="h-48 rounded-t-xl overflow-hidden relative group/cover">
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          {isMember && (
            <CoverUploadButton orgId={org.id} onDone={invalidateOrg} hasCover={!!org.cover_url} />
          )}
        </div>

        <div className="relative px-6 -mt-10">
          <div className="relative inline-block group/avatar">
            <OrgAvatar org={org} size="lg" variant="profile" />
            {isMember && (
              <AvatarUploadButton orgId={org.id} onDone={invalidateOrg} hasImage={!!org.image_url} />
            )}
          </div>

          <div className="flex items-start justify-between mt-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {kindConfig && <KindBadge kind={org.kind} />}
                {org.address && (
                  <span className="text-sm text-gray-500">
                    {[org.address, org.country_code].filter(Boolean).join(', ')}
                  </span>
                )}
                {org.number_of_workers && (
                  <span className="text-sm text-gray-500">
                    · {org.number_of_workers} workers
                  </span>
                )}
                {!org.claimed && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Unclaimed
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 mt-1">
              {isLoggedIn && !isMember && me.organizations.length > 0 && (
                <ConnectButton org={org} myOrgs={me.organizations} />
              )}
              {isLoggedIn && !isMember && org.claimed && (
                <Link
                  to="/messages"
                  search={{ to: org.id }}
                  className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Send message
                </Link>
              )}
              {isMember && (
                <Link
                  to="/$orgSlug/profile"
                  params={{ orgSlug: memberOrg!.organization_slug }}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Manage profile
                </Link>
              )}
              {isLoggedIn && !isMember && (
                <MoreMenu>
                  {!org.claimed && (
                    <div className="px-3 py-2">
                      <ClaimButton orgId={org.id} />
                    </div>
                  )}
                  {org.claimed && (
                    <div className="px-3 py-2">
                      <p className="text-xs text-gray-500 mb-2">Are you a member of this organization?</p>
                      <JoinRequestButton orgId={org.id} />
                    </div>
                  )}
                </MoreMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="px-6 mt-8 space-y-8">
        {/* About */}
        {org.description && (
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{org.description}</p>
            <div className="flex flex-wrap gap-4 mt-4">
              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                  Website
                </a>
              )}
              {org.email && (
                <a
                  href={`mailto:${org.email}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  {org.email}
                </a>
              )}
              {org.phone && (
                <a
                  href={`tel:${org.phone}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                  {org.phone}
                </a>
              )}
              {org.linkedin && (
                <a
                  href={org.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              )}
              {org.instagram && (
                <a
                  href={org.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                  Instagram
                </a>
              )}
            </div>
          </section>
        )}

        {/* Photos */}
        {org.organization_photos && org.organization_photos.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {org.organization_photos.map((photo) => (
                <div key={photo.id} className="rounded-lg overflow-hidden aspect-[4/3]">
                  <img
                    src={photo.url}
                    alt={photo.caption || ''}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Listings */}
        <ListingsSection orgId={org.id} listingType="product" />
        <ListingsSection orgId={org.id} listingType="service" />
        <ListingsSection orgId={org.id} listingType="capacity" />
        <ListingsSection orgId={org.id} listingType="material" />

        {/* Communities */}
        {org.communities && org.communities.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Communities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {org.communities.map((community) => (
                <div
                  key={community.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200"
                >
                  {community.image_url ? (
                    <img
                      src={community.image_url}
                      alt={community.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {community.name[0]}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 truncate">{community.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Organizations */}
        {org.related_organizations && org.related_organizations.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Organizations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {org.related_organizations.map((rel) => {
                const relKind = rel.kind ? ORG_KINDS[rel.kind] || ORG_KINDS.other : null;
                return (
                  <Link
                    key={rel.id}
                    to="/organizations/$id"
                    params={{ id: rel.slug || rel.id }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    {rel.image_url ? (
                      <img
                        src={rel.image_url}
                        alt={rel.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                        {(rel.name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{rel.name}</p>
                      {relKind && (
                        <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ${relKind.badgeColor}`}>
                          {relKind.label}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
