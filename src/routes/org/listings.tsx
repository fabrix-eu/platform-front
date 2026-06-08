import { Link, useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrganization } from '../../lib/organizations';
import {
  useListings,
  useDeleteListing,
  getListings,
  listingKeys,
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_SUBCATEGORIES,
} from '../../lib/listings';
import type { Listing } from '../../lib/listings';

type ListingTypeId = 'service' | 'material' | 'capacity' | 'product' | 'distribution';

const SECTIONS: { id: ListingTypeId; label: string }[] = [
  { id: 'service', label: 'Services' },
  { id: 'material', label: 'Materials' },
  { id: 'capacity', label: 'Capacities' },
  { id: 'product', label: 'Products' },
  { id: 'distribution', label: 'Distribution' },
];

function ListingMiniCard({ listing, onDelete, orgSlug }: { listing: Listing; onDelete: (id: string) => void; orgSlug: string }) {
  const categoryConfig = LISTING_CATEGORIES[listing.category];
  const fromUrl = `/${orgSlug}/listings`;
  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-border rounded-lg group">
      {listing.thumbnail_url ? (
        <img src={listing.thumbnail_url} alt="" className="w-16 h-16 rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
          <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {categoryConfig && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${categoryConfig.badgeColor}`}>
              {categoryConfig.label}
            </span>
          )}
          {listing.subcategory && LISTING_SUBCATEGORIES[listing.category]?.[listing.subcategory] && (
            <span className="text-[10px] text-gray-500">
              {LISTING_SUBCATEGORIES[listing.category][listing.subcategory].label}
            </span>
          )}
          {listing.status === 'closed' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
              Closed
            </span>
          )}
        </div>
        <h4 className="text-sm font-medium text-gray-900 truncate">{listing.title}</h4>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{listing.description}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          to="/marketplace/$id/edit"
          params={{ id: listing.id }}
          search={{ from: fromUrl }}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
        </Link>
        <button
          onClick={() => { if (confirm('Delete this listing?')) onDelete(listing.id); }}
          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function OrgListingsPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const { type } = useSearch({ strict: false }) as { type?: ListingTypeId };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeType: ListingTypeId = type || 'service';

  const setActiveType = (id: ListingTypeId) => {
    navigate({
      to: '/$orgSlug/listings',
      params: { orgSlug },
      search: id === 'service' ? {} : { type: id },
    });
  };

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const orgId = orgQuery.data?.id;

  // Count queries per type (lightweight: per_page=1, only reading meta.total_count)
  const countParams = (t: string) => ({ by_organization: orgId!, by_type: t, per_page: 1 });
  const serviceCnt = useQuery({ queryKey: listingKeys.list(countParams('service')), queryFn: () => getListings(countParams('service')), enabled: !!orgId });
  const materialCnt = useQuery({ queryKey: listingKeys.list(countParams('material')), queryFn: () => getListings(countParams('material')), enabled: !!orgId });
  const capacityCnt = useQuery({ queryKey: listingKeys.list(countParams('capacity')), queryFn: () => getListings(countParams('capacity')), enabled: !!orgId });
  const productCnt = useQuery({ queryKey: listingKeys.list(countParams('product')), queryFn: () => getListings(countParams('product')), enabled: !!orgId });
  const distributionCnt = useQuery({ queryKey: listingKeys.list(countParams('distribution')), queryFn: () => getListings(countParams('distribution')), enabled: !!orgId });

  const sectionCounts: Partial<Record<ListingTypeId, number>> = {
    service: serviceCnt.data?.meta.total_count,
    material: materialCnt.data?.meta.total_count,
    capacity: capacityCnt.data?.meta.total_count,
    product: productCnt.data?.meta.total_count,
    distribution: distributionCnt.data?.meta.total_count,
  };

  // Active type listings
  const listingsQuery = useListings({
    by_organization: orgId,
    by_type: activeType,
    per_page: 50,
  });

  const deleteMutation = useDeleteListing();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['listings'] });
      },
    });
  };

  const listings = listingsQuery.data?.data ?? [];
  const typeConfig = LISTING_TYPES[activeType];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Listings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage the services, materials, capacities, and products your organization offers.</p>
      </div>

      {/* Section nav + content */}
      <div className="flex gap-6">
        {/* Sidebar section nav */}
        <nav className="w-48 shrink-0">
          <ul className="space-y-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setActiveType(s.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${activeType === s.id
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {s.label}
                  {sectionCounts[s.id] != null && (
                    <span className="text-[11px] tabular-nums text-gray-400 font-normal">
                      {sectionCounts[s.id]}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {listingsQuery.isLoading ? 'Loading...' : `${listings.length} ${typeConfig?.label?.toLowerCase() ?? activeType} listing${listings.length !== 1 ? 's' : ''}`}
              </p>
              <Link
                to="/marketplace/new"
                search={{ type: activeType, from: `/${orgSlug}/listings` }}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add {typeConfig?.label?.toLowerCase() ?? activeType}
              </Link>
            </div>

            {!orgId ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : listings.length === 0 && !listingsQuery.isLoading ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
                <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                </svg>
                <p className="text-sm text-gray-400 mt-2">No {typeConfig?.label?.toLowerCase() ?? activeType} listings yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {listings.map((listing) => (
                  <ListingMiniCard key={listing.id} listing={listing} onDelete={handleDelete} orgSlug={orgSlug} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
