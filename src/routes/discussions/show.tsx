import { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  getPost,
  deletePost,
  togglePostLike,
  createComment,
  deleteComment,
  toggleCommentLike,
  type PostComment,
} from '../../lib/posts';
import { AuthorLine, LikeButton, PinnedBadge } from '../../components/discussions/PostBits';
import { FieldError } from '../../components/FieldError';

function CommentForm({
  postId,
  parentId,
  onDone,
  autoFocus,
}: {
  postId: string;
  parentId?: string;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (content: string) => createComment(postId, { content, parent_id: parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      onDone?.();
    },
  });

  return (
    <form
      className="flex items-start gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        mutation.mutate(String(fd.get('content') ?? ''));
        e.currentTarget.reset();
      }}
    >
      <div className="flex-1">
        <textarea
          name="content"
          rows={parentId ? 1 : 2}
          autoFocus={autoFocus}
          placeholder={parentId ? 'Reply…' : 'Add a comment…'}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="content" />
      </div>
      <button
        type="submit"
        disabled={mutation.isPending}
        className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 shrink-0"
      >
        Send
      </button>
    </form>
  );
}

function CommentItem({
  comment,
  postId,
  meId,
  isAdmin,
  depth = 0,
}: {
  comment: PostComment;
  postId: string;
  meId: string | undefined;
  isAdmin: boolean;
  depth?: number;
}) {
  const queryClient = useQueryClient();
  const [replying, setReplying] = useState(false);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['post', postId] });

  const likeMutation = useMutation({
    mutationFn: () => toggleCommentLike(postId, comment.id),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(postId, comment.id),
    onSuccess: invalidate,
  });

  const canDelete = meId === comment.author.id || isAdmin;

  return (
    <div className={depth > 0 ? 'ml-8 mt-3' : 'mt-4'}>
      <AuthorLine author={comment.author} date={comment.created_at} />
      <p className="text-sm text-gray-700 mt-1.5 ml-[42px] whitespace-pre-line">{comment.content}</p>
      <div className="flex items-center gap-3 mt-1 ml-[42px]">
        <LikeButton
          size="sm"
          liked={comment.liked}
          count={comment.likes_count}
          onToggle={() => likeMutation.mutate()}
        />
        {depth === 0 && (
          <button
            type="button"
            onClick={() => setReplying(!replying)}
            className="text-xs text-gray-400 hover:text-gray-700"
          >
            Reply
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Delete this comment?')) deleteMutation.mutate();
            }}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            Delete
          </button>
        )}
      </div>
      {replying && (
        <div className="ml-[42px] mt-2">
          <CommentForm postId={postId} parentId={comment.id} autoFocus onDone={() => setReplying(false)} />
        </div>
      )}
      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          meId={meId}
          isAdmin={isAdmin}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export function DiscussionShowPage() {
  const { postId } = useParams({ strict: false }) as { postId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const postQuery = useQuery({ queryKey: ['post', postId], queryFn: () => getPost(postId) });

  const likeMutation = useMutation({
    mutationFn: () => togglePostLike(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['post', postId] }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate({ to: '/discussions' });
    },
  });

  if (postQuery.isLoading) return <div className="p-6 text-gray-500">Loading…</div>;
  const post = postQuery.data;
  if (!post) return <div className="p-6 text-gray-500">Discussion not found.</div>;

  const me = meQuery.data;
  const isAdmin = me?.role === 'admin';
  const canDelete = me?.id === post.author.id || isAdmin;

  return (
    <div className="max-w-2xl mx-auto p-6 pb-12">
      <Link to="/discussions" className="text-sm text-gray-500 hover:text-gray-700">
        &larr; Discussions
      </Link>

      <article className="bg-white border border-border rounded-lg p-5 mt-3">
        <div className="flex items-start justify-between gap-3">
          <AuthorLine author={post.author} date={post.created_at} />
          <div className="flex items-center gap-3">
            {post.is_pinned && <PinnedBadge />}
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete this discussion?')) deleteMutation.mutate();
                }}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <h1 className="text-xl font-display font-bold text-gray-900 mt-3">{post.title}</h1>
        <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{post.content}</p>
        <div className="mt-4 pt-3 border-t border-border">
          <LikeButton liked={post.liked} count={post.likes_count} onToggle={() => likeMutation.mutate()} />
        </div>
      </article>

      <section className="mt-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Comments {post.comments_count > 0 && `(${post.comments_count})`}
        </h2>
        <div className="mt-3">
          <CommentForm postId={postId} />
        </div>
        {(post.comments ?? []).map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            meId={me?.id}
            isAdmin={isAdmin}
          />
        ))}
      </section>
    </div>
  );
}
