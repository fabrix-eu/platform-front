import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrganization, ORG_KINDS } from '../../lib/organizations';
import type { Organization } from '../../lib/organizations';
import { getMe } from '../../lib/auth';

const SECTION_LABELS: Record<string, string> = {
  informations: 'Information',
  data: 'Data',
  needs: 'Needs & Opportunities',
  photos: 'Photos',
  services: 'Services',
  materials: 'Materials',
  capacities: 'Capacities',
  products: 'Products',
  challenges: 'Challenges',
};

function ProfileCompletion({ organization, orgSlug }: { organization: Organization; orgSlug: string }) {
  const pc = organization.profile_completion;
  if (!pc) return null;

  const pct = Math.round((pc.completed / pc.total) * 100);
  const isComplete = pc.completed === pc.total;

  const missing = Object.entries(pc.sections)
    .filter(([, done]) => !done)
    .map(([key]) => key);

  return (
    <div className="bg-white rounded-lg border border-border p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            {isComplete ? 'Profile complete!' : 'Complete your profile'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isComplete
              ? 'All sections are filled. Your organization is fully visible to the community.'
              : 'A complete profile helps facilitators and partners find you.'}
          </p>
        </div>
        <div className="shrink-0 relative w-14 h-14">
          <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
            <circle
              cx="18" cy="18" r="15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-gray-100"
            />
            <circle
              cx="18" cy="18" r="15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeLinecap="round"
              className={isComplete ? 'text-green-500' : 'text-primary'}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
            {pct}%
          </span>
        </div>
      </div>

      {/* Section checklist */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
        {Object.entries(pc.sections).map(([key, done]) => (
          <div key={key} className="flex items-center gap-1.5">
            {done ? (
              <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 shrink-0" />
            )}
            <span className={`text-xs truncate ${done ? 'text-gray-400' : 'text-gray-700 font-medium'}`}>
              {SECTION_LABELS[key] || key}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      {missing.length > 0 && (
        <Link
          to="/$orgSlug/profile"
          params={{ orgSlug }}
          search={{ section: missing[0] as 'data' }}
          className="mt-4 inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline"
        >
          Fill in {SECTION_LABELS[missing[0]] || missing[0]}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}

export function OrgDashboardPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };

  const org = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });

  const userOrg = me.data?.organizations.find(
    (o) => o.organization_slug === orgSlug
  );

  if (org.isLoading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (org.error || !org.data) {
    return <div className="p-6 text-red-600">Organization not found</div>;
  }

  const organization = org.data;
  const kind = organization.kind ? ORG_KINDS[organization.kind] : null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {organization.name}
          </h1>
          {kind && (
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${kind.badgeColor}`}>
              {kind.label}
            </span>
          )}
        </div>
        {organization.description && (
          <p className="mt-2 text-gray-600 text-sm">{organization.description}</p>
        )}
        {organization.address && (
          <p className="mt-1 text-xs text-gray-400">{organization.address}</p>
        )}
      </div>

      {/* Profile completion */}
      <ProfileCompletion organization={organization} orgSlug={orgSlug} />

      {/* Stats */}
      {userOrg && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="text-sm text-gray-500 mb-1">Relations</div>
            <div className="text-2xl font-display font-bold">{userOrg.relations_count}</div>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="text-sm text-gray-500 mb-1">Assessments</div>
            <div className="text-2xl font-display font-bold">
              {userOrg.assessments_completed}
              <span className="text-sm font-normal text-gray-400">
                /{userOrg.assessments_total}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="text-sm text-gray-500 mb-1">Communities</div>
            <div className="text-2xl font-display font-bold">{userOrg.communities.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
