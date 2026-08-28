import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getAllEvents } from '../../lib/events';
import { getMe } from '../../lib/auth';
import type { Event, GlobalEventParams } from '../../lib/events';
import {
  useMyOrgLocation,
  resolveLocation,
  geoApiParams,
  EUROPE_BOUNDS,
  type ViewMode,
  type ExploreLocationSearch,
} from '../../lib/explore';
import { ExploreShell, InfiniteScrollSentinel } from '../../components/explore/ExploreShell';
import {
  SearchSection,
  LocationSection,
  FilterSection,
  type FilterUpdates,
} from '../../components/explore/ExploreFilters';
import { PointsMap, type MapPoint } from '../../components/explore/PointsMap';
import { EmptyState, GridSkeleton, ListSkeleton } from '../../components/ExploreList';

const EVENT_COLOR = '#F97316'; // orange — events on the map

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

function DateBadge({ iso, size = 'md' }: { iso: string; size?: 'md' | 'lg' }) {
  const d = new Date(iso);
  const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  const cls = size === 'lg' ? 'w-full aspect-[16/10]' : 'w-16 h-16 rounded-lg';
  return (
    <div className={`${cls} bg-primary/10 flex flex-col items-center justify-center shrink-0`}>
      <span className={`font-bold text-primary leading-none ${size === 'lg' ? 'text-sm' : 'text-[10px]'}`}>{month}</span>
      <span className={`font-bold text-primary leading-tight ${size === 'lg' ? 'text-4xl' : 'text-xl'}`}>{day}</span>
    </div>
  );
}

function EventMeta({ event }: { event: Event }) {
  return (
    <>
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
    </>
  );
}

function EventRow({ event }: { event: Event }) {
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
        <EventMeta event={event} />
      </div>
    </Link>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: event.id }}
      className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group overflow-hidden"
    >
      {event.image_url ? (
        <div className="aspect-[16/10] bg-gray-100">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <DateBadge iso={event.happens_at} size="lg" />
      )}
      <div className="p-4">
        <h3 className="font-display font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        <EventMeta event={event} />
      </div>
    </Link>
  );
}

type EventsSearch = ExploreLocationSearch & {
  search?: string;
  view?: Exclude<ViewMode, 'graph'>;
  when?: 'upcoming' | 'past';
};

export function EventsListPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as EventsSearch;
  const { search, country } = searchParams;
  const view = searchParams.view ?? 'cards';
  const when = searchParams.when ?? 'upcoming';

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const canCreate =
    meQuery.data?.role === 'facilitator' ||
    meQuery.data?.role === 'admin' ||
    (meQuery.data?.organizations.length ?? 0) > 0;

  const myLocation = useMyOrgLocation();
  const location = resolveLocation(searchParams, myLocation);

  const apiParams: GlobalEventParams = {
    search,
    upcoming: when === 'upcoming' || undefined,
    past: when === 'past' || undefined,
    ...geoApiParams(location, country),
  };

  const listQuery = useInfiniteQuery({
    queryKey: ['global_events', 'explore', apiParams],
    queryFn: ({ pageParam }) => getAllEvents({ ...apiParams, page: pageParam, per_page: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page ?? undefined,
    enabled: view !== 'map',
  });

  const mapQuery = useQuery({
    queryKey: ['global_events', 'explore-map', apiParams],
    queryFn: () => getAllEvents({ ...apiParams, view: 'map' }),
    enabled: view === 'map',
  });

  const events = listQuery.data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount =
    view === 'map'
      ? mapQuery.data?.meta.total_count
      : listQuery.data?.pages[0]?.meta.total_count;

  const update = (updates: FilterUpdates) => {
    navigate({ to: '/events', search: { ...searchParams, ...updates } });
  };

  const mapEvents = mapQuery.data?.data ?? [];
  const mapPoints: MapPoint[] = mapEvents
    .filter((e) => !e.online && e.lon != null && e.lat != null)
    .map((e) => ({
      id: e.id,
      lon: e.lon!,
      lat: e.lat!,
      color: EVENT_COLOR,
      title: e.title,
      subtitle: formatEventDate(e.happens_at),
      href: `/events/${e.id}`,
    }));
  const onlineCount = mapEvents.filter((e) => e.online).length;

  const isEmpty = !listQuery.isLoading && events.length === 0;

  return (
    <ExploreShell
      featureKey="events"
      title="Events"
      description="Discover events across the circular textile ecosystem. Workshops, conferences, networking sessions and more — find opportunities to connect and learn."
      action={
        canCreate ? (
          <Link
            to="/events/new"
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
          >
            Create event
          </Link>
        ) : undefined
      }
      view={view}
      onViewChange={(v) => update({ view: v === 'cards' ? undefined : v })}
      resultCount={totalCount}
      resultLabel="events"
      filters={
        <>
          <SearchSection
            defaultValue={search}
            placeholder="Search events..."
            onSearch={(q) => update({ search: q || undefined })}
          />
          <FilterSection title="When">
            <div className="flex gap-2">
              {(['upcoming', 'past'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => update({ when: opt === 'upcoming' ? undefined : opt })}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    when === opt
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt === 'upcoming' ? 'Upcoming' : 'Past'}
                </button>
              ))}
            </div>
          </FilterSection>
          <LocationSection
            location={location}
            hasMyLocation={myLocation !== null}
            country={country}
            onChange={update}
          />
        </>
      }
    >
      {view === 'map' ? (
        <>
          <PointsMap
            points={mapPoints}
            center={location.active ? [location.lon!, location.lat!] : undefined}
            radiusKm={location.active ? location.radius : undefined}
            maxBounds={EUROPE_BOUNDS}
          />
          {onlineCount > 0 && (
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 border border-border rounded-lg shadow-sm px-3 py-2 text-xs text-gray-600">
              {onlineCount} online {onlineCount === 1 ? 'event is' : 'events are'} not shown on the map
            </div>
          )}
        </>
      ) : listQuery.isLoading ? (
        view === 'cards' ? <GridSkeleton /> : <ListSkeleton />
      ) : listQuery.error ? (
        <p className="text-destructive">Failed to load events</p>
      ) : isEmpty ? (
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          }
          title={when === 'upcoming' ? 'No upcoming events' : 'No past events'}
          message={
            search || location.active
              ? 'Try adjusting your filters or search terms.'
              : when === 'upcoming'
                ? 'There are no upcoming events across the platform yet.'
                : 'There are no past events to show.'
          }
        />
      ) : (
        <>
          {view === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
          <InfiniteScrollSentinel
            hasNextPage={listQuery.hasNextPage ?? false}
            isFetchingNextPage={listQuery.isFetchingNextPage}
            fetchNextPage={listQuery.fetchNextPage}
          />
        </>
      )}
    </ExploreShell>
  );
}
