import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMyApplication } from '../../lib/community-challenges';
import {
  challengeStateBadge,
  challengeAppStatusBadge,
  ChallengeImage,
  ChallengeDateRange,
  formatChallengeDate,
} from '../../components/ChallengeShared';

export function ApplicationDetailPage() {
  const { orgSlug, applicationId } = useParams({ strict: false }) as {
    orgSlug: string;
    applicationId: string;
  };

  const { data: application, isLoading } = useQuery({
    queryKey: ['my_challenge_application', applicationId],
    queryFn: () => getMyApplication(applicationId),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="bg-white border border-border rounded-lg p-6 space-y-3">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-sm text-gray-500">Application not found.</p>
      </div>
    );
  }

  const challenge = application.challenge;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Back link */}
      <Link
        to="/$orgSlug/opportunities"
        params={{ orgSlug }}
        search={{ tab: 'applications' }}
        className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 mb-4"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to applications
      </Link>

      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Application</h1>
        {challengeAppStatusBadge(application.status)}
      </div>

      {/* Application details */}
      <div className="bg-white border border-border rounded-lg p-5 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Details</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            {challengeAppStatusBadge(application.status)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Submitted</span>
            <span className="text-sm text-gray-900">
              {formatChallengeDate(application.submitted_at, 'long')}
            </span>
          </div>
          {application.reviewed_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Reviewed</span>
              <span className="text-sm text-gray-900">
                {formatChallengeDate(application.reviewed_at, 'long')}
              </span>
            </div>
          )}
          {application.won_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Won</span>
              <span className="text-sm text-gray-900">
                {formatChallengeDate(application.won_at, 'long')}
              </span>
            </div>
          )}
        </div>

        {application.note && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Your note</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{application.note}</p>
          </div>
        )}

        {application.attachment_url && (
          <div className="mt-3">
            <a
              href={application.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
              </svg>
              View attachment
            </a>
          </div>
        )}
      </div>

      {/* Challenge card */}
      <div className="bg-white border border-border rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Challenge</h2>
        <div className="flex items-start gap-4">
          <ChallengeImage challenge={challenge} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-gray-900">{challenge.title}</h3>
              {challengeStateBadge(challenge.state)}
            </div>
            <ChallengeDateRange challenge={challenge} />
            {challenge.organization && (
              <p className="text-xs text-gray-400 mt-0.5">by {challenge.organization.name}</p>
            )}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <Link
            to="/challenges/$challengeId"
            params={{ challengeId: challenge.id }}
            className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            View challenge
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
