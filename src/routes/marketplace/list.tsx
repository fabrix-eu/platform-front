import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { isAuthenticated } from '../../lib/auth';
import {
  getListings,
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_SUBCATEGORIES,
} from '../../lib/listings';
import type { Listing } from '../../lib/listings';
import { TaxonomyFilter } from '../../components/TaxonomyFilter';
import { LocationFilter } from '../../components/LocationFilter';
import type { LocationFilterParams } from '../../components/LocationFilter';
import {
  ExploreListLayout,
  SearchBar,
  EmptyState,
  GridSkeleton,
  Pagination,
  PAGINATION_LINK_CLASS,
} from '../../components/ExploreList';

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

export function MarketplaceListPage() {
  const navigate = useNavigate();
  const { search, page, by_type, by_category, by_subcategory, country, lon, lat, radius, location_label } = useSearch({ strict: false }) as {
    search?: string;
    page?: number;
    by_type?: string;
    by_category?: string;
    by_subcategory?: string;
    country?: string;
    lon?: number;
    lat?: number;
    radius?: number;
    location_label?: string;
  };

  const locationParams: Record<string, string> = {};
  if (country) locationParams.by_country = country;
  if (lon !== undefined && lat !== undefined) {
    locationParams['within_distance[lon]'] = String(lon);
    locationParams['within_distance[lat]'] = String(lat);
    locationParams['within_distance[radius]'] = String(radius || 100);
  }

  const query = useQuery({
    queryKey: ['listings', { page, search, by_type, by_category, by_subcategory, country, lon, lat, radius }],
    queryFn: () =>
      getListings({
        page: page || 1,
        per_page: 20,
        search,
        by_type,
        by_category,
        by_subcategory,
        ...locationParams,
      }),
  });

  const meta = query.data?.meta;
  const listings = query.data?.data ?? [];

  const locSearch = { country, lon, lat, radius, location_label };

  const handleSearch = (q: string) => {
    navigate({
      to: '/marketplace',
      search: { search: q || undefined, page: 1, by_type, by_category, by_subcategory, ...locSearch },
    });
  };

  const handleTaxonomyFilter = (params: { by_type?: string; by_category?: string; by_subcategory?: string }) => {
    navigate({
      to: '/marketplace',
      search: { search, page: 1, ...params, ...locSearch },
    });
  };

  const handleLocationFilter = (params: LocationFilterParams) => {
    navigate({
      to: '/marketplace',
      search: {
        search, page: 1, by_type, by_category, by_subcategory,
        country: params.country, lon: params.lon, lat: params.lat,
        radius: params.radius, location_label: params.location_label,
      },
    });
  };

  return (
    <ExploreListLayout
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
    >
      {/* Search + Filters */}
      <div className="space-y-3">
        <SearchBar defaultValue={search || ''} placeholder="Search listings..." onSearch={handleSearch} />

        <div className="flex items-center gap-3">
          <TaxonomyFilter
            activeType={by_type}
            activeCategory={by_category}
            activeSubcategory={by_subcategory}
            onFilter={handleTaxonomyFilter}
          />
          <Link
            to="/value-chain"
            className="shrink-0 text-xs text-gray-500 hover:text-primary transition-colors"
          >
            View value chain &rarr;
          </Link>
        </div>

        <LocationFilter
          value={{ country, lon, lat, radius, location_label }}
          onChange={handleLocationFilter}
        />
      </div>

      {/* Content */}
      {query.isLoading && <GridSkeleton />}

      {query.error && <p className="text-destructive">Failed to load listings</p>}

      {query.data && (
        <>
          <p className="text-sm text-muted-foreground">{meta?.total_count ?? 0} listings</p>

          {listings.length === 0 ? (
            <EmptyState
              icon={
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                </svg>
              }
              title="No listings found"
              message={
                search || by_type || by_category
                  ? 'Try adjusting your filters or search terms.'
                  : 'Be the first to post a listing!'
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          <Pagination
            meta={meta}
            renderLink={(page, label) => (
              <Link
                to="/marketplace"
                search={{ search, page, by_type, by_category, by_subcategory, ...locSearch }}
                className={PAGINATION_LINK_CLASS}
              >
                {label}
              </Link>
            )}
          />
        </>
      )}
    </ExploreListLayout>
  );
}
