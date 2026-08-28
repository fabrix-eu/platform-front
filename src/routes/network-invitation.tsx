import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvitationByToken, acceptInvitation } from '../lib/networks';
import { isAuthenticated } from '../lib/auth';

/** Landing page for the co-facilitator invitation email. */
export function NetworkInvitationPage() {
  const { token } = useSearch({ strict: false }) as { token?: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authed = isAuthenticated();

  const invitationQuery = useQuery({
    queryKey: ['network_invitation', token],
    queryFn: () => getInvitationByToken(token!),
    enabled: !!token,
    retry: false,
  });

  const accept = useMutation({
    mutationFn: () => acceptInvitation(token!),
    onSuccess: async (invitation) => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate({ to: '/facilitator', search: { network: invitation.network?.slug } });
    },
  });

  if (!token) {
    return <p className="max-w-md mx-auto mt-16 text-center text-gray-500">Missing invitation token.</p>;
  }

  if (invitationQuery.isLoading) {
    return <p className="max-w-md mx-auto mt-16 text-center text-gray-500">Loading invitation...</p>;
  }

  if (invitationQuery.error || !invitationQuery.data) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <p className="text-red-600 mb-3">This invitation is invalid or has been cancelled.</p>
        <Link to="/" className="text-sm text-primary hover:underline">Back to FABRIX</Link>
      </div>
    );
  }

  const invitation = invitationQuery.data;
  const expired = new Date(invitation.expires_at) < new Date() || invitation.status !== 'pending';

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-lg border border-border p-8 text-center">
      <h1 className="text-xl font-display font-bold text-gray-900 mb-2">
        Join {invitation.network?.name ?? 'a network'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {invitation.invited_by?.name ?? 'A facilitator'} invited you ({invitation.email}) to
        co-manage this network's CRM on FABRIX.
      </p>

      {expired ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          This invitation has expired or was already used. Ask for a new one.
        </p>
      ) : authed ? (
        <>
          <button
            type="button"
            onClick={() => accept.mutate()}
            disabled={accept.isPending}
            className="bg-primary text-primary-foreground rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {accept.isPending ? 'Joining...' : 'Accept invitation'}
          </button>
          {accept.isError && (
            <p className="text-sm text-red-600 mt-3">Could not accept this invitation (already a member?).</p>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Sign in or create an account, then reopen this link.</p>
          <div className="flex justify-center gap-3">
            <Link
              to="/login"
              className="bg-primary text-primary-foreground rounded-lg px-5 py-2 text-sm font-medium hover:bg-primary/90"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="border border-border rounded-lg px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
