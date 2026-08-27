import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useFacilitatorNetwork } from '../../lib/useFacilitatorNetwork';
import { getNetworkTasks, getNetworkOrganizations } from '../../lib/networks';
import { TasksPanel } from '../../components/facilitator/TasksPanel';
import { TeamPanel } from '../../components/facilitator/TeamPanel';
import { CreateNetworkForm } from '../../components/facilitator/CreateNetworkForm';

function Kpi({ label, value, tone = 'default' }: { label: string; value: number | string; tone?: 'default' | 'alert' }) {
  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-display font-bold ${tone === 'alert' ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </div>
    </div>
  );
}

export function FacilitatorDashboardPage() {
  const navigate = useNavigate();
  const { network, networks, isLoading } = useFacilitatorNetwork();

  const openTasksQuery = useQuery({
    queryKey: ['network_tasks', network?.slug, 'open', undefined],
    queryFn: () => getNetworkTasks(network!.slug, { open: true }),
    enabled: !!network,
  });

  const orgsCountQuery = useQuery({
    queryKey: ['network_organizations', network?.slug, 'count'],
    queryFn: () => getNetworkOrganizations(network!.slug, { per_page: 1 }),
    enabled: !!network,
  });

  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (!network) {
    return <CreateNetworkForm />;
  }

  const openTasks = openTasksQuery.data?.data ?? [];
  const today = new Date(new Date().toDateString());
  const overdue = openTasks.filter((t) => t.due_on && new Date(t.due_on) < today).length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">{network.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Facilitator dashboard</p>
        </div>
        {networks.length > 1 && (
          <select
            value={network.slug}
            onChange={(e) => navigate({ to: '/facilitator', search: { network: e.target.value } })}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {networks.map((n) => (
              <option key={n.id} value={n.slug}>{n.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/facilitator/network" search={{ network: network.slug }} className="block">
          <Kpi label="Organizations followed" value={orgsCountQuery.data?.meta.total_count ?? '—'} />
        </Link>
        <Kpi label="Open tasks" value={openTasksQuery.data?.meta.total_count ?? '—'} />
        <Kpi label="Overdue" value={overdue} tone={overdue > 0 ? 'alert' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TasksPanel networkSlug={network.slug} />
        </div>
        <TeamPanel networkSlug={network.slug} />
      </div>
    </div>
  );
}
