import { Link, useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import {
  getMyApplications,
  getAllChallenges,
} from '../../lib/community-challenges';
import type { Challenge, ChallengeApplicationWithChallenge } from '../../lib/community-challenges';
import {
  challengeStateBadge,
  challengeAppStatusBadge,
  ChallengeImage,
  ChallengeDateRange,
  ChallengeMeta,
} from '../../components/ChallengeShared';
import { useFeatureInfo, FeatureIntro, FeatureInfoTrigger } from '../../components/FeatureIntro';

function ApplicationCard({ application, orgSlug }: { application: ChallengeApplicationWithChallenge; orgSlug: string }) {
  const challenge = application.challenge;

  return (
    <Link
      to="/$orgSlug/opportunities/$applicationId"
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

function OpportunityChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <Link
      to="/challenges/$challengeId"
      params={{ challengeId: challenge.id }}
      className="flex items-start gap-4 bg-white border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all"
    >
      <ChallengeImage challenge={challenge} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{challenge.title}</h3>
          {challengeStateBadge(challenge.state)}
        </div>
        <ChallengeDateRange challenge={challenge} />
        <ChallengeMeta challenge={challenge} />
        {challenge.organization && (
          <p className="text-[10px] text-gray-400 mt-1">by {challenge.organization.name}</p>
        )}
      </div>
    </Link>
  );
}

export function OpportunitiesPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const navigate = useNavigate();
  const { tab, page } = useSearch({ strict: false }) as {
    tab?: string;
    page?: number;
  };

  const activeTab = tab || 'applications';
  const featureInfo = useFeatureInfo('opportunities');

  const applicationsQuery = useQuery({
    queryKey: ['my_challenge_applications', page],
    queryFn: () => getMyApplications({ page: page || 1, per_page: 20 }),
    enabled: activeTab === 'applications',
  });

  const challengesQuery = useQuery({
    queryKey: ['global_challenges_opportunities', page],
    queryFn: () => getAllChallenges({ page: page || 1, per_page: 20 }),
    enabled: activeTab === 'challenges',
  });

  const pendingQuery = useQuery({
    queryKey: ['my_challenge_applications_pending_count'],
    queryFn: () => getMyApplications({ status: 'pending', per_page: 1 }),
  });

  const pendingCount = pendingQuery.data?.meta.total_count ?? 0;

  const applications = applicationsQuery.data?.data ?? [];
  const appMeta = applicationsQuery.data?.meta;

  const challenges = challengesQuery.data?.data ?? [];
  const challengesMeta = challengesQuery.data?.meta;

  const setTab = (t: string) => {
    navigate({ to: '/$orgSlug/opportunities', params: { orgSlug }, search: { tab: t, page: 1 } });
  };

  const setPage = (p: number) => {
    navigate({ to: '/$orgSlug/opportunities', params: { orgSlug }, search: { tab: activeTab, page: p } });
  };

  const meta = activeTab === 'applications' ? appMeta : challengesMeta;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold">Opportunities</h1>
        <FeatureInfoTrigger info={featureInfo} />
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Browse challenges from other organizations and track your applications.
      </p>

      <div className="mb-6">
        <FeatureIntro
          info={featureInfo}
          title="What are opportunities?"
          description="Opportunities are your responses to challenges posted by other organizations. Track your current and past applications here, and discover challenges that match your materials, services, capacities, and products."
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
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
        <button
          type="button"
          onClick={() => setTab('challenges')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'challenges'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All challenges
        </button>
      </div>

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
                Browse the challenges tab to find opportunities and submit your first application.
              </p>
              <button
                type="button"
                onClick={() => setTab('challenges')}
                className="text-sm text-primary font-medium hover:underline"
              >
                Browse challenges
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <ApplicationCard key={app.id} application={app} orgSlug={orgSlug} />
              ))}
            </div>
          )}
        </>
      )}

      {/* All Challenges tab */}
      {activeTab === 'challenges' && (
        <>
          {challengesQuery.isLoading ? (
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
          ) : challenges.length === 0 ? (
            <div className="bg-white rounded-lg border border-border p-8 text-center space-y-3">
              <div className="flex justify-center text-gray-400">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-gray-900">No challenges yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                There are no active challenges on the platform yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {challenges.map((challenge) => (
                <OpportunityChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          {meta.prev_page && (
            <button
              type="button"
              onClick={() => setPage(meta.prev_page!)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Previous
            </button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.total_pages}
          </span>
          {meta.next_page && (
            <button
              type="button"
              onClick={() => setPage(meta.next_page!)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Next &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
