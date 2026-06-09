import { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { useMarkRead } from '../../lib/useMarkRead';
import { getSpaces, createSpace } from '../../lib/community-spaces';
import type { CommunitySpace } from '../../lib/community-spaces';
import { FormError, FieldError } from '../../components/FieldError';

const SPACE_ICONS: Record<string, string> = {
  MessageSquare: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  Users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  Lightbulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z',
  Sparkles: 'M12 3l1.912 5.813L20 10l-6.088 1.187L12 17l-1.912-5.813L4 10l6.088-1.187z',
  Heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  Star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  Zap: 'M13 2L3 14h9l-1 10 10-12h-9l1-10z',
  Target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  Globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  Megaphone: 'M3 11l18-5v12L3 13v-2zM11.6 16.8a3 3 0 1 1-5.8-1.6',
};

const ICON_OPTIONS = Object.keys(SPACE_ICONS);

function SpaceIcon({ icon, className }: { icon: string; className?: string }) {
  const path = SPACE_ICONS[icon] || SPACE_ICONS.MessageSquare;
  return (
    <svg className={className || 'h-5 w-5'} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function CreateSpaceModal({
  communitySlug,
  onClose,
  onCreated,
}: {
  communitySlug: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('MessageSquare');

  const mutation = useMutation({
    mutationFn: () => createSpace(communitySlug, { name, description: description || undefined, icon }),
    onSuccess: () => {
      onCreated();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl border border-border w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-base font-bold text-gray-900">Create a space</h3>
          <p className="text-sm text-gray-500 mt-0.5">Spaces are discussion channels for your community</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <FormError mutation={mutation} />

          <div>
            <label htmlFor="space-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              id="space-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. General, Ideas, Supply Chain..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <FieldError mutation={mutation} field="name" />
          </div>

          <div>
            <label htmlFor="space-desc" className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              id="space-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this space about?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={`p-2 rounded-lg transition-colors ${
                    icon === key
                      ? 'bg-primary/10 text-primary ring-2 ring-primary/30'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <SpaceIcon icon={key} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {mutation.isPending ? 'Creating...' : 'Create space'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SpaceCard({ space, orgSlug, communitySlug }: { space: CommunitySpace; orgSlug: string; communitySlug: string }) {
  return (
    <Link
      to="/$orgSlug/communities/$communitySlug/spaces/$spaceId"
      params={{ orgSlug, communitySlug, spaceId: space.id }}
      className="block border border-border rounded-lg p-4 hover:bg-gray-50 transition-colors group"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <SpaceIcon icon={space.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 group-hover:text-primary transition-colors">
            {space.name}
          </h3>
          {space.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{space.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>{space.posts_count} {space.posts_count === 1 ? 'post' : 'posts'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export { SpaceIcon };

export function CommunitySpacesPage() {
  const { orgSlug, communitySlug } = useParams({ strict: false }) as { orgSlug: string; communitySlug: string };
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  useMarkRead(communitySlug, 'spaces');

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = meQuery.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  const spacesQuery = useQuery({
    queryKey: ['community_spaces', communitySlug],
    queryFn: () => getSpaces(communitySlug),
  });

  const spaces = spacesQuery.data ?? [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-gray-900">Spaces</h2>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            New space
          </button>
        )}
      </div>

      {spacesQuery.isLoading && <p className="text-muted-foreground">Loading...</p>}
      {spacesQuery.error && <p className="text-destructive">Failed to load spaces</p>}

      {spacesQuery.data && spaces.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 mt-3">No spaces yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? 'Create the first space to start discussions.' : 'No discussion spaces have been created yet.'}
          </p>
        </div>
      )}

      {spaces.length > 0 && (
        <div className="grid gap-3">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} orgSlug={orgSlug} communitySlug={communitySlug} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateSpaceModal
          communitySlug={communitySlug}
          onClose={() => setShowCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['community_spaces', communitySlug] })}
        />
      )}
    </div>
  );
}
