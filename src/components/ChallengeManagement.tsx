import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllChallenges,
  createGlobalChallenge,
  updateGlobalChallenge,
  deleteGlobalChallenge,
  getGlobalApplications,
  acceptGlobalApplication,
  rejectGlobalApplication,
  selectGlobalWinner,
} from '../lib/community-challenges';
import type { Challenge, ChallengeApplication } from '../lib/community-challenges';
import { challengeStateBadge, challengeAppStatusBadge } from './ChallengeShared';
import { FieldError, FormError } from './FieldError';
import { useFeatureInfo, FeatureIntro, FeatureInfoTrigger } from './FeatureIntro';

export function ChallengeForm({
  orgId,
  challenge,
  onDone,
  onCancel,
}: {
  orgId: string;
  challenge?: Challenge;
  onDone: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(challenge?.title || '');
  const [description, setDescription] = useState(challenge?.description || '');
  const [numberOfWinners, setNumberOfWinners] = useState(challenge?.number_of_winners?.toString() || '1');
  const [startOn, setStartOn] = useState(challenge?.start_on || '');
  const [endOn, setEndOn] = useState(challenge?.end_on || '');
  const [requiresAttachment, setRequiresAttachment] = useState(challenge?.requires_attachment || false);

  const mutation = useMutation({
    mutationFn: () => {
      const data = {
        title,
        description,
        number_of_winners: numberOfWinners ? parseInt(numberOfWinners, 10) : undefined,
        start_on: startOn || undefined,
        end_on: endOn || undefined,
        requires_attachment: requiresAttachment,
      };
      if (challenge) {
        return updateGlobalChallenge(challenge.id, data);
      }
      return createGlobalChallenge({ ...data, organization_id: orgId, state: 'draft' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges', 'by_organization'] });
      onDone();
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4 border border-border rounded-lg p-5 bg-gray-50/50">
      <h3 className="text-sm font-semibold text-gray-900">{challenge ? 'Edit challenge' : 'New challenge'}</h3>
      <FormError mutation={mutation} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
        <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Challenge title"
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <FieldError mutation={mutation} field="title" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the challenge..."
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        <FieldError mutation={mutation} field="description" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Winners</label>
          <input type="number" min="1" value={numberOfWinners} onChange={(e) => setNumberOfWinners(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
          <input type="date" value={startOn} onChange={(e) => setStartOn(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
          <input type="date" value={endOn} onChange={(e) => setEndOn(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={requiresAttachment} onChange={(e) => setRequiresAttachment(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-ring" />
        <span className="text-sm text-gray-700">Require attachment from applicants</span>
      </label>
      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {mutation.isPending ? 'Saving...' : challenge ? 'Save changes' : 'Create challenge'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
    </form>
  );
}

function ApplicationRow({ app, challengeId }: { app: ChallengeApplication; challengeId: string }) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['challenge_apps', challengeId] });
    queryClient.invalidateQueries({ queryKey: ['challenges', 'by_organization'] });
  };
  const acceptMut = useMutation({ mutationFn: () => acceptGlobalApplication(challengeId, app.id), onSuccess: invalidate });
  const rejectMut = useMutation({ mutationFn: () => rejectGlobalApplication(challengeId, app.id), onSuccess: invalidate });
  const winnerMut = useMutation({ mutationFn: () => selectGlobalWinner(challengeId, app.id), onSuccess: invalidate });
  const busy = acceptMut.isPending || rejectMut.isPending || winnerMut.isPending;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{app.organization?.name || 'Unknown'}</span>
          {challengeAppStatusBadge(app.status)}
        </div>
        {app.note && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{app.note}</p>}
        {app.attachment_url && (
          <a href={app.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-0.5 inline-block">
            View attachment
          </a>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {app.status === 'pending' && (
          <>
            <button onClick={() => acceptMut.mutate()} disabled={busy}
              className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50">Accept</button>
            <button onClick={() => rejectMut.mutate()} disabled={busy}
              className="px-2 py-1 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50">Reject</button>
          </>
        )}
        {app.status === 'accepted' && (
          <button onClick={() => winnerMut.mutate()} disabled={busy}
            className="px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 disabled:opacity-50">Winner</button>
        )}
      </div>
    </div>
  );
}

export function ChallengeCard({
  challenge,
  orgId,
}: {
  challenge: Challenge;
  orgId: string;
}) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  const appsQuery = useQuery({
    queryKey: ['challenge_apps', challenge.id],
    queryFn: () => getGlobalApplications(challenge.id, { per_page: 50 }),
    enabled: expanded,
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteGlobalChallenge(challenge.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges', 'by_organization'] }),
  });

  const activateMut = useMutation({
    mutationFn: () => updateGlobalChallenge(challenge.id, { state: 'active' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges', 'by_organization'] }),
  });

  const apps = appsQuery.data?.data ?? [];

  if (editing) {
    return (
      <ChallengeForm
        orgId={orgId}
        challenge={challenge}
        onDone={() => setEditing(false)}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-start gap-4 p-4 group">
        {challenge.image_url ? (
          <img src={challenge.image_url} alt="" className="w-14 h-14 rounded-md object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
            </svg>
          </div>
        )}
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {challengeStateBadge(challenge.state)}
            {challenge.applications_count > 0 && (
              <span className="text-[10px] text-gray-500">
                {challenge.applications_count} application{challenge.applications_count !== 1 ? 's' : ''}
                {challenge.winners_count > 0 && ` · ${challenge.winners_count} winner${challenge.winners_count !== 1 ? 's' : ''}`}
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-gray-900 truncate">{challenge.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{challenge.description}</p>
        </button>
        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {challenge.state === 'draft' && (
            <button onClick={() => activateMut.mutate()} disabled={activateMut.isPending}
              className="px-2 py-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50">
              Activate
            </button>
          )}
          <button onClick={() => setEditing(true)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
            </svg>
          </button>
          <button onClick={() => { if (confirm('Delete this challenge?')) deleteMut.mutate(); }}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 bg-gray-50/50">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Applications ({apps.length})
          </h4>
          {appsQuery.isLoading ? (
            <p className="text-xs text-gray-400 py-2">Loading...</p>
          ) : apps.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No applications yet.</p>
          ) : (
            <div>
              {apps.map((app) => (
                <ApplicationRow key={app.id} app={app} challengeId={challenge.id} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MyChallengesTab({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const challengesInfo = useFeatureInfo('profile-challenges');

  const challengesQuery = useQuery({
    queryKey: ['challenges', 'by_organization', orgId],
    queryFn: () => getAllChallenges({ by_organization: orgId, per_page: 50 }),
  });

  const challenges = challengesQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <FeatureIntro
        info={challengesInfo}
        title="What are challenges?"
        description="Post a challenge to tell the community what you need: workspace, machinery, raw materials, expertise, services, and more. Challenges are also used for collaborative projects, funding opportunities, and calls for partners. Other organizations can apply, and you manage responses directly from here."
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">
            {challengesQuery.isLoading ? 'Loading...' : `${challenges.length} challenge${challenges.length !== 1 ? 's' : ''}`}
          </p>
          <FeatureInfoTrigger info={challengesInfo} />
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create challenge
          </button>
        )}
      </div>

      {showForm && (
        <ChallengeForm
          orgId={orgId}
          onDone={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['challenges', 'by_organization'] }); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {challenges.length === 0 && !challengesQuery.isLoading && !showForm ? (
        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
          </svg>
          <p className="text-sm text-gray-400 mt-2">No challenges yet.</p>
          <p className="text-xs text-gray-400 mt-1">Create a challenge to find partners and drive innovation.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} orgId={orgId} />
          ))}
        </div>
      )}
    </div>
  );
}
