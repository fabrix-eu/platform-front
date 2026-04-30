import { useState } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  getChallengeDetail,
  deleteChallenge,
  updateChallenge,
  createApplication,
  withdrawApplication,
  getChallengeApplications,
  acceptApplication,
  rejectApplication,
  selectWinner,
} from '../../lib/community-challenges';
import { ChallengeDetailView, ChallengeDetailSkeleton, ChallengeDetailError } from '../../components/ChallengeDetailView';

export function ChallengeDetailPage() {
  const { orgSlug, communitySlug, challengeId } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
    challengeId: string;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [justApplied, setJustApplied] = useState(false);

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

  const myApplication = challenge?.my_application;
  const hasApplied = !!myApplication;
  const myOrgInCommunity = me.data?.organizations.find(
    (o) => o.communities.some((c) => c.community_slug === communitySlug),
  );
  const canApply = challenge?.state === 'active' && !isOwner && !hasApplied && !!myOrgInCommunity;

  const withdrawMut = useMutation({
    mutationFn: () => withdrawApplication(communitySlug, challengeId, myApplication!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug, challengeId] });
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug] });
    },
  });

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

  const appInvalidateKeys = [
    ['challenge_applications', communitySlug, challengeId],
    ['community_challenges', communitySlug, challengeId],
  ];

  const backLink = (
    <Link
      to="/$orgSlug/communities/$communitySlug/challenges"
      params={{ orgSlug, communitySlug }}
      className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
      Challenges
    </Link>
  );

  if (challengeQuery.isLoading) return <ChallengeDetailSkeleton backLink={backLink} />;
  if (challengeQuery.error || !challenge) return <ChallengeDetailError backLink={backLink} />;

  const editLink = (
    <Link
      to="/$orgSlug/communities/$communitySlug/challenges/$challengeId/edit"
      params={{ orgSlug, communitySlug, challengeId }}
      className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
    >
      Edit challenge
    </Link>
  );

  return (
    <ChallengeDetailView
      challenge={challenge}
      canManage={canManage}
      canApply={canApply}
      myApplication={myApplication ?? undefined}
      justApplied={justApplied}
      applications={applicationsQuery.data?.data ?? []}
      applicationsLoading={applicationsQuery.isLoading}
      onApply={(data) => createApplication(communitySlug, challenge.id, data)}
      applyInvalidateKeys={appInvalidateKeys}
      onApplySuccess={() => setJustApplied(true)}
      onWithdraw={() => withdrawMut.mutate()}
      onActivate={() => activateMut.mutate()}
      isActivating={activateMut.isPending}
      onDelete={() => deleteMut.mutate()}
      isDeleting={deleteMut.isPending}
      onAcceptApplication={(appId) => acceptApplication(communitySlug, challengeId, appId).then(() => {
        queryClient.invalidateQueries({ queryKey: appInvalidateKeys[0] });
        queryClient.invalidateQueries({ queryKey: appInvalidateKeys[1] });
      })}
      onRejectApplication={(appId) => rejectApplication(communitySlug, challengeId, appId).then(() => {
        queryClient.invalidateQueries({ queryKey: appInvalidateKeys[0] });
      })}
      onSelectWinner={(appId) => selectWinner(communitySlug, challengeId, appId).then(() => {
        queryClient.invalidateQueries({ queryKey: appInvalidateKeys[0] });
        queryClient.invalidateQueries({ queryKey: appInvalidateKeys[1] });
      })}
      backLink={backLink}
      editLink={editLink}
      draftVisibilityText="not visible to community members"
    />
  );
}
