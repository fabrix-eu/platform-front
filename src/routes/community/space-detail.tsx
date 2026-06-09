import { useState } from 'react';
import { useParams, Link, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  getSpace,
  getPosts,
  createPost,
  deletePost,
  togglePostLike,
  togglePostPin,
} from '../../lib/community-spaces';
import type { SpacePost } from '../../lib/community-spaces';
import { SpaceIcon } from './spaces';
import { FormError, FieldError } from '../../components/FieldError';
import { formatDistanceToNow, getInitials } from '../../lib/utils';

function AuthorAvatar({ author }: { author: SpacePost['author'] }) {
  return author.image_url ? (
    <img src={author.image_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
  ) : (
    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
      {getInitials(author.name)}
    </div>
  );
}

function PostCard({
  post,
  communitySlug,
  spaceId,
  orgSlug,
  isAdmin,
  currentUserId,
}: {
  post: SpacePost;
  communitySlug: string;
  spaceId: string;
  orgSlug: string;
  isAdmin: boolean;
  currentUserId: string | undefined;
}) {
  const qc = useQueryClient();
  const queryKey = ['space_posts', communitySlug, spaceId];

  const likeMutation = useMutation({
    mutationFn: () => togglePostLike(communitySlug, spaceId, post.id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const pinMutation = useMutation({
    mutationFn: () => togglePostPin(communitySlug, spaceId, post.id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(communitySlug, spaceId, post.id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const canDelete = isAdmin || post.author.id === currentUserId;

  return (
    <div className={`border border-border rounded-lg p-4 ${post.is_pinned ? 'bg-yellow-50/50 border-yellow-200' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        <AuthorAvatar author={post.author} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{post.author.name}</span>
            {post.author.organization && (
              <span className="text-xs text-gray-400">{post.author.organization.name}</span>
            )}
            <span className="text-xs text-gray-400">&middot;</span>
            <span className="text-xs text-gray-400">{formatDistanceToNow(post.created_at)}</span>
            {post.is_pinned && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">Pinned</span>
            )}
          </div>

          <Link
            to="/$orgSlug/communities/$communitySlug/spaces/$spaceId/posts/$postId"
            params={{ orgSlug, communitySlug, spaceId, postId: post.id }}
            className="block mt-1"
          >
            <h3 className="text-sm font-semibold text-gray-900 hover:text-primary transition-colors">
              {post.title}
            </h3>
            {post.content && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-3 whitespace-pre-line">
                {post.content}
              </p>
            )}
          </Link>

          <div className="flex items-center gap-4 mt-3">
            <button
              type="button"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-1 text-xs transition-colors ${
                post.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <svg className="h-4 w-4" fill={post.liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              {post.likes_count > 0 && <span>{post.likes_count}</span>}
            </button>

            <Link
              to="/$orgSlug/communities/$communitySlug/spaces/$spaceId/posts/$postId"
              params={{ orgSlug, communitySlug, spaceId, postId: post.id }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
              </svg>
              {post.comments_count > 0 && <span>{post.comments_count}</span>}
            </Link>

            {isAdmin && (
              <button
                type="button"
                onClick={() => pinMutation.mutate()}
                disabled={pinMutation.isPending}
                className={`text-xs transition-colors ${post.is_pinned ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`}
                title={post.is_pinned ? 'Unpin' : 'Pin'}
              >
                <svg className="h-4 w-4" fill={post.is_pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75h1.5m9 0h-9" />
                </svg>
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => { if (confirm('Delete this post?')) deleteMutation.mutate(); }}
                disabled={deleteMutation.isPending}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NewPostForm({
  communitySlug,
  spaceId,
  onCreated,
}: {
  communitySlug: string;
  spaceId: string;
  onCreated: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const mutation = useMutation({
    mutationFn: () => createPost(communitySlug, spaceId, { title, content }),
    onSuccess: () => {
      setTitle('');
      setContent('');
      setIsOpen(false);
      onCreated();
    },
  });

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full border border-dashed border-gray-300 rounded-lg p-3 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors text-left"
      >
        Start a discussion...
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="border border-border rounded-lg p-4 space-y-3 bg-white"
    >
      <FormError mutation={mutation} />

      <input
        type="text"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        autoFocus
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <FieldError mutation={mutation} field="title" />

      <textarea
        required
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What do you want to discuss?"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
      />
      <FieldError mutation={mutation} field="content" />

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}

export function CommunitySpaceDetailPage() {
  const { orgSlug, communitySlug, spaceId } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
    spaceId: string;
  };
  const searchParams = useSearch({ strict: false }) as { page?: number };
  const navigate = useNavigate();
  const qc = useQueryClient();

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const currentUserId = meQuery.data?.id;
  const isAdmin = meQuery.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  const spaceQuery = useQuery({
    queryKey: ['community_spaces', communitySlug, spaceId],
    queryFn: () => getSpace(communitySlug, spaceId),
  });

  const postsQuery = useQuery({
    queryKey: ['space_posts', communitySlug, spaceId, { page: searchParams.page }],
    queryFn: () => getPosts(communitySlug, spaceId, { page: searchParams.page || 1, per_page: 20 }),
  });

  const space = spaceQuery.data;
  const postsData = postsQuery.data;
  const posts = postsData?.data ?? [];
  const meta = postsData?.meta;

  const setPage = (p: number) => {
    navigate({
      to: '/$orgSlug/communities/$communitySlug/spaces/$spaceId',
      params: { orgSlug, communitySlug, spaceId },
      search: p > 1 ? { page: p } : {},
    });
  };

  if (spaceQuery.isLoading) {
    return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>;
  }
  if (spaceQuery.error) {
    return <div className="p-6"><p className="text-destructive">Space not found</p></div>;
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          to="/$orgSlug/communities/$communitySlug/spaces"
          params={{ orgSlug, communitySlug }}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; All spaces
        </Link>
        {space && (
          <div className="flex items-center gap-3 mt-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <SpaceIcon icon={space.icon} />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-gray-900">{space.name}</h2>
              {space.description && (
                <p className="text-sm text-gray-500">{space.description}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New post */}
      <NewPostForm
        communitySlug={communitySlug}
        spaceId={spaceId}
        onCreated={() => qc.invalidateQueries({ queryKey: ['space_posts', communitySlug, spaceId] })}
      />

      {/* Posts */}
      {postsQuery.isLoading && <p className="text-muted-foreground">Loading posts...</p>}
      {postsQuery.error && <p className="text-destructive">Failed to load posts</p>}

      {postsQuery.data && posts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No posts yet. Start the first discussion!</p>
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            communitySlug={communitySlug}
            spaceId={spaceId}
            orgSlug={orgSlug}
            isAdmin={isAdmin}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {/* Pagination */}
      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {meta.prev_page && (
            <button onClick={() => setPage(meta.prev_page!)} className="text-sm text-muted-foreground hover:text-foreground">
              &larr; Previous
            </button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.total_pages}
          </span>
          {meta.next_page && (
            <button onClick={() => setPage(meta.next_page!)} className="text-sm text-muted-foreground hover:text-foreground">
              Next &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
