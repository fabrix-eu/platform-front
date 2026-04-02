import { useState, useRef } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCommunityEvent, updateCommunityEvent } from '../../lib/community-events';
import { uploadFile } from '../../lib/uploads';
import { FieldError, FormError } from '../../components/FieldError';

export function CommunityEventNewPage() {
  const { orgSlug, communitySlug } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [happensAt, setHappensAt] = useState('');
  const [online, setOnline] = useState(false);
  const [address, setAddress] = useState('');
  const [onlineUrl, setOnlineUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Create the event
      const event = await createCommunityEvent(communitySlug, {
        title,
        description: description || undefined,
        happens_at: new Date(happensAt).toISOString(),
        online,
        address: online ? undefined : address || undefined,
        online_url: online ? onlineUrl || undefined : undefined,
      });

      // 2. If a file was selected, upload then patch
      if (file) {
        setUploading(true);
        const imageUrl = await uploadFile(file, 'CommunityEvent', event.id);
        await updateCommunityEvent(communitySlug, event.id, { image_url: imageUrl });
        setUploading(false);
      }

      return event;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['community_events', communitySlug] });
      navigate({
        to: '/$orgSlug/communities/$communitySlug/events/$eventId',
        params: { orgSlug, communitySlug, eventId: event.id },
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
  }

  const isPending = mutation.isPending || uploading;

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

      <h1 className="text-xl font-display font-bold text-gray-900 mb-6">Create event</h1>

      <FormError mutation={mutation} />

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
          <FieldError mutation={mutation} field="title" />
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
          <FieldError mutation={mutation} field="description" />
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
          <FieldError mutation={mutation} field="happens_at" />
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
            <FieldError mutation={mutation} field="online_url" />
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
            <FieldError mutation={mutation} field="address" />
          </div>
        )}

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover image
          </label>
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
              {file ? 'Change image' : 'Choose image'}
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
            {isPending ? (uploading ? 'Uploading image...' : 'Creating...') : 'Create event'}
          </button>
          <Link
            to="/$orgSlug/communities/$communitySlug/events"
            params={{ orgSlug, communitySlug }}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
