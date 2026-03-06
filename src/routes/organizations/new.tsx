import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrganization } from '../../lib/organizations';
import { OrganizationForm } from '../../components/OrganizationForm';

export function OrganizationNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createOrganization(data),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      navigate({ to: '/organizations/$id', params: { id: org.slug || org.id } });
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link to="/organizations" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to list
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">New Organization</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <OrganizationForm
          mutation={mutation}
          submitLabel="Create Organization"
          pendingLabel="Creating..."
        />
      </div>
    </div>
  );
}
