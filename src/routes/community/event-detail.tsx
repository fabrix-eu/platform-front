import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  getCommunityEvent,
  getEventParticipants,
  rsvpToEvent,
  cancelRsvp,
  deleteCommunityEvent,
} from '../../lib/community-events';
import type { EventParticipant } from '../../lib/community-events';

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ParticipantAvatar({ participant }: { participant: EventParticipant }) {
  const user = participant.user;
  if (user.image_url) {
    return (
      <img
        src={user.image_url}
        alt={user.name}
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }
  const initials = (user.name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
      {initials}
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case 'going': return 'Going';
    case 'maybe': return 'Maybe';
    case 'not_going': return 'Not going';
    default: return status;
  }
}

function statusBadgeColor(status: string): string {
  switch (status) {
    case 'going': return 'bg-green-100 text-green-700';
    case 'maybe': return 'bg-yellow-100 text-yellow-700';
    case 'not_going': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export function CommunityEventDetailPage() {
  const { orgSlug, communitySlug, eventId } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
    eventId: string;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = me.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  const eventQuery = useQuery({
    queryKey: ['community_events', communitySlug, eventId],
    queryFn: () => getCommunityEvent(communitySlug, eventId),
  });

  const participantsQuery = useQuery({
    queryKey: ['event_participants', communitySlug, eventId],
    queryFn: () => getEventParticipants(communitySlug, eventId),
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: 'going' | 'maybe' | 'not_going') =>
      rsvpToEvent(communitySlug, eventId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event_participants', communitySlug, eventId] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (participantId: string) =>
      cancelRsvp(communitySlug, eventId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event_participants', communitySlug, eventId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCommunityEvent(communitySlug, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_events', communitySlug] });
      navigate({
        to: '/$orgSlug/communities/$communitySlug/events',
        params: { orgSlug, communitySlug },
      });
    },
  });

  const participants = participantsQuery.data ?? [];
  const myRsvp = participants.find((p) => p.user.id === me.data?.id);

  const goingCount = participants.filter((p) => p.status === 'going').length;
  const maybeCount = participants.filter((p) => p.status === 'maybe').length;

  function handleRsvp(status: 'going' | 'maybe' | 'not_going') {
    if (myRsvp?.status === status) {
      cancelMutation.mutate(myRsvp.id);
    } else {
      rsvpMutation.mutate(status);
    }
  }

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this event? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  }

  if (eventQuery.isLoading) {
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

  if (eventQuery.error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-red-600">Event not found</p>
        <Link
          to="/$orgSlug/communities/$communitySlug/events"
          params={{ orgSlug, communitySlug }}
          className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block"
        >
          &larr; Back to events
        </Link>
      </div>
    );
  }

  const event = eventQuery.data!;

  return (
    <div className="max-w-3xl mx-auto p-6 pb-12">
      {/* Back link */}
      <Link
        to="/$orgSlug/communities/$communitySlug/events"
        params={{ orgSlug, communitySlug }}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Events
      </Link>

      {/* Event image */}
      {event.image_url && (
        <div className="rounded-xl overflow-hidden mb-6">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-4">{event.title}</h1>

      {/* Date */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
        {formatFullDate(event.happens_at)}
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        {event.online ? (
          <>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span>Online event</span>
            {event.online_url && (
              <a
                href={event.online_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Join link
              </a>
            )}
          </>
        ) : event.address ? (
          <>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            {event.address}
          </>
        ) : null}
      </div>

      {/* Description */}
      {event.description && (
        <div className="mb-8">
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {event.description}
          </p>
        </div>
      )}

      {/* RSVP section */}
      <div className="bg-white border border-border rounded-lg p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Your RSVP</h3>
        <div className="flex gap-2">
          {(['going', 'maybe', 'not_going'] as const).map((status) => {
            const isActive = myRsvp?.status === status;
            const isPending = rsvpMutation.isPending || cancelMutation.isPending;
            return (
              <button
                key={status}
                onClick={() => handleRsvp(status)}
                disabled={isPending}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {statusLabel(status)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Participants section */}
      <div className="bg-white border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Participants</h3>
          <span className="text-xs text-gray-500">
            {goingCount} going{maybeCount > 0 ? ` \u00B7 ${maybeCount} maybe` : ''}
          </span>
        </div>

        {participantsQuery.isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : participants.length === 0 ? (
          <p className="text-sm text-gray-500">No participants yet. Be the first to RSVP!</p>
        ) : (
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <ParticipantAvatar participant={p} />
                <span className="text-sm text-gray-900 font-medium">{p.user.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadgeColor(p.status)}`}>
                  {statusLabel(p.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="bg-white border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Admin actions</h3>
          <div className="flex items-center gap-3">
            <Link
              to="/$orgSlug/communities/$communitySlug/events/$eventId/edit"
              params={{ orgSlug, communitySlug, eventId }}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit event
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete event'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
