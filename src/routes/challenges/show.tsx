import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  getGlobalChallengeDetail,
  createGlobalApplication,
} from '../../lib/community-challenges';
import {
  challengeStateBadge,
  ChallengeApplyForm,
  MyApplicationStatus,
  formatChallengeDate,
} from '../../components/ChallengeShared';

export function ChallengeShowPage() {
  const { challengeId } = useParams({ strict: false }) as { challengeId: string };
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });

  const challengeQuery = useQuery({
    queryKey: ['global_challenge_detail', challengeId],
    queryFn: () => getGlobalChallengeDetail(challengeId),
  });

  const challenge = challengeQuery.data;

  const isOwner = !!(challenge?.organization_id && me.data?.organizations.some(
    (o) => o.organization_id === challenge.organization_id,
  ));

  const myApplication = challenge?.my_application;
  const hasApplied = !!myApplication;
  const hasOrg = (me.data?.organizations.length ?? 0) > 0;
  const canApply = challenge?.state === 'active' && !isOwner && !hasApplied && hasOrg;

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
        <Link to="/challenges" className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block">
          &larr; Back to challenges
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 pb-12">
      {/* Back link */}
      <Link to="/challenges" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
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
          <Link
            to="/organizations/$id"
            params={{ id: challenge.organization.slug }}
            className="font-medium text-gray-900 hover:text-primary"
          >
            {challenge.organization.name}
          </Link>
        </div>
      )}

      {/* Community */}
      {challenge.community && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span>Community</span>
          <span className="font-medium text-gray-900">{challenge.community.name}</span>
        </div>
      )}

      {/* Description */}
      <div className="mb-8">
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {challenge.description}
        </p>
      </div>

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
            onApply={(data) => createGlobalApplication(challenge.id, data)}
            invalidateKeys={[
              ['global_challenge_detail', challengeId],
              ['global_challenges'],
            ]}
          />
        </div>
      )}

      {/* Not logged in with an org */}
      {challenge.state === 'active' && !hasOrg && !isOwner && (
        <div className="bg-gray-50 border border-border rounded-lg p-4">
          <p className="text-sm text-gray-600">
            You need to belong to an organization to apply to this challenge.
          </p>
        </div>
      )}
    </div>
  );
}
