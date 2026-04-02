import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCommunityEvent,
  updateCommunityEvent,
  deleteCommunityEvent,
} from '../../lib/community-events';
import { uploadFile } from '../../lib/uploads';
import { FieldError, FormError } from '../../components/FieldError';

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function CommunityEventEditPage() {
  const { orgSlug, communitySlug, eventId } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
    eventId: string;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const eventQuery = useQuery({
    queryKey: ['community_events', communitySlug, eventId],
    queryFn: () => getCommunityEvent(communitySlug, eventId),
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [happensAt, setHappensAt] = useState('');
  const [online, setOnline] = useState(false);
  const [address, setAddress] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [uploading, setUploading] = useState(false);

  const event = eventQuery.data;

  if (event && !initialized) {
    setTitle(event.title || '');
    setDescription(event.description || '');
    setHappensAt(event.happens_at ? toDatetimeLocal(event.happens_at) : '');
    setOnline(event.online);
    setAddress(event.address || '');
    setOnlineUrl(event.online_url || '');
    setCurrentImageUrl(event.image_url);
    setInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      // 1. If a file was selected, upload first
      let imageUrl: string | undefined;
      if (file) {
        setUploading(true);
        imageUrl = await uploadFile(file, 'CommunityEvent', eventId);
        setUploading(false);
      }

      // 2. Update event
      return updateCommunityEvent(communitySlug, eventId, {
        title,
        description: description || undefined,
        happens_at: new Date(happensAt).toISOString(),
        online,
        address: online ? undefined : address || undefined,
        online_url: online ? onlineUrl || undefined : undefined,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_events', communitySlug] });
      queryClient.invalidateQueries({ queryKey: ['community_events', communitySlug, eventId] });
      navigate({
        to: '/$orgSlug/communities/$communitySlug/events/$eventId',
        params: { orgSlug, communitySlug, eventId },
      });
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
  }

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this event? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  }

  if (eventQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (eventQuery.error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
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

  const isPending = updateMutation.isPending || uploading;

  return (
    <div className="p-6 max-w-2xl mx-auto pb-12">
      {/* Back link */}
      <Link
        to="/$orgSlug/communities/$communitySlug/events"
        params={{ orgSlug, communitySlug }}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Events
      </Link>

      <h1 className="text-xl font-display font-bold text-gray-900 mb-6">Edit event</h1>

      <FormError mutation={updateMutation} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Event title"
          />
          <FieldError mutation={updateMutation} field="title" />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Describe the event..."
          />
          <FieldError mutation={updateMutation} field="description" />
        </div>

        {/* Date & Time */}
        <div>
          <label htmlFor="happens_at" className="block text-sm font-medium text-gray-700 mb-1">
            Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            id="happens_at"
            name="happens_at"
            type="datetime-local"
            required
            value={happensAt}
            onChange={(e) => setHappensAt(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={updateMutation} field="happens_at" />
        </div>

        {/* Online toggle */}
        <div className="flex items-center gap-3">
          <input
            id="online"
            type="checkbox"
            checked={online}
            onChange={(e) => setOnline(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-ring"
          />
          <label htmlFor="online" className="text-sm font-medium text-gray-700">
            Online event
          </label>
        </div>

        {/* Address or Online URL */}
        {online ? (
          <div>
            <label htmlFor="online_url" className="block text-sm font-medium text-gray-700 mb-1">
              Online URL <span className="text-red-500">*</span>
            </label>
            <input
              id="online_url"
              name="online_url"
              type="url"
              required
              value={onlineUrl}
              onChange={(e) => setOnlineUrl(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://meet.google.com/..."
            />
            <FieldError mutation={updateMutation} field="online_url" />
          </div>
        ) : (
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="12 Rue du Textile, Lyon"
            />
            <FieldError mutation={updateMutation} field="address" />
          </div>
        )}

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover image
          </label>
          {currentImageUrl && !file && (
            <div className="mb-3 rounded-lg overflow-hidden">
              <img
                src={currentImageUrl}
                alt="Current cover"
                className="w-full h-40 object-cover"
              />
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {currentImageUrl || file ? 'Change image' : 'Choose image'}
            </button>
            {file && (
              <span className="text-sm text-gray-500 truncate max-w-[200px]">{file.name}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isPending ? (uploading ? 'Uploading image...' : 'Saving...') : 'Save changes'}
          </button>
          <Link
            to="/$orgSlug/communities/$communitySlug/events/$eventId"
            params={{ orgSlug, communitySlug, eventId }}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Delete section */}
      <div className="mt-10 pt-6 border-t border-border">
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete event'}
        </button>
      </div>
    </div>
  );
}
