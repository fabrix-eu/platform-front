import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  getChallengeDetail,
  deleteChallenge,
  updateChallenge,
  createApplication,
  getChallengeApplications,
  acceptApplication,
  rejectApplication,
  selectWinner,
} from '../../lib/community-challenges';
import {
  challengeStateBadge,
  ChallengeApplyForm,
  ChallengeApplicationCard,
  MyApplicationStatus,
  formatChallengeDate,
} from '../../components/ChallengeShared';

export function ChallengeDetailPage() {
  const { orgSlug, communitySlug, challengeId } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
    challengeId: string;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = me.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  const challengeQuery = useQuery({
    queryKey: ['community_challenges', communitySlug, challengeId],
    queryFn: () => getChallengeDetail(communitySlug, challengeId),
  });

  const challenge = challengeQuery.data;

  const isOwner = !!(challenge?.organization_id && me.data?.organizations.some(
    (o) => o.organization_id === challenge.organization_id,
  ));

  const canManage = isAdmin || isOwner;

  const applicationsQuery = useQuery({
    queryKey: ['challenge_applications', communitySlug, challengeId],
    queryFn: () => getChallengeApplications(communitySlug, challengeId, { per_page: 50 }),
    enabled: canManage,
  });

  const applications = applicationsQuery.data?.data ?? [];

  const myApplication = challenge?.my_application;
  const hasApplied = !!myApplication;

  const myOrgInCommunity = me.data?.organizations.find(
    (o) => o.communities.some((c) => c.community_slug === communitySlug),
  );
  const canApply = challenge?.state === 'active' && !isOwner && !hasApplied && !!myOrgInCommunity;

  const activateMut = useMutation({
    mutationFn: () => updateChallenge(communitySlug, challengeId, { state: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug] });
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug, challengeId] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteChallenge(communitySlug, challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug] });
      navigate({
        to: '/$orgSlug/communities/$communitySlug/challenges',
        params: { orgSlug, communitySlug },
      });
    },
  });

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this challenge? This cannot be undone.')) {
      deleteMut.mutate();
    }
  }

  if (challengeQuery.isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (challengeQuery.error || !challenge) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-red-600">Challenge not found</p>
        <Link
          to="/$orgSlug/communities/$communitySlug/challenges"
          params={{ orgSlug, communitySlug }}
          className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block"
        >
          &larr; Back to challenges
        </Link>
      </div>
    );
  }

  const appInvalidateKeys = [
    ['challenge_applications', communitySlug, challengeId],
    ['community_challenges', communitySlug, challengeId],
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 pb-12">
      {/* Back link */}
      <Link
        to="/$orgSlug/communities/$communitySlug/challenges"
        params={{ orgSlug, communitySlug }}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Challenges
      </Link>

      {/* Challenge image */}
      {challenge.image_url && (
        <div className="rounded-xl overflow-hidden mb-6">
          <img
            src={challenge.image_url}
            alt={challenge.title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Title + state */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-display font-bold text-gray-900">{challenge.title}</h1>
        {challengeStateBadge(challenge.state)}
      </div>

      {/* Dates */}
      {(challenge.start_on || challenge.end_on) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          {challenge.start_on && formatChallengeDate(challenge.start_on, 'long')}
          {challenge.start_on && challenge.end_on && ' — '}
          {challenge.end_on && formatChallengeDate(challenge.end_on, 'long')}
        </div>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
        {challenge.number_of_winners && (
          <span>{challenge.number_of_winners} winner{challenge.number_of_winners !== 1 ? 's' : ''} max</span>
        )}
        <span>{challenge.applications_count} application{challenge.applications_count !== 1 ? 's' : ''}</span>
        {challenge.requires_attachment && (
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Attachment required</span>
        )}
      </div>

      {/* Owner org */}
      {challenge.organization && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span>Posted by</span>
          <span className="font-medium text-gray-900">{challenge.organization.name}</span>
        </div>
      )}

      {/* Description */}
      <div className="mb-8">
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {challenge.description}
        </p>
      </div>

      {/* Draft activation banner */}
      {challenge.state === 'draft' && canManage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 mb-3">
            This challenge is in draft mode and not visible to community members.
          </p>
          <button
            onClick={() => activateMut.mutate()}
            disabled={activateMut.isPending}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {activateMut.isPending ? 'Activating...' : 'Activate challenge'}
          </button>
        </div>
      )}

      {/* My application status */}
      {hasApplied && myApplication && (
        <div className="mb-6">
          <MyApplicationStatus application={myApplication} />
        </div>
      )}

      {/* Apply form */}
      {canApply && (
        <div className="mb-6">
          <ChallengeApplyForm
            challenge={challenge}
            onApply={(data) => createApplication(communitySlug, challenge.id, data)}
            invalidateKeys={appInvalidateKeys}
          />
        </div>
      )}

      {/* Applications list (for owner/admin) */}
      {canManage && (
        <div className="bg-white border border-border rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Applications ({applications.length})
          </h3>
          {applicationsQuery.isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <p className="text-sm text-gray-500">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <ChallengeApplicationCard
                  key={app.id}
                  application={app}
                  canManage={canManage}
                  onAccept={() => acceptApplication(communitySlug, challengeId, app.id).then(() => {
                    queryClient.invalidateQueries({ queryKey: appInvalidateKeys[0] });
                    queryClient.invalidateQueries({ queryKey: appInvalidateKeys[1] });
                  })}
                  onReject={() => rejectApplication(communitySlug, challengeId, app.id).then(() => {
                    queryClient.invalidateQueries({ queryKey: appInvalidateKeys[0] });
                  })}
                  onSelectWinner={() => selectWinner(communitySlug, challengeId, app.id).then(() => {
                    queryClient.invalidateQueries({ queryKey: appInvalidateKeys[0] });
                    queryClient.invalidateQueries({ queryKey: appInvalidateKeys[1] });
                  })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage actions */}
      {canManage && (
        <div className="bg-white border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Manage challenge</h3>
          <div className="flex items-center gap-3">
            <Link
              to="/$orgSlug/communities/$communitySlug/challenges/$challengeId/edit"
              params={{ orgSlug, communitySlug, challengeId }}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit challenge
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleteMut.isPending ? 'Deleting...' : 'Delete challenge'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
