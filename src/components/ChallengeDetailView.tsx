import { Link } from '@tanstack/react-router';
import type { Challenge, ChallengeApplication } from '../lib/community-challenges';
import {
  challengeStateBadge,
  ChallengeApplyForm,
  ChallengeApplicationCard,
  MyApplicationStatus,
  formatChallengeDate,
} from './ChallengeShared';

interface ChallengeDetailViewProps {
  challenge: Challenge;
  canManage: boolean;
  canApply: boolean;
  myApplication?: ChallengeApplication;
  justApplied: boolean;
  applications: ChallengeApplication[];
  applicationsLoading: boolean;
  onApply: (data: { note?: string }) => Promise<ChallengeApplication>;
  applyInvalidateKeys: string[][];
  onApplySuccess: () => void;
  onWithdraw: () => void;
  onActivate: () => void;
  isActivating: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  onAcceptApplication: (appId: string) => Promise<void>;
  onRejectApplication: (appId: string) => Promise<void>;
  onSelectWinner: (appId: string) => Promise<void>;
  backLink: React.ReactNode;
  editLink?: React.ReactNode;
  draftVisibilityText?: string;
  showNoOrgNotice?: boolean;
}

export function ChallengeDetailView({
  challenge,
  canManage,
  canApply,
  myApplication,
  justApplied,
  applications,
  applicationsLoading,
  onApply,
  applyInvalidateKeys,
  onApplySuccess,
  onWithdraw,
  onActivate,
  isActivating,
  onDelete,
  isDeleting,
  onAcceptApplication,
  onRejectApplication,
  onSelectWinner,
  backLink,
  editLink,
  draftVisibilityText = 'not visible to others',
  showNoOrgNotice,
}: ChallengeDetailViewProps) {
  const hasApplied = !!myApplication;
  const creatorName = challenge.organization?.name || challenge.created_by_user?.name;

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this challenge? This cannot be undone.')) {
      onDelete();
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 pb-12">
      {backLink}

      {/* Hero image or gradient banner */}
      {challenge.image_url ? (
        <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
          <img src={challenge.image_url} alt={challenge.title} className="w-full h-56 object-cover" />
        </div>
      ) : (
        <div className="rounded-2xl mb-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 flex items-center justify-center">
          <svg className="w-16 h-16 text-primary/30" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
          </svg>
        </div>
      )}

      {/* Title + state */}
      <div className="flex items-start gap-3 mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900 leading-tight">{challenge.title}</h1>
        <div className="shrink-0 mt-1">{challengeStateBadge(challenge.state)}</div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {(challenge.organization || challenge.created_by_user) && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Posted by</p>
            {challenge.organization ? (
              <Link
                to="/organizations/$id"
                params={{ id: challenge.organization.slug }}
                className="text-sm font-semibold text-gray-900 hover:text-primary transition-colors"
              >
                {challenge.organization.name}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-gray-900">{challenge.created_by_user?.name}</p>
            )}
          </div>
        )}

        {(challenge.start_on || challenge.end_on) && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Duration</p>
            <p className="text-sm font-semibold text-gray-900">
              {challenge.start_on && formatChallengeDate(challenge.start_on)}
              {challenge.start_on && challenge.end_on && ' — '}
              {challenge.end_on && formatChallengeDate(challenge.end_on)}
            </p>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Applications</p>
          <p className="text-sm font-semibold text-gray-900">
            {challenge.applications_count}
            {challenge.number_of_winners && (
              <span className="text-gray-500 font-normal"> / {challenge.number_of_winners} winner{challenge.number_of_winners !== 1 ? 's' : ''} max</span>
            )}
          </p>
        </div>

        {challenge.community && (
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Community</p>
            <p className="text-sm font-semibold text-gray-900">{challenge.community.name}</p>
          </div>
        )}

        {challenge.requires_attachment && (
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-[10px] font-medium text-amber-500 uppercase tracking-wider mb-1">Requirement</p>
            <p className="text-sm font-semibold text-amber-700">Attachment required</p>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">About this challenge</h2>
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{challenge.description}</p>
      </div>

      {/* Draft activation banner */}
      {challenge.state === 'draft' && canManage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800 mb-3">
            This challenge is in draft mode and {draftVisibilityText}.
          </p>
          <button
            onClick={onActivate}
            disabled={isActivating}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isActivating ? 'Activating...' : 'Activate challenge'}
          </button>
        </div>
      )}

      {/* My application status */}
      {hasApplied && myApplication && (
        <div className="mb-6">
          <MyApplicationStatus
            application={myApplication}
            justApplied={justApplied}
            creatorName={creatorName}
            creatorOrgId={challenge.organization_id ?? undefined}
            onWithdraw={onWithdraw}
          />
        </div>
      )}

      {/* Apply form */}
      {canApply && (
        <div className="mb-6">
          <ChallengeApplyForm
            challenge={challenge}
            onApply={onApply}
            invalidateKeys={applyInvalidateKeys}
            onSuccess={onApplySuccess}
          />
        </div>
      )}

      {/* Applications list (for owner/admin) */}
      {canManage && (
        <div className="bg-white border border-border rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Applications ({applications.length})
          </h3>
          {applicationsLoading ? (
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
                  onAccept={() => onAcceptApplication(app.id)}
                  onReject={() => onRejectApplication(app.id)}
                  onSelectWinner={() => onSelectWinner(app.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage actions */}
      {canManage && (
        <div className="bg-white border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Manage challenge</h3>
          <div className="flex items-center gap-3">
            {editLink}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete challenge'}
            </button>
          </div>
        </div>
      )}

      {/* No-org notice */}
      {showNoOrgNotice && (
        <div className="bg-gray-50 border border-border rounded-xl p-5 text-center">
          <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
          <p className="text-sm text-gray-600">
            You need to belong to an organization to apply to this challenge.
          </p>
        </div>
      )}
    </div>
  );
}

export function ChallengeDetailSkeleton({ backLink }: { backLink: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      {backLink}
      <div className="animate-pulse space-y-4 mt-4">
        <div className="h-56 bg-gray-200 rounded-2xl" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

export function ChallengeDetailError({ backLink }: { backLink: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <p className="text-red-600">Challenge not found</p>
      <div className="mt-2">{backLink}</div>
    </div>
  );
}
