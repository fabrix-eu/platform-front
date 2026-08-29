import { useRef } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Search } from 'lucide-react';
import { getPosts, createPost, togglePostLike, type Post } from '../../lib/posts';
import { AuthorLine, LikeButton, PinnedBadge } from '../../components/discussions/PostBits';
import { FieldError } from '../../components/FieldError';
import { InfiniteScrollSentinel } from '../../components/explore/ExploreShell';

function PostCard({ post, onToggleLike }: { post: Post; onToggleLike: (id: string) => void }) {
  return (
    <Link
      to="/discussions/$postId"
      params={{ postId: post.id }}
      className="block bg-white border border-border rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <AuthorLine author={post.author} date={post.created_at} />
        {post.is_pinned && <PinnedBadge />}
      </div>
      <h3 className="font-display font-semibold text-gray-900 mt-3">{post.title}</h3>
      <p className="text-sm text-gray-600 mt-1 line-clamp-3 whitespace-pre-line">{post.content}</p>
      <div className="flex items-center gap-4 mt-3">
        <LikeButton liked={post.liked} count={post.likes_count} onToggle={() => onToggleLike(post.id)} />
        <span className="inline-flex items-center gap-1 text-sm text-gray-400">
          <MessageSquare className="h-4 w-4" />
          {post.comments_count > 0 && <span className="tabular-nums">{post.comments_count}</span>}
        </span>
      </div>
    </Link>
  );
}

export function DiscussionsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { search, compose } = useSearch({ strict: false }) as { search?: string; compose?: boolean };
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const listQuery = useInfiniteQuery({
    queryKey: ['posts', search ?? ''],
    queryFn: ({ pageParam }) => getPosts({ search, page: pageParam, per_page: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.meta.next_page ?? undefined,
  });

  const createMutation = useMutation({
    mutationFn: createPost,
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate({ to: '/discussions/$postId', params: { postId: post.id } });
    },
  });

  const likeMutation = useMutation({
    mutationFn: togglePostLike,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  const posts = listQuery.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="max-w-2xl mx-auto p-6 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Discussions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Open conversations across the whole network.</p>
        </div>
        {!compose && (
          <button
            type="button"
            onClick={() => navigate({ to: '/discussions', search: { search, compose: true } })}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
          >
            + New post
          </button>
        )}
      </div>

      {compose && (
        <form
          className="bg-white border border-border rounded-lg p-4 mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            createMutation.mutate({
              title: String(fd.get('title') ?? ''),
              content: String(fd.get('content') ?? ''),
            });
          }}
        >
          <input
            name="title"
            placeholder="Title"
            autoFocus
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={createMutation} field="title" />
          <textarea
            name="content"
            rows={4}
            placeholder="What do you want to discuss?"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={createMutation} field="content" />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: '/discussions', search: { search } })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </form>
      )}

      <div className="relative mt-4">
        <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          defaultValue={search}
          placeholder="Search discussions..."
          onChange={(e) => {
            const value = e.target.value;
            if (searchTimer.current) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => {
              navigate({ to: '/discussions', search: { search: value || undefined, compose } });
            }, 350);
          }}
          className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-3 mt-4">
        {listQuery.isLoading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {search ? 'No discussions match your search.' : 'No discussions yet — start the first one!'}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onToggleLike={(id) => likeMutation.mutate(id)} />
          ))
        )}
      </div>

      <InfiniteScrollSentinel
        hasNextPage={listQuery.hasNextPage ?? false}
        isFetchingNextPage={listQuery.isFetchingNextPage}
        fetchNextPage={listQuery.fetchNextPage}
      />
    </div>
  );
}
