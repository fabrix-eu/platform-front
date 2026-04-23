import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  getCommunityOrganization,
  updateCommunityOrganization,
  removeCommunityOrganization,
} from '../../lib/community-organizations';
import type { CommunityOrganization } from '../../lib/community-organizations';
import { getOrganization } from '../../lib/organizations';
import { getFormsWithAnswers } from '../../lib/forms';
import { useFacilitatorPanel } from '../../components/FacilitatorPanel';
import { OrgProfile } from '../../components/OrgProfile';

// ── Facilitator data sections ────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  );
}

function OrgDataSection({ orgId }: { orgId: string }) {
  const query = useQuery({
    queryKey: ['organizations', orgId],
    queryFn: () => getOrganization(orgId),
  });

  if (query.isLoading) {
    return (
      <div className="bg-white/80 rounded-lg p-3">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  const org = query.data;
  if (!org) return null;

  const hasData = org.number_of_workers != null || org.turnover != null || org.nace_code ||
    (org.facility_types && org.facility_types.length > 0) ||
    (org.processing_types && org.processing_types.length > 0) ||
    (org.product_types && org.product_types.length > 0) ||
    org.development_stage || org.sector;

  return (
    <div className="bg-white/80 rounded-lg p-3 space-y-3">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organization data</h4>
      {!hasData ? (
        <p className="text-xs text-gray-400 italic">No data filled yet</p>
      ) : (
        <>
          <InfoRow label="Workers" value={org.number_of_workers} />
          <InfoRow label="Turnover" value={org.turnover != null ? `€${org.turnover.toLocaleString()}` : null} />
          <InfoRow label="NACE code" value={org.nace_code} />
          <InfoRow label="Sector" value={org.sector} />
          <InfoRow label="Stage" value={org.development_stage} />
          {org.facility_types && org.facility_types.length > 0 && (
            <div>
              <p className="text-xs text-gray-400">Facility types</p>
              <p className="text-sm text-gray-700">{org.facility_types.join(', ')}</p>
            </div>
          )}
          {org.processing_types && org.processing_types.length > 0 && (
            <div>
              <p className="text-xs text-gray-400">Processing types</p>
              <p className="text-sm text-gray-700">{org.processing_types.join(', ')}</p>
            </div>
          )}
          {org.product_types && org.product_types.length > 0 && (
            <div>
              <p className="text-xs text-gray-400">Product types</p>
              <p className="text-sm text-gray-700">{org.product_types.join(', ')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'text-emerald-700 bg-emerald-50' },
  in_progress: { label: 'In progress', className: 'text-amber-700 bg-amber-50' },
  draft: { label: 'Draft', className: 'text-gray-500 bg-gray-50' },
};

function AssessmentsSection({ orgId }: { orgId: string }) {
  const query = useQuery({
    queryKey: ['assessments', orgId],
    queryFn: () => getFormsWithAnswers(orgId),
  });

  if (query.isLoading) {
    return (
      <div className="bg-white/80 rounded-lg p-3">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  const forms = query.data ?? [];
  if (forms.length === 0) return null;

  return (
    <div className="bg-white/80 rounded-lg p-3 space-y-3">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assessments</h4>
      <div className="space-y-2">
        {forms.map((form) => {
          const latest = [...form.answers]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          const style = latest ? STATUS_STYLES[latest.status] || STATUS_STYLES.draft : null;

          return (
            <div key={form.id} className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-700 truncate">{form.title}</span>
              {latest ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  {latest.status === 'completed' && (
                    <span className="text-xs font-medium text-emerald-700">
                      {Math.round(latest.normalized_score)}%
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style!.className}`}>
                    {style!.label}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] text-gray-400 italic shrink-0">Not started</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Facilitator sidebar (community-specific) ────────────────────

function FacilitatorSidebar({
  membership,
  communitySlug,
}: {
  membership: CommunityOrganization;
  communitySlug: string;
}) {
  const qc = useQueryClient();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(membership.notes || '');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateCommunityOrganization>[2]) =>
      updateCommunityOrganization(communitySlug, membership.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community_organization', communitySlug, membership.id] });
      setEditingNotes(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeCommunityOrganization(communitySlug, membership.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community_organizations', communitySlug] });
      window.history.back();
    },
  });

  return (
    <div className="space-y-3">
      {/* Notes */}
      <div className="bg-white/80 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</label>
          {!editingNotes && (
            <button
              onClick={() => { setNotes(membership.notes || ''); setEditingNotes(true); }}
              className="text-xs text-primary hover:text-primary/80"
            >
              Edit
            </button>
          )}
        </div>
        {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Private notes about this member..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateMutation.mutate({ notes: notes || null })}
                  disabled={updateMutation.isPending}
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingNotes(false)}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </div>
        ) : (
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {membership.notes || <span className="text-gray-400 italic">No notes yet</span>}
          </p>
        )}
      </div>

      {/* Member info */}
      <div className="bg-white/80 rounded-lg p-3 space-y-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member info</h4>

        {membership.added_by && (
          <div>
            <p className="text-xs text-gray-400">Added by</p>
            <p className="text-sm text-gray-700">{membership.added_by.name}</p>
          </div>
        )}

        {membership.added_at && (
          <div>
            <p className="text-xs text-gray-400">Member since</p>
            <p className="text-sm text-gray-700">
              {new Date(membership.added_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}

        {membership.specialization && (
          <div>
            <p className="text-xs text-gray-400">Specialization</p>
            <p className="text-sm text-gray-700">{membership.specialization}</p>
          </div>
        )}

        {membership.number_of_employees != null && (
          <div>
            <p className="text-xs text-gray-400">Employees</p>
            <p className="text-sm text-gray-700">{membership.number_of_employees}</p>
          </div>
        )}

        {membership.economic_health && (
          <div>
            <p className="text-xs text-gray-400">Economic health</p>
            <p className="text-sm text-gray-700">{membership.economic_health}</p>
          </div>
        )}

        {membership.environmental_score && (
          <div>
            <p className="text-xs text-gray-400">Environmental score</p>
            <p className="text-sm text-gray-700">{membership.environmental_score}</p>
          </div>
        )}

        {membership.annual_turnover && (
          <div>
            <p className="text-xs text-gray-400">Annual turnover</p>
            <p className="text-sm text-gray-700">{membership.annual_turnover}</p>
          </div>
        )}

        {membership.growth_rate && (
          <div>
            <p className="text-xs text-gray-400">Growth rate</p>
            <p className="text-sm text-gray-700">{membership.growth_rate}</p>
          </div>
        )}
      </div>

      {/* Org data */}
      <OrgDataSection orgId={membership.organization_id} />

      {/* Assessments */}
      <AssessmentsSection orgId={membership.organization_id} />

      {/* Remove member */}
      <div className="bg-white/80 border border-red-200/50 rounded-lg p-3">
        {!confirmRemove ? (
          <button
            onClick={() => setConfirmRemove(true)}
            className="w-full text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Remove from community
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-600">
              Remove <strong>{membership.organization.name}</strong> from this community?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending}
                className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {removeMutation.isPending ? 'Removing...' : 'Confirm remove'}
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────

export function CommunityMemberDetailPage() {
  const { orgSlug, communitySlug, memberId } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
    memberId: string;
  };

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = meQuery.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  const query = useQuery({
    queryKey: ['community_organization', communitySlug, memberId],
    queryFn: () => getCommunityOrganization(communitySlug, memberId),
  });

  const membership = query.data ?? null;
  useFacilitatorPanel(
    isAdmin && membership ? (
      <FacilitatorSidebar membership={membership} communitySlug={communitySlug} />
    ) : null,
  );

  if (query.isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-600">Member not found</p>
        <Link
          to="/$orgSlug/communities/$communitySlug/members"
          params={{ orgSlug, communitySlug }}
          className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block"
        >
          &larr; Back to members
        </Link>
      </div>
    );
  }

  const org = membership!.organization;

  const backLink = (
    <Link
      to="/$orgSlug/communities/$communitySlug/members"
      params={{ orgSlug, communitySlug }}
      className="text-sm text-gray-500 hover:text-gray-700"
    >
      &larr; Back to members
    </Link>
  );

  return <OrgProfile org={org} backLink={backLink} />;
}
