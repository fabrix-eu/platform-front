import { useState, useRef } from 'react';
import {
  LISTING_SUBCATEGORIES,
  getCategoriesForType,
} from '../lib/listings';
import type { ListingImage } from '../lib/listings';
import { FieldError } from './FieldError';
import type { UseMutationResult } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMutation = UseMutationResult<any, Error, any, any>;

interface ListingFormProps {
  listingType: string;
  mutation: AnyMutation;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (data: { category: string; subcategory?: string; title: string; description: string }) => void;
  onCancel: () => void;
  // Initial values (for edit)
  initialCategory?: string;
  initialSubcategory?: string;
  initialTitle?: string;
  initialDescription?: string;
  // Existing images (for edit)
  existingImages?: ListingImage[];
  onAddFiles?: (files: File[]) => void;
  onRemoveImage?: (image: ListingImage) => void;
  removingImage?: boolean;
  // New files (for create)
  newFiles?: File[];
  onNewFilesChange?: (files: File[]) => void;
  uploadingImages?: boolean;
}

export function ListingForm({
  listingType,
  mutation,
  isPending,
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
  initialCategory = '',
  initialSubcategory = '',
  initialTitle = '',
  initialDescription = '',
  existingImages,
  onAddFiles,
  onRemoveImage,
  removingImage,
  newFiles,
  onNewFilesChange,
  uploadingImages,
}: ListingFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState(initialSubcategory);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ category, subcategory: subcategory || undefined, title, description });
  }

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (onNewFilesChange && newFiles) {
      onNewFilesChange([...newFiles, ...selected]);
    } else if (onAddFiles) {
      onAddFiles(selected);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setSubcategory(''); }}
          required
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
        >
          <option value="">Select a category</option>
          {getCategoriesForType(listingType).map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <FieldError mutation={mutation} field="category" />
      </div>

      {/* Subcategory */}
      {category && LISTING_SUBCATEGORIES[category] && (
        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
            Subcategory
          </label>
          <select
            id="subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
          >
            <option value="">All / General</option>
            {Object.entries(LISTING_SUBCATEGORIES[category]).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
          <FieldError mutation={mutation} field="subcategory" />
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g. Organic cotton yarn — 500kg available"
        />
        <FieldError mutation={mutation} field="title" />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          placeholder="Describe what you're offering or looking for..."
        />
        <FieldError mutation={mutation} field="description" />
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>

        {/* Existing images (edit mode) */}
        {existingImages && existingImages.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.image_file_url}
                  alt=""
                  className="w-20 h-20 rounded-md object-cover border border-border"
                />
                {onRemoveImage && (
                  <button
                    type="button"
                    onClick={() => onRemoveImage(img)}
                    disabled={removingImage}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New files preview (create mode) */}
        {newFiles && newFiles.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {newFiles.map((file, i) => (
              <div key={i} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-20 h-20 rounded-md object-cover border border-border"
                />
                {onNewFilesChange && (
                  <button
                    type="button"
                    onClick={() => onNewFilesChange(newFiles.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImages}
          className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {uploadingImages ? 'Uploading...' : 'Add images'}
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
