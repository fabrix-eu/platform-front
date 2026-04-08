import { useState } from 'react';
import { Link, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAllEvents } from '../../lib/community-events';
import type { CommunityEvent } from '../../lib/community-events';

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

function DateBadge({ iso }: { iso: string }) {
  const d = new Date(iso);
  const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  return (
    <div className="w-16 h-16 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0">
      <span className="text-[10px] font-bold text-primary leading-none">{month}</span>
      <span className="text-xl font-bold text-primary leading-tight">{day}</span>
    </div>
  );
}

function EventCard({ event }: { event: CommunityEvent }) {
  return (
    <div className="flex items-start gap-4 bg-white border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      {event.image_url ? (
        <img
          src={event.image_url}
          alt={event.title}
          className="w-16 h-16 rounded-lg object-cover shrink-0"
        />
      ) : (
        <DateBadge iso={event.happens_at} />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{event.title}</h3>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          {formatEventDate(event.happens_at)}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
          {event.online ? (
            <>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Online
            </>
          ) : event.address ? (
            <>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span className="truncate">{event.address}</span>
            </>
          ) : null}
        </p>
        {event.community && (
          <p className="text-[10px] text-gray-400 mt-1.5">
            {event.community.name}
          </p>
        )}
      </div>
    </div>
  );
}

type Tab = 'upcoming' | 'past';

export function EventsListPage() {
  const { page } = useSearch({ strict: false }) as { page?: number };
  const [tab, setTab] = useState<Tab>('upcoming');

  const query = useQuery({
    queryKey: ['global_events', page],
    queryFn: () => getAllEvents({ page: page || 1, per_page: 50 }),
  });

  const allEvents = query.data?.data ?? [];
  const now = new Date();

  const upcoming = allEvents
    .filter((e) => new Date(e.happens_at) >= now)
    .sort((a, b) => new Date(a.happens_at).getTime() - new Date(b.happens_at).getTime());

  const past = allEvents
    .filter((e) => new Date(e.happens_at) < now)
    .sort((a, b) => new Date(b.happens_at).getTime() - new Date(a.happens_at).getTime());

  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'upcoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'past'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Past ({past.length})
        </button>
      </div>

      {/* Content */}
      {query.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-border rounded-lg p-4 flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-lg border border-border p-8 text-center space-y-3">
          <div className="flex justify-center text-gray-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <h3 className="font-display font-semibold text-gray-900">
            {tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {tab === 'upcoming'
              ? 'There are no upcoming events across the platform yet.'
              : 'There are no past events to show.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {query.data?.meta && query.data.meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          {query.data.meta.prev_page && (
            <Link
              to="/events"
              search={{ page: query.data.meta.prev_page }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {query.data.meta.current_page} of {query.data.meta.total_pages}
          </span>
          {query.data.meta.next_page && (
            <Link
              to="/events"
              search={{ page: query.data.meta.next_page }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Next &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
