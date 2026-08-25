import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getAllEvents } from '../../lib/events';
import { getMe } from '../../lib/auth';
import type { Event } from '../../lib/events';
import { LocationFilter } from '../../components/LocationFilter';
import type { LocationFilterParams } from '../../components/LocationFilter';
import {
  ExploreListLayout,
  SearchBar,
  EmptyState,
  ListSkeleton,
  Pagination,
  PAGINATION_LINK_CLASS,
} from '../../components/ExploreList';

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

function EventCard({ event }: { event: Event }) {
  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: event.id }}
      className="flex items-start gap-4 bg-white border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
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
      </div>
    </Link>
  );
}

type Tab = 'upcoming' | 'past';

export function EventsListPage() {
  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const canCreate =
    meQuery.data?.role === 'facilitator' ||
    meQuery.data?.role === 'admin' ||
    (meQuery.data?.organizations.length ?? 0) > 0;
  const navigate = useNavigate();
  const { page, search, country, lon, lat, radius, location_label } = useSearch({ strict: false }) as {
    page?: number;
    search?: string;
    country?: string;
    lon?: number;
    lat?: number;
    radius?: number;
    location_label?: string;
  };
  const [tab, setTab] = useState<Tab>('upcoming');

  const locationParams: Record<string, string> = {};
  if (country) locationParams.by_country = country;
  if (lon !== undefined && lat !== undefined) {
    locationParams['within_distance[lon]'] = String(lon);
    locationParams['within_distance[lat]'] = String(lat);
    locationParams['within_distance[radius]'] = String(radius || 100);
  }

  const query = useQuery({
    queryKey: ['global_events', page, search, country, lon, lat, radius],
    queryFn: () => getAllEvents({ page: page || 1, per_page: 50, search, ...locationParams }),
  });

  const locSearch = { country, lon, lat, radius, location_label };

  const handleSearch = (q: string) => {
    navigate({ to: '/events', search: { search: q || undefined, page: 1, ...locSearch } });
  };

  const handleLocationFilter = (params: LocationFilterParams) => {
    navigate({
      to: '/events',
      search: {
        search, page: 1,
        country: params.country, lon: params.lon, lat: params.lat,
        radius: params.radius, location_label: params.location_label,
      },
    });
  };

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
    <ExploreListLayout
      featureKey="events"
      title="Events"
      description="Discover events across the circular textile ecosystem. Workshops, conferences, networking sessions and more — find opportunities to connect and learn."
      action={
        canCreate ? (
          <Link
            to="/events/new"
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create event
          </Link>
        ) : undefined
      }
    >
      <div className="space-y-3">
        <SearchBar defaultValue={search || ''} placeholder="Search events..." onSearch={handleSearch} />
        <LocationFilter
          value={{ country, lon, lat, radius, location_label }}
          onChange={handleLocationFilter}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
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
        <ListSkeleton />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          }
          title={tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          message={
            tab === 'upcoming'
              ? 'There are no upcoming events across the platform yet.'
              : 'There are no past events to show.'
          }
        />
      ) : (
        <div className="space-y-3">
          {displayed.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <Pagination
        meta={query.data?.meta}
        renderLink={(page, label) => (
          <Link to="/events" search={{ search, page, ...locSearch }} className={PAGINATION_LINK_CLASS}>
            {label}
          </Link>
        )}
      />
    </ExploreListLayout>
  );
}
