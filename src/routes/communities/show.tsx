import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCommunity } from '../../lib/communities';
import { getCommunityOrganizations } from '../../lib/community-organizations';
import { getCommunityEvents } from '../../lib/events';
import { getCommunityChallenge } from '../../lib/community-challenges';
import { getMe } from '../../lib/auth';
import { ORG_KINDS } from '../../lib/organizations';
import {
  createCommunityJoinRequest,
  getMyCommunityJoinRequests,
} from '../../lib/community-join-requests';
import { FieldError, FormError } from '../../components/FieldError';
import type { CommunityOrganization } from '../../lib/community-organizations';
import type { Event } from '../../lib/events';
import type { Challenge } from '../../lib/community-challenges';

function CommunityJoinRequestButton({ communityId }: { communityId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const myOrgs = meQuery.data?.organizations ?? [];

  const myRequestsQuery = useQuery({
    queryKey: ['my', 'community-join-requests'],
    queryFn: getMyCommunityJoinRequests,
  });

  const mutation = useMutation({
    mutationFn: ({ orgId, msg }: { orgId: string; msg: string }) =>
      createCommunityJoinRequest(communityId, orgId, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['my', 'community-join-requests'],
      });
      setShowForm(false);
      setMessage('');
      setSelectedOrgId('');
    },
  });

  const pendingRequest = myRequestsQuery.data?.find(
    (r) =>
      r.community.id === communityId &&
      r.status === 'pending',
  );

  if (mutation.isSuccess) {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        Request sent! You will be notified once reviewed.
      </p>
    );
  }

  if (pendingRequest) {
    return (
      <span className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-medium bg-amber-100 text-amber-800">
        Request pending
      </span>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => {
          if (myOrgs.length === 1) {
            setSelectedOrgId(myOrgs[0].organization_id);
          }
          setShowForm(true);
        }}
        className="bg-primary text-primary-foreground rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
      >
        Request to join
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 w-full max-w-sm">
      <h4 className="text-sm font-semibold text-gray-900">Join this community</h4>
      {myOrgs.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Select organization
          </label>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          >
            <option value="">Choose an organization...</option>
            {myOrgs.map((o) => (
              <option key={o.organization_id} value={o.organization_id}>
                {o.organization_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Why should your organization join? (min. 10 characters)"
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
      />
      <FieldError mutation={mutation} field="message" />
      <FieldError mutation={mutation} field="organization" />
      <FieldError mutation={mutation} field="user" />
      <FormError mutation={mutation} />

      <div className="flex gap-2">
        <button
          onClick={() =>
            mutation.mutate({ orgId: selectedOrgId, msg: message })
          }
          disabled={
            !selectedOrgId ||
            message.trim().length < 10 ||
            mutation.isPending
          }
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Sending...' : 'Send request'}
        </button>
        <button
          onClick={() => {
            setShowForm(false);
            setMessage('');
            setSelectedOrgId('');
          }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: CommunityOrganization }) {
  const org = member.organization;
  const kindInfo = org.kind ? ORG_KINDS[org.kind] : null;

  return (
    <Link
      to="/organizations/$id"
      params={{ id: org.slug || org.id }}
      className="flex items-center gap-3 bg-white border border-border rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      {org.image_url ? (
        <img
          src={org.image_url}
          alt={org.name}
          className="w-10 h-10 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-semibold shrink-0">
          {org.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
          {org.name}
        </p>
        {kindInfo && (
          <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5 ${kindInfo.badgeColor}`}>
            {kindInfo.label}
          </span>
        )}
      </div>
    </Link>
  );
}

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function EventPreviewCard({ event }: { event: Event }) {
  const d = new Date(event.happens_at);
  const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  const day = d.getDate();

  return (
    <div className="flex items-start gap-3 bg-white border border-border rounded-lg p-3">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-primary leading-none">{month}</span>
        <span className="text-lg font-bold text-primary leading-tight">{day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-medium text-gray-900 truncate">{event.title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{formatEventDate(event.happens_at)}</p>
        {event.online ? (
          <p className="text-xs text-gray-500 mt-0.5">Online</p>
        ) : event.address ? (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{event.address}</p>
        ) : null}
      </div>
    </div>
  );
}

function ChallengePreviewCard({ challenge }: { challenge: Challenge }) {
  const stateColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-600',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white border border-border rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-gray-900 truncate flex-1">{challenge.title}</h4>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${stateColors[challenge.state] || stateColors.draft}`}>
          {challenge.state}
        </span>
      </div>
      {challenge.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{challenge.description}</p>
      )}
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
        {challenge.applications_count > 0 && (
          <span>{challenge.applications_count} application{challenge.applications_count !== 1 ? 's' : ''}</span>
        )}
        {challenge.end_on && (
          <span>Ends {new Date(challenge.end_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, count, children }: { title: string; count?: number; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-lg font-display font-semibold text-gray-900">
        {title}
        {count != null && count > 0 && (
          <span className="text-sm font-normal text-gray-400 ml-2">({count})</span>
        )}
      </h2>
      {children}
    </div>
  );
}

export function CommunityShowPage() {
  const { id } = useParams({ strict: false }) as { id: string };

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const query = useQuery({
    queryKey: ['communities', id],
    queryFn: () => getCommunity(id),
  });

  const community = query.data;
  const communityId = community?.id ?? id;

  const membersQuery = useQuery({
    queryKey: ['community_organizations', communityId, 'preview'],
    queryFn: () => getCommunityOrganizations(communityId, { per_page: 6 }),
    enabled: !!community,
  });

  const eventsQuery = useQuery({
    queryKey: ['community_events', communityId, 'preview'],
    queryFn: () => getCommunityEvents(communityId, { per_page: 3 }),
    enabled: !!community,
  });

  const challengesQuery = useQuery({
    queryKey: ['community_challenges', communityId, 'preview'],
    queryFn: () => getCommunityChallenge(communityId, { per_page: 3 }),
    enabled: !!community,
  });

  if (query.isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (query.error || !community) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-600">Community not found</p>
        <Link
          to="/communities"
          className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block"
        >
          &larr; Back to communities
        </Link>
      </div>
    );
  }

  const me = meQuery.data;
  const isLoggedIn = !!me;

  const isMember = me?.organizations.some((o) =>
    o.communities.some((c) => c.community_id === community.id),
  ) ?? false;

  const memberOrgSlug = me?.organizations.find((o) =>
    o.communities.some((c) => c.community_id === community.id),
  )?.organization_slug;

  const initials = community.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const members = membersQuery.data?.data ?? [];
  const totalMembers = membersQuery.data?.meta.total_count ?? community.organizations_count;
  const events = eventsQuery.data?.data ?? [];
  const totalEvents = eventsQuery.data?.meta.total_count ?? 0;
  const challenges = challengesQuery.data?.data ?? [];
  const totalChallenges = challengesQuery.data?.meta.total_count ?? 0;

  const upcomingEvents = events.filter((e) => new Date(e.happens_at) >= new Date());

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="px-6 py-4">
        <Link
          to="/communities"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to communities
        </Link>
      </div>

      {/* Hero header */}
      <div className="px-6">
        <div className="bg-gradient-to-br from-primary/5 via-blue-50/50 to-white border border-border rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                  {community.name}
                </h1>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                    {totalMembers} {totalMembers === 1 ? 'organization' : 'organizations'}
                  </span>
                  {community.center_address && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      {community.center_address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mt-1">
              {isMember && memberOrgSlug && (
                <Link
                  to="/$orgSlug/communities/$communitySlug"
                  params={{ orgSlug: memberOrgSlug, communitySlug: community.slug }}
                  className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Go to community
                </Link>
              )}
              {isMember && (
                <span className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                  Member
                </span>
              )}
            </div>
          </div>

          {community.description && (
            <p className="text-sm text-gray-600 leading-relaxed mt-4 whitespace-pre-line">
              {community.description}
            </p>
          )}
        </div>
      </div>

      {/* Join CTA for non-members */}
      {isLoggedIn && !isMember && (
        <div className="px-6 mt-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Interested in this community?</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Join to participate in events, challenges, and collaborate with members.
              </p>
            </div>
            <CommunityJoinRequestButton communityId={community.id} />
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <div className="px-6 mt-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Want to join this community?</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Sign in to request membership and access events, challenges, and more.
              </p>
            </div>
            <Link
              to="/login"
              className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm shrink-0"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      {/* Members section */}
      <div className="px-6 mt-8">
        <SectionHeader title="Members" count={totalMembers} />
        {membersQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : members.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {members.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
            {totalMembers > members.length && (
              <p className="text-sm text-gray-400 mt-3 text-center">
                and {totalMembers - members.length} more...
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400">No members yet.</p>
        )}
      </div>

      {/* Events section */}
      <div className="px-6 mt-8">
        <SectionHeader title="Upcoming events" count={totalEvents} />
        {eventsQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map((e) => (
              <EventPreviewCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No upcoming events.</p>
        )}
      </div>

      {/* Challenges section */}
      <div className="px-6 mt-8">
        <SectionHeader title="Challenges" count={totalChallenges} />
        {challengesQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : challenges.length > 0 ? (
          <div className="space-y-3">
            {challenges.map((c) => (
              <ChallengePreviewCard key={c.id} challenge={c} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No challenges yet.</p>
        )}
      </div>
    </div>
  );
}
