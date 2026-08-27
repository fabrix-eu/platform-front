import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNetworkOrganization, removeNetworkOrganization } from '../../lib/networks';
import { useFacilitatorNetwork } from '../../lib/useFacilitatorNetwork';
import { ORG_KINDS } from '../../lib/organizations';
import { CrmFieldsForm } from '../../components/facilitator/CrmFieldsForm';
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
    <div className="max-w-4xl mx-auto p-6 pb-12 space-y-6">
      <Link
        to="/facilitator/network"
        search={{ network: network.slug }}
        className="text-sm text-gray-500 hover:text-gray-700 inline-block"
      >
        &larr; My Network
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border border-border p-5 flex items-start gap-4">
        {org.image_url ? (
          <img src={org.image_url} alt={org.name} className="h-14 w-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
            {getInitials(org.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-display font-bold text-gray-900 truncate">{org.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {kind && <span className={`text-[11px] px-2 py-0.5 rounded-full ${kind.badgeColor}`}>{kind.label}</span>}
            {org.address && <span className="text-xs text-gray-400 truncate">{org.address}</span>}
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm">
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
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              Unfollow
            </button>
          </div>
        </div>
      </div>

      {/* CRM tracking fields + notes */}
      <section className="bg-white rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Tracking</h2>
        <CrmFieldsForm networkSlug={network.slug} record={record} />
      </section>

      {/* Facilitator's needs assessment (private checklist) */}
      <NeedsChecklist networkSlug={network.slug} record={record} />

      {/* Contact history */}
      <ContactTimeline networkSlug={network.slug} networkOrgId={record.id} />

      {/* Tasks for this organization */}
      <TasksPanel networkSlug={network.slug} networkOrgId={record.id} />

      {/* The organization's own onboarding needs form — read-only for facilitators */}
      <section className="bg-white rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Needs &amp; Opportunities</h2>
        <p className="text-xs text-gray-400 mb-4">
          Self-assessment from the organization's onboarding — read-only.
        </p>
        <NeedsFormReadOnly orgId={org.id} />
      </section>
    </div>
  );
}
