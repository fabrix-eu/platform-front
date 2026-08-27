import { useState } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { getNetworkOrganization, removeNetworkOrganization } from '../../lib/networks';
import { useFacilitatorNetwork } from '../../lib/useFacilitatorNetwork';
import { ORG_KINDS } from '../../lib/organizations';
import { HealthSelect, BusinessDataCard } from '../../components/facilitator/CrmFieldsForm';
import { NotesCard } from '../../components/facilitator/NotesCard';
import { ContactTimeline } from '../../components/facilitator/ContactTimeline';
import { TasksPanel } from '../../components/facilitator/TasksPanel';
import { NeedsChecklist } from '../../components/facilitator/NeedsChecklist';
import { NeedsFormReadOnly } from '../../components/facilitator/NeedsFormReadOnly';
import { getInitials } from '../../lib/utils';

export function FacilitatorOrgDetailPage() {
  const { norgId } = useParams({ strict: false }) as { norgId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { network, isLoading: networkLoading } = useFacilitatorNetwork();
  const [showSelfAssessment, setShowSelfAssessment] = useState(false);

  const recordQuery = useQuery({
    queryKey: ['network_organization', network?.slug, norgId],
    queryFn: () => getNetworkOrganization(network!.slug, norgId),
    enabled: !!network,
  });

  const unfollow = useMutation({
    mutationFn: () => removeNetworkOrganization(network!.slug, norgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network_organizations', network!.slug] });
      navigate({ to: '/facilitator/network', search: { network: network!.slug } });
    },
  });

  if (networkLoading || recordQuery.isLoading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  const record = recordQuery.data;
  if (!network || !record) {
    return (
      <div className="p-6">
        <p className="text-red-600">Organization not found in this network</p>
        <Link to="/facilitator/network" className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block">
          &larr; Back to my network
        </Link>
      </div>
    );
  }

  const org = record.organization;
  const kind = org.kind ? ORG_KINDS[org.kind] : null;

  return (
    <div className="max-w-5xl mx-auto p-6 pb-12 space-y-4">
      <Link
        to="/facilitator/network"
        search={{ network: network.slug }}
        className="text-sm text-gray-500 hover:text-gray-700 inline-block"
      >
        &larr; My Network
      </Link>

      {/* Header: identity + health, editable in place */}
      <div className="bg-white rounded-lg border border-border p-4 flex items-center gap-4 flex-wrap">
        {org.image_url ? (
          <img src={org.image_url} alt={org.name} className="h-11 w-11 rounded-full object-cover shrink-0" />
        ) : (
          <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            {getInitials(org.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-display font-bold text-gray-900 truncate">{org.name}</h1>
            {kind && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${kind.badgeColor}`}>{kind.label}</span>}
          </div>
          {org.address && <p className="text-xs text-gray-400 truncate">{org.address}</p>}
          <div className="flex items-center gap-4 mt-1.5">
            <HealthSelect networkSlug={network.slug} record={record} field="economic_health" label="Economic" />
            <HealthSelect networkSlug={network.slug} record={record} field="environmental_score" label="Environmental" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm shrink-0">
          <Link
            to="/organizations/$id"
            params={{ id: org.slug || org.id }}
            className="text-primary hover:underline"
          >
            Public profile →
          </Link>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Stop following this organization? CRM data (notes, contacts) will be deleted.')) {
                unfollow.mutate();
              }
            }}
            className="text-xs text-gray-400 hover:text-red-600 transition-colors"
          >
            Unfollow
          </button>
        </div>
      </div>

      {/* Notes first — the facilitator's working memory */}
      <NotesCard networkSlug={network.slug} record={record} />

      {/* At-a-glance grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          <NeedsChecklist networkSlug={network.slug} record={record} />
          <BusinessDataCard networkSlug={network.slug} record={record} />
        </div>
        <div className="space-y-4">
          <TasksPanel networkSlug={network.slug} networkOrgId={record.id} />
          <ContactTimeline networkSlug={network.slug} networkOrgId={record.id} />
        </div>
      </div>

      {/* The organization's own onboarding self-assessment — read-only, collapsed */}
      <section className="bg-white rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setShowSelfAssessment(!showSelfAssessment)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
              Self-assessment
            </span>
            <span className="text-xs text-gray-400">
              The organization's own Needs &amp; Opportunities form — read-only
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${showSelfAssessment ? 'rotate-180' : ''}`}
          />
        </button>
        {showSelfAssessment && (
          <div className="px-4 pb-4">
            <NeedsFormReadOnly orgId={org.id} />
          </div>
        )}
      </section>
    </div>
  );
}
