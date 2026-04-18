import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearch } from '@tanstack/react-router';
import {
  useListing,
  useUpdateListing,
  useAddListingImage,
  useRemoveListingImage,
  LISTING_TYPES,
} from '../../lib/listings';
import { uploadFile } from '../../lib/uploads';
import { FormError } from '../../components/FieldError';
import { ListingForm } from '../../components/ListingForm';
import type { ListingImage } from '../../lib/listings';

export function MarketplaceEditPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { from } = useSearch({ strict: false }) as { from?: string };
  const navigate = useNavigate();

  const listingQuery = useListing(id);
  const updateMutation = useUpdateListing();
  const addImageMutation = useAddListingImage();
  const removeImageMutation = useRemoveListingImage();

  const [uploading, setUploading] = useState(false);
  const [ready, setReady] = useState(false);

  const listing = listingQuery.data;

  // Wait for listing to load before rendering form (so initial values are set)
  useEffect(() => {
    if (listing && !ready) setReady(true);
  }, [listing, ready]);

  if (listingQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-destructive">Listing not found</p>
      </div>
    );
  }

  const typeLabel = LISTING_TYPES[listing.listing_type]?.label?.toLowerCase() ?? 'listing';
  const backTo = from || `/marketplace/${id}`;

  async function handleAddFiles(files: File[]) {
    setUploading(true);
    for (const file of files) {
      try {
        const imageUrl = await uploadFile(file, 'Listing', id);
        await addImageMutation.mutateAsync({ listingId: id, imageFileUrl: imageUrl });
      } catch { /* continue */ }
    }
    setUploading(false);
  }

  function handleRemoveImage(image: ListingImage) {
    removeImageMutation.mutate({ listingId: id, imageId: image.id });
  }

  return (
    <div className="max-w-2xl mx-auto p-6 pb-12">
      <Link to={backTo} className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        &larr; {from ? 'Back' : 'Back to listing'}
      </Link>

      <h1 className="text-xl font-display font-bold text-gray-900 mb-6">Edit {typeLabel}</h1>

      <FormError mutation={updateMutation} />

      {ready && (
        <ListingForm
          listingType={listing.listing_type}
          mutation={updateMutation}
          isPending={updateMutation.isPending}
          submitLabel="Save changes"
          pendingLabel="Saving..."
          initialCategory={listing.category}
          initialSubcategory={listing.subcategory || ''}
          initialTitle={listing.title}
          initialDescription={listing.description}
          existingImages={listing.images ?? []}
          onAddFiles={handleAddFiles}
          onRemoveImage={handleRemoveImage}
          removingImage={removeImageMutation.isPending}
          uploadingImages={uploading}
          onCancel={() => navigate({ to: backTo })}
          onSubmit={(data) => {
            updateMutation.mutate(
              { id, payload: data },
              {
                onSuccess: () => navigate({ to: backTo }),
              },
            );
          }}
        />
      )}
    </div>
  );
}
