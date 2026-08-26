import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { isAuthenticated } from '../../lib/auth';
import {
  getListings,
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_SUBCATEGORIES,
} from '../../lib/listings';
import type { Listing, ListingParams } from '../../lib/listings';
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
  TaxonomySection,
  FilterSection,
  type FilterUpdates,
} from '../../components/explore/ExploreFilters';
import { PointsMap, MapLegendOverlay, type MapPoint } from '../../components/explore/PointsMap';
import { EmptyState, GridSkeleton, ListSkeleton } from '../../components/ExploreList';

function TypeBadge({ type }: { type: string }) {
  const config = LISTING_TYPES[type];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config?.badgeColor ?? 'bg-gray-100 text-gray-800'}`}
    >
      {config?.label ?? type}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const config = LISTING_CATEGORIES[category];
  if (!config) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}>
      {config.label}
    </span>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      to="/marketplace/$id"
      params={{ id: listing.id }}
      className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group overflow-hidden"
    >
      {listing.thumbnail_url ? (
        <div className="aspect-[16/10] bg-gray-100">
          <img
            src={listing.thumbnail_url}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[16/10] bg-gray-50 flex items-center justify-center">
          <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <TypeBadge type={listing.listing_type} />
          <CategoryBadge category={listing.category} />
          {listing.subcategory && LISTING_SUBCATEGORIES[listing.category]?.[listing.subcategory] && (
            <span className="text-[10px] text-gray-500">
              {LISTING_SUBCATEGORIES[listing.category][listing.subcategory].label}
            </span>
          )}
        </div>
        <h3 className="font-display font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{listing.description}</p>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          {listing.organization.image_url ? (
            <img
              src={listing.organization.image_url}
              alt={listing.organization.name}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-bold">
              {listing.organization.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-gray-600 truncate">{listing.organization.name}</span>
        </div>
      </div>
    </Link>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  return (
    <Link
      to="/marketplace/$id"
      params={{ id: listing.id }}
      className="flex items-center gap-4 bg-white border border-border rounded-lg p-3 hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      {listing.thumbnail_url ? (
        <img
          src={listing.thumbnail_url}
          alt={listing.title}
          className="w-16 h-16 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
          <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
          {listing.title}
        </h3>
        <p className="text-xs text-gray-500 truncate mt-0.5">{listing.organization.name}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <TypeBadge type={listing.listing_type} />
        <CategoryBadge category={listing.category} />
      </div>
    </Link>
  );
}

type MarketplaceSearch = ExploreLocationSearch & {
  search?: string;
  view?: ViewMode;
  by_type?: string;
  by_category?: string;
  by_subcategory?: string;
};

export function MarketplaceListPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ strict: false }) as MarketplaceSearch;
  const { search, by_type, by_category, by_subcategory, country } = searchParams;
  const view = searchParams.view ?? 'cards';

  const myLocation = useMyOrgLocation();
  const location = resolveLocation(searchParams, myLocation);

  const apiParams: ListingParams = {
    search,
    by_type,
    by_category,
    by_subcategory,
    ...geoApiParams(location, country),
  };

  const listQuery = useInfiniteQuery({
    queryKey: ['listings', 'explore', apiParams],
    queryFn: ({ pageParam }) => getListings({ ...apiParams, page: pageParam, per_page: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page ?? undefined,
    enabled: view !== 'map',
  });

  const mapQuery = useQuery({
    queryKey: ['listings', 'explore-map', apiParams],
    queryFn: () => getListings({ ...apiParams, view: 'map' }),
    enabled: view === 'map',
  });

  const listings = listQuery.data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount =
    view === 'map'
      ? mapQuery.data?.meta.total_count
      : listQuery.data?.pages[0]?.meta.total_count;

  const update = (updates: FilterUpdates) => {
    navigate({ to: '/marketplace', search: { ...searchParams, ...updates } });
  };

  const mapPoints: MapPoint[] = (mapQuery.data?.data ?? [])
    .filter((l) => l.organization.lon != null && l.organization.lat != null)
    .map((l) => ({
      id: l.id,
      lon: l.organization.lon!,
      lat: l.organization.lat!,
      color: LISTING_TYPES[l.listing_type]?.hex ?? '#6B7280',
      title: l.title,
      subtitle: l.organization.name,
      href: `/marketplace/${l.id}`,
    }));

  const isEmpty = !listQuery.isLoading && listings.length === 0;

  return (
    <ExploreShell
      featureKey="marketplace"
      title="Marketplace"
      description="Browse and publish listings for services, materials, capacities and products. Connect with organizations across the circular textile ecosystem to find what you need or offer what you have."
      action={
        isAuthenticated() ? (
          <Link
            to="/marketplace/new"
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
          >
            New listing
          </Link>
        ) : undefined
      }
      view={view}
      onViewChange={(v) => update({ view: v === 'cards' ? undefined : v })}
      resultCount={totalCount}
      resultLabel="listings"
      filters={
        <>
          <SearchSection
            defaultValue={search}
            placeholder="Search listings..."
            onSearch={(q) => update({ search: q || undefined })}
          />
          <LocationSection
            location={location}
            hasMyLocation={myLocation !== null}
            country={country}
            onChange={update}
          />
          <TaxonomySection
            by_type={by_type}
            by_category={by_category}
            by_subcategory={by_subcategory}
            onChange={update}
          />
          <FilterSection title="More">
            <Link to="/value-chain" className="text-sm text-gray-500 hover:text-primary transition-colors">
              View value chain &rarr;
            </Link>
          </FilterSection>
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
          <MapLegendOverlay
            items={Object.values(LISTING_TYPES).map((t) => ({ label: t.label, color: t.hex }))}
          />
        </>
      ) : listQuery.isLoading ? (
        view === 'cards' ? <GridSkeleton /> : <ListSkeleton />
      ) : listQuery.error ? (
        <p className="text-destructive">Failed to load listings</p>
      ) : isEmpty ? (
        <EmptyState
          icon={
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
          }
          title="No listings found"
          message={
            search || by_type || by_category || location.active
              ? 'Try adjusting your filters or search terms.'
              : 'Be the first to post a listing!'
          }
        />
      ) : (
        <>
          {view === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {listings.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
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
