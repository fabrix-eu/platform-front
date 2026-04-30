import { useState } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  getGlobalChallengeDetail,
  createGlobalApplication,
  withdrawGlobalApplication,
  getGlobalApplications,
  acceptGlobalApplication,
  rejectGlobalApplication,
  selectGlobalWinner,
  deleteGlobalChallenge,
  updateGlobalChallenge,
} from '../../lib/community-challenges';
import { ChallengeDetailView, ChallengeDetailSkeleton, ChallengeDetailError } from '../../components/ChallengeDetailView';

export function ChallengeShowPage() {
  const { challengeId } = useParams({ strict: false }) as { challengeId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [justApplied, setJustApplied] = useState(false);
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });

  const challengeQuery = useQuery({
    queryKey: ['global_challenge_detail', challengeId],
    queryFn: () => getGlobalChallengeDetail(challengeId),
  });

  const challenge = challengeQuery.data;

  const isOrgOwner = !!(challenge?.organization_id && me.data?.organizations.some(
    (o) => o.organization_id === challenge.organization_id,
  ));
  const isCreator = !!(challenge?.created_by_user_id && me.data?.id === challenge.created_by_user_id);
  const canManage = isOrgOwner || isCreator;

  const applicationsQuery = useQuery({
    queryKey: ['global_challenge_applications', challengeId],
    queryFn: () => getGlobalApplications(challengeId, { per_page: 50 }),
    enabled: canManage,
  });

  const myApplication = challenge?.my_application;
  const hasApplied = !!myApplication;
  const hasOrg = (me.data?.organizations.length ?? 0) > 0;
  const canApply = challenge?.state === 'active' && !canManage && !hasApplied && hasOrg;

  const withdrawMut = useMutation({
    mutationFn: () => withdrawGlobalApplication(challengeId, myApplication!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global_challenge_detail', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['global_challenges'] });
    },
  });

  const activateMut = useMutation({
    mutationFn: () => updateGlobalChallenge(challengeId, { state: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global_challenge_detail', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['global_challenges'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteGlobalChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global_challenges'] });
      navigate({ to: '/challenges' });
    },
  });

  const appInvalidateKeys = [
    ['global_challenge_applications', challengeId],
    ['global_challenge_detail', challengeId],
  ];

  const backLink = (
    <Link to="/challenges" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
      Challenges
    </Link>
  );

  if (challengeQuery.isLoading) return <ChallengeDetailSkeleton backLink={backLink} />;
  if (challengeQuery.error || !challenge) return <ChallengeDetailError backLink={backLink} />;

  return (
    <ChallengeDetailView
      challenge={challenge}
      canManage={canManage}
      canApply={!!canApply}
      myApplication={myApplication ?? undefined}
      justApplied={justApplied}
      applications={applicationsQuery.data?.data ?? []}
      applicationsLoading={applicationsQuery.isLoading}
      onApply={(data) => createGlobalApplication(challenge.id, data)}
      applyInvalidateKeys={[['global_challenge_detail', challengeId], ['global_challenges']]}
      onApplySuccess={() => setJustApplied(true)}
      onWithdraw={() => withdrawMut.mutate()}
      onActivate={() => activateMut.mutate()}
      isActivating={activateMut.isPending}
      onDelete={() => deleteMut.mutate()}
      isDeleting={deleteMut.isPending}
      onAcceptApplication={(appId) => acceptGlobalApplication(challengeId, appId).then(() => {
        queryClient.invalidateQueries({ queryKey: appInvalidateKeys[0] });
        queryClient.invalidateQueries({ queryKey: appInvalidateKeys[1] });
      })}
      onRejectApplication={(appId) => rejectGlobalApplication(challengeId, appId).then(() => {
        queryClient.invalidateQueries({ queryKey: appInvalidateKeys[0] });
      })}
      onSelectWinner={(appId) => selectGlobalWinner(challengeId, appId).then(() => {
        queryClient.invalidateQueries({ queryKey: appInvalidateKeys[0] });
        queryClient.invalidateQueries({ queryKey: appInvalidateKeys[1] });
      })}
      backLink={backLink}
      showNoOrgNotice={challenge.state === 'active' && !hasOrg && !canManage}
    />
  );
}
