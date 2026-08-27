import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNetworkMembers,
  getNetworkInvitations,
  getNetworkCandidates,
  grantNetworkAccess,
  inviteNetworkMember,
  cancelNetworkInvitation,
} from '../../lib/networks';
import { getInitials } from '../../lib/utils';

function Avatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className="h-7 w-7 rounded-full object-cover" />;
  }
  return (
    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
      {getInitials(name)}
    </div>
  );
}

export function TeamPanel({ networkSlug, organizationName }: { networkSlug: string; organizationName?: string }) {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ['network_members', networkSlug],
    queryFn: () => getNetworkMembers(networkSlug),
  });

  const candidatesQuery = useQuery({
    queryKey: ['network_candidates', networkSlug],
    queryFn: () => getNetworkCandidates(networkSlug),
  });

  const invitationsQuery = useQuery({
    queryKey: ['network_invitations', networkSlug],
    queryFn: () => getNetworkInvitations(networkSlug),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['network_members', networkSlug] });
    queryClient.invalidateQueries({ queryKey: ['network_candidates', networkSlug] });
    queryClient.invalidateQueries({ queryKey: ['network_invitations', networkSlug] });
  };

  const grant = useMutation({
    mutationFn: (userId: string) => grantNetworkAccess(networkSlug, userId),
    onSuccess: invalidate,
  });

  const invite = useMutation({
    mutationFn: (email: string) => inviteNetworkMember(networkSlug, email),
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelNetworkInvitation(networkSlug, id),
    onSuccess: invalidate,
  });

  const candidates = candidatesQuery.data ?? [];

  return (
    <section className="bg-white rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Team</h2>

      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Has facilitator access</p>
      <ul className="space-y-2 mb-4">
        {(membersQuery.data ?? []).map((member) => (
          <li key={member.id} className="flex items-center gap-2.5">
            <Avatar name={member.user.name} imageUrl={member.user.image_url} />
            <div className="min-w-0">
              <p className="text-sm text-gray-900 truncate">{member.user.name}</p>
              <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
            </div>
          </li>
        ))}
      </ul>

      {candidates.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
            Other people{organizationName ? ` at ${organizationName}` : ''}
          </p>
          <ul className="space-y-2">
            {candidates.map((candidate) => (
              <li key={candidate.id} className="flex items-center gap-2.5">
                <Avatar name={candidate.name} imageUrl={candidate.image_url} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 truncate">{candidate.name}</p>
                  <p className="text-xs text-gray-400 truncate">{candidate.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => grant.mutate(candidate.id)}
                  disabled={grant.isPending}
                  className="shrink-0 text-xs font-medium text-primary border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/5 disabled:opacity-50"
                >
                  Grant access
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(invitationsQuery.data ?? []).length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Pending invitations</p>
          <ul className="space-y-1.5">
            {(invitationsQuery.data ?? []).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between text-sm text-gray-600">
                <span className="truncate">{inv.email}</span>
                <button
                  type="button"
                  onClick={() => cancel.mutate(inv.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const email = (fd.get('email') as string).trim();
          if (!email) return;
          invite.mutate(email);
          e.currentTarget.reset();
        }}
      >
        <input
          name="email"
          type="email"
          placeholder="Invite a facilitator by email..."
          className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={invite.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          Invite
        </button>
      </form>
      {invite.isError && (
        <p className="text-xs text-red-600 mt-1.5">Could not send the invitation (already a member or invited?)</p>
      )}
      {invite.isSuccess && <p className="text-xs text-green-600 mt-1.5">Invitation sent.</p>}
    </section>
  );
}
