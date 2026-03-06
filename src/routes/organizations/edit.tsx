import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganization, updateOrganization } from '../../lib/organizations';
import { OrganizationForm } from '../../components/OrganizationForm';

export function OrganizationEditPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['organizations', id],
    queryFn: () => getOrganization(id),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      navigate({ to: '/organizations/$id', params: { id } });
    },
  });

  if (query.isLoading) return <div className="p-6 text-gray-500">Loading...</div>;
  if (query.error) return <div className="p-6 text-red-600">Organization not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link to="/organizations/$id" params={{ id }} className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to {query.data!.name}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">Edit Organization</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <OrganizationForm
          mutation={mutation}
          defaultValues={query.data!}
          submitLabel="Update Organization"
          pendingLabel="Updating..."
        />
      </div>
    </div>
  );
}
