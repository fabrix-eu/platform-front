import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  useCreateListing,
  addListingImage,
  LISTING_TYPES,
} from '../../lib/listings';
import { uploadFile } from '../../lib/uploads';
import { FormError } from '../../components/FieldError';
import { ListingForm } from '../../components/ListingForm';

export function MarketplaceNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { type: prefilledType, from } = useSearch({ strict: false }) as { type?: string; from?: string };

  const [listingType, setListingType] = useState(prefilledType || '');
  const [organizationId, setOrganizationId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const createMutation = useCreateListing();

  // Set default org on load
  const orgs = me.data?.organizations ?? [];
  if (orgs.length > 0 && !organizationId) {
    setOrganizationId(orgs[0].organization_id);
  }

  const backTo = from || '/marketplace';
  const typeLabel = LISTING_TYPES[listingType]?.label?.toLowerCase() ?? 'listing';
  const isPending = createMutation.isPending || uploading;

  return (
    <div className="max-w-2xl mx-auto p-6 pb-12">
      <Link to={backTo} className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        &larr; {from ? 'Back' : 'Marketplace'}
      </Link>

      <h1 className="text-xl font-display font-bold text-gray-900 mb-6">
        Create {prefilledType ? typeLabel : 'listing'}
      </h1>

      <FormError mutation={createMutation} />

      {/* Organization (if multiple) */}
      {orgs.length > 1 && (
        <div className="mb-5">
          <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700 mb-1">
            Organization <span className="text-red-500">*</span>
          </label>
          <select
            id="organization_id"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
          >
            {orgs.map((o) => (
              <option key={o.organization_id} value={o.organization_id}>
                {o.organization_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Type selector (only when not pre-filled) */}
      {!prefilledType && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(LISTING_TYPES).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setListingType(key)}
                className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                  listingType === key
                    ? `${config.badgeColor} border-current`
                    : 'border-border text-gray-500 hover:bg-gray-50'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form fields (shown once type is selected) */}
      {listingType && (
        <ListingForm
          listingType={listingType}
          mutation={createMutation}
          isPending={isPending}
          submitLabel={`Create ${typeLabel}`}
          pendingLabel={uploading ? 'Uploading images...' : 'Creating...'}
          newFiles={files}
          onNewFilesChange={setFiles}
          onCancel={() => navigate({ to: backTo })}
          onSubmit={(data) => {
            createMutation.mutate(
              {
                organization_id: organizationId,
                listing_type: listingType,
                ...data,
              },
              {
                onSuccess: async (listing) => {
                  if (files.length > 0) {
                    setUploading(true);
                    for (const file of files) {
                      try {
                        const imageUrl = await uploadFile(file, 'Listing', listing.id);
                        await addListingImage(listing.id, imageUrl);
                      } catch { /* continue */ }
                    }
                    setUploading(false);
                  }
                  queryClient.invalidateQueries({ queryKey: ['listings'] });
                  navigate({ to: from || `/marketplace/${listing.id}` });
                },
              },
            );
          }}
        />
      )}
    </div>
  );
}
