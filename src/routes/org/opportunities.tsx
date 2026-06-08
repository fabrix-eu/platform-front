import { Link, useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../../lib/organizations';
import {
  getMyApplications,
} from '../../lib/community-challenges';
import type { ChallengeApplicationWithChallenge } from '../../lib/community-challenges';
import {
  challengeStateBadge,
  challengeAppStatusBadge,
  ChallengeImage,
  ChallengeDateRange,
} from '../../components/ChallengeShared';
import { MyChallengesTab } from '../../components/ChallengeManagement';

function ApplicationCard({ application, orgSlug }: { application: ChallengeApplicationWithChallenge; orgSlug: string }) {
  const challenge = application.challenge;

  return (
    <Link
      to="/$orgSlug/challenges/$applicationId"
      params={{ orgSlug, applicationId: application.id }}
      className="block bg-white border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex items-start gap-4">
        <ChallengeImage challenge={challenge} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{challenge.title}</h3>
            {challengeStateBadge(challenge.state)}
          </div>
          <ChallengeDateRange challenge={challenge} />
          {challenge.organization && (
            <p className="text-xs text-gray-400 mt-0.5">by {challenge.organization.name}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {challengeAppStatusBadge(application.status)}
          <p className="text-[10px] text-gray-400 mt-1">
            {new Date(application.submitted_at).toLocaleDateString('en-GB')}
          </p>
        </div>
      </div>
      {application.note && (
        <p className="text-xs text-gray-600 mt-3 pl-[calc(3.5rem+1rem)] line-clamp-2">{application.note}</p>
      )}
    </Link>
  );
}

export function ChallengesPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const navigate = useNavigate();
  const { tab, page } = useSearch({ strict: false }) as {
    tab?: string;
    page?: number;
  };

  const activeTab = tab || 'challenges';

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const orgId = orgQuery.data?.id;

  const applicationsQuery = useQuery({
    queryKey: ['my_challenge_applications', page],
    queryFn: () => getMyApplications({ page: page || 1, per_page: 20 }),
    enabled: activeTab === 'applications',
  });

  const pendingQuery = useQuery({
    queryKey: ['my_challenge_applications_pending_count'],
    queryFn: () => getMyApplications({ status: 'pending', per_page: 1 }),
  });

  const pendingCount = pendingQuery.data?.meta.total_count ?? 0;

  const applications = applicationsQuery.data?.data ?? [];
  const appMeta = applicationsQuery.data?.meta;

  const setTab = (t: string) => {
    navigate({ to: '/$orgSlug/challenges', params: { orgSlug }, search: { tab: t, page: 1 } });
  };

  const setPage = (p: number) => {
    navigate({ to: '/$orgSlug/challenges', params: { orgSlug }, search: { tab: activeTab, page: p } });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Challenges</h1>
      <p className="text-sm text-gray-500 mb-4">
        Post challenges to find partners, and track your applications to others.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        <button
          type="button"
          onClick={() => setTab('challenges')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'challenges'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My challenges
        </button>
        <button
          type="button"
          onClick={() => setTab('applications')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'applications'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          My applications
          {pendingCount > 0 && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* My Challenges tab */}
      {activeTab === 'challenges' && orgId && (
        <MyChallengesTab orgId={orgId} />
      )}
      {activeTab === 'challenges' && !orgId && (
        <p className="text-muted-foreground">Loading...</p>
      )}

      {/* My Applications tab */}
      {activeTab === 'applications' && (
        <>
          {applicationsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-white border border-border rounded-lg p-4 flex gap-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-lg border border-border p-8 text-center space-y-3">
              <div className="flex justify-center text-gray-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-gray-900">No applications yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Browse challenges from other organizations and submit applications to collaborate.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <ApplicationCard key={app.id} application={app} orgSlug={orgSlug} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {appMeta && appMeta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              {appMeta.prev_page && (
                <button
                  type="button"
                  onClick={() => setPage(appMeta.prev_page!)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  &larr; Previous
                </button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {appMeta.current_page} of {appMeta.total_pages}
              </span>
              {appMeta.next_page && (
                <button
                  type="button"
                  onClick={() => setPage(appMeta.next_page!)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Next &rarr;
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
