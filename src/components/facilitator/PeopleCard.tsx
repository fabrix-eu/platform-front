import { useQuery } from '@tanstack/react-query';
import { getNetworkOrgPeople } from '../../lib/networks';
import { getInitials } from '../../lib/utils';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

/** The contacts at the followed organization — its people on the platform. */
export function PeopleCard({ networkSlug, networkOrgId }: { networkSlug: string; networkOrgId: string }) {
  const query = useQuery({
    queryKey: ['network_org_people', networkSlug, networkOrgId],
    queryFn: () => getNetworkOrgPeople(networkSlug, networkOrgId),
  });

  const people = query.data ?? [];

  return (
    <section className="bg-white rounded-lg border border-border p-4">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
        People
        {people.length > 0 && <span className="ml-1.5 text-primary">{people.length}</span>}
      </h2>

      {query.isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : people.length === 0 ? (
        <p className="text-sm text-gray-400">Nobody from this organization is on the platform yet.</p>
      ) : (
        <ul className="space-y-2">
          {people.map((person) => (
            <li key={person.id} className="flex items-center gap-2.5">
              {person.user.image_url ? (
                <img src={person.user.image_url} alt={person.user.name} className="h-7 w-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                  {getInitials(person.user.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 truncate">{person.user.name}</p>
                <a href={`mailto:${person.user.email}`} className="text-xs text-gray-400 truncate block hover:text-primary">
                  {person.user.email}
                </a>
              </div>
              {person.role === 'owner' && (
                <span className="shrink-0 text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {ROLE_LABELS[person.role]}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
