import { Link, useParams, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../../lib/organizations';
import { getMe } from '../../lib/auth';
import { OrgProfile } from '../../components/OrgProfile';

export function OrganizationShowPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { from } = useSearch({ strict: false }) as { from?: string };

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });

  const query = useQuery({
    queryKey: ['organizations', id],
    queryFn: () => getOrganization(id),
  });

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
        <p className="text-red-600">Organization not found</p>
        <Link to="/organizations" className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block">
          &larr; Back to list
        </Link>
      </div>
    );
  }

  const org = query.data!;
  const me = meQuery.data;
  const memberOrg = me?.organizations.find((o) => o.organization_id === org.id);

  const backLink = from === 'profile' && memberOrg ? (
    <Link
      to="/$orgSlug/profile"
      params={{ orgSlug: memberOrg.organization_slug }}
      className="text-sm text-gray-500 hover:text-gray-700"
    >
      &larr; Back to profile
    </Link>
  ) : (
    <Link to="/organizations" className="text-sm text-gray-500 hover:text-gray-700">
      &larr; Back to list
    </Link>
  );

  return <OrgProfile org={org} backLink={backLink} />;
}
