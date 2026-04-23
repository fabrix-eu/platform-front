import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Challenge, ChallengeApplication } from '../lib/community-challenges';
import { FieldError, FormError } from './FieldError';

export function challengeStateBadge(state: string) {
  switch (state) {
    case 'draft':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Draft</span>;
    case 'active':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Active</span>;
    case 'completed':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Completed</span>;
    case 'cancelled':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-600">Cancelled</span>;
    default:
      return null;
  }
}

export function challengeAppStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">Pending</span>;
    case 'accepted':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Accepted</span>;
    case 'rejected':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-600">Rejected</span>;
    case 'winner':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">Winner</span>;
    default:
      return null;
  }
}

export function formatChallengeDate(iso: string | null, style: 'short' | 'long' = 'short'): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (style === 'long') {
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ChallengeImage({ challenge, size = 'md' }: { challenge: Challenge; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-16 h-16',
    lg: 'w-full h-64',
  };
  const iconClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-12 h-12',
  };

  if (challenge.image_url) {
    return (
      <img
        src={challenge.image_url}
        alt={challenge.title}
        className={`${sizeClasses[size]} rounded-lg object-cover shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-primary/10 flex items-center justify-center shrink-0`}>
      <svg className={`${iconClasses[size]} text-primary`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
      </svg>
    </div>
  );
}

export function ChallengeDateRange({ challenge }: { challenge: Challenge }) {
  if (!challenge.start_on && !challenge.end_on) return null;

  return (
    <p className="text-xs text-gray-500 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
      {challenge.start_on && formatChallengeDate(challenge.start_on)}
      {challenge.start_on && challenge.end_on && ' — '}
      {challenge.end_on && formatChallengeDate(challenge.end_on)}
    </p>
  );
}

export function ChallengeMeta({ challenge }: { challenge: Challenge }) {
  return (
    <p className="text-xs text-gray-500">
      {challenge.applications_count} application{challenge.applications_count !== 1 ? 's' : ''}
      {challenge.winners_count > 0 && ` · ${challenge.winners_count} winner${challenge.winners_count !== 1 ? 's' : ''}`}
      {challenge.number_of_winners && ` · ${challenge.number_of_winners} max`}
    </p>
  );
}

export function ChallengeApplyForm({
  challenge,
  onApply,
  invalidateKeys,
}: {
  challenge: Challenge;
  onApply: (data: { note?: string }) => Promise<ChallengeApplication>;
  invalidateKeys: string[][];
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: () => onApply({ note: note || undefined }),
    onSuccess: () => {
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      setNote('');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="bg-white border border-border rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Apply to this challenge</h3>
      <FormError mutation={mutation} />
      <form onSubmit={handleSubmit} className="space-y-3 mt-2">
        <div>
          <label htmlFor="apply-note" className="block text-sm font-medium text-gray-700 mb-1">
            Your application note {!challenge.requires_attachment && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id="apply-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Explain why your organization is a good fit..."
          />
          <FieldError mutation={mutation} field="note" />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}

export function ChallengeApplicationCard({
  application,
  canManage,
  onAccept,
  onReject,
  onSelectWinner,
}: {
  application: ChallengeApplication;
  canManage: boolean;
  onAccept: () => void;
  onReject: () => void;
  onSelectWinner: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const wrap = (fn: () => void) => async () => {
    setBusy(true);
    try { fn(); } finally { setBusy(false); }
  };

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {application.organization?.name || 'Unknown organization'}
            </span>
            {challengeAppStatusBadge(application.status)}
          </div>
          {application.note && (
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{application.note}</p>
          )}
          {application.attachment_url && (
            <a
              href={application.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              View attachment
            </a>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Submitted {new Date(application.submitted_at).toLocaleDateString('en-GB')}
          </p>
        </div>
      </div>

      {canManage && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          {application.status === 'pending' && (
            <>
              <button
                onClick={wrap(onAccept)}
                disabled={busy}
                className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={wrap(onReject)}
                disabled={busy}
                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {application.status === 'accepted' && (
            <button
              onClick={wrap(onSelectWinner)}
              disabled={busy}
              className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50"
            >
              Select as winner
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function MyApplicationStatus({ application }: { application: ChallengeApplication }) {
  return (
    <div className="bg-white border border-border rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Your application</h3>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Status:</span>
        {challengeAppStatusBadge(application.status)}
      </div>
      {application.note && (
        <p className="text-sm text-gray-600 mt-2">{application.note}</p>
      )}
    </div>
  );
}
