import { useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  getPost,
  getSpace,
  togglePostLike,
  createComment,
  deleteComment,
  toggleCommentLike,
  updatePost,
} from '../../lib/community-spaces';
import type { SpacePostComment } from '../../lib/community-spaces';
import { SpaceIcon } from './spaces';
import { FormError, FieldError } from '../../components/FieldError';
import { formatDistanceToNow, getInitials } from '../../lib/utils';

function Avatar({ name, imageUrl, size = 'sm' }: { name: string; imageUrl: string | null; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'h-10 w-10' : 'h-7 w-7';
  const textCls = size === 'md' ? 'text-sm' : 'text-[10px]';
  return imageUrl ? (
    <img src={imageUrl} alt="" className={`${cls} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`${cls} rounded-full bg-gray-200 flex items-center justify-center ${textCls} font-medium text-gray-600 shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function CommentItem({
  comment,
  communitySlug,
  spaceId,
  postId,
  isAdmin,
  currentUserId,
  onReply,
}: {
  comment: SpacePostComment;
  communitySlug: string;
  spaceId: string;
  postId: string;
  isAdmin: boolean;
  currentUserId: string | undefined;
  onReply: (parentId: string) => void;
}) {
  const qc = useQueryClient();
  const queryKey = ['space_post', communitySlug, spaceId, postId];

  const likeMutation = useMutation({
    mutationFn: () => toggleCommentLike(communitySlug, spaceId, postId, comment.id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(communitySlug, spaceId, postId, comment.id),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const canDelete = isAdmin || comment.author.id === currentUserId;

  return (
    <div className="flex gap-2.5">
      <Avatar name={comment.author.name} imageUrl={comment.author.image_url} />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-900">{comment.author.name}</span>
            {comment.author.organization && (
              <span className="text-[10px] text-gray-400">{comment.author.organization.name}</span>
            )}
            <span className="text-[10px] text-gray-400">{formatDistanceToNow(comment.created_at)}</span>
          </div>
          <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-line">{comment.content}</p>
        </div>

        <div className="flex items-center gap-3 mt-1 ml-1">
          <button
            type="button"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center gap-1 text-[11px] transition-colors ${
              comment.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <svg className="h-3.5 w-3.5" fill={comment.liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
          </button>

          {!comment.parent_id && (
            <button
              type="button"
              onClick={() => onReply(comment.id)}
              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Reply
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={() => { if (confirm('Delete this comment?')) deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
              className="text-[11px] text-gray-400 hover:text-red-500 transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-100">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                communitySlug={communitySlug}
                spaceId={spaceId}
                postId={postId}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentForm({
  communitySlug,
  spaceId,
  postId,
  parentId,
  onSubmitted,
  onCancel,
  autoFocus,
}: {
  communitySlug: string;
  spaceId: string;
  postId: string;
  parentId?: string;
  onSubmitted: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [content, setContent] = useState('');

  const mutation = useMutation({
    mutationFn: () => createComment(communitySlug, spaceId, postId, {
      content,
      parent_id: parentId,
    }),
    onSuccess: () => {
      setContent('');
      onSubmitted();
    },
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (content.trim()) mutation.mutate(); }}
      className="flex gap-2"
    >
      <div className="flex-1">
        <textarea
          rows={parentId ? 1 : 2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}
          autoFocus={autoFocus}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <FieldError mutation={mutation} field="content" />
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="submit"
          disabled={mutation.isPending || !content.trim()}
          className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? '...' : 'Send'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function CommunitySpacePostPage() {
  const { orgSlug, communitySlug, spaceId, postId } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
    spaceId: string;
    postId: string;
  };
  const qc = useQueryClient();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const currentUserId = meQuery.data?.id;
  const isAdmin = meQuery.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  const spaceQuery = useQuery({
    queryKey: ['community_spaces', communitySlug, spaceId],
    queryFn: () => getSpace(communitySlug, spaceId),
  });

  const postQuery = useQuery({
    queryKey: ['space_post', communitySlug, spaceId, postId],
    queryFn: () => getPost(communitySlug, spaceId, postId),
  });

  const post = postQuery.data;
  const space = spaceQuery.data;
  const canEdit = post && (isAdmin || post.author.id === currentUserId);

  const likeMutation = useMutation({
    mutationFn: () => togglePostLike(communitySlug, spaceId, postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['space_post', communitySlug, spaceId, postId] }),
  });

  const editMutation = useMutation({
    mutationFn: () => updatePost(communitySlug, spaceId, postId, { title: editTitle, content: editContent }),
    onSuccess: () => {
      setIsEditing(false);
      qc.invalidateQueries({ queryKey: ['space_post', communitySlug, spaceId, postId] });
    },
  });

  if (postQuery.isLoading) {
    return <div className="p-6 max-w-5xl mx-auto"><p className="text-muted-foreground">Loading...</p></div>;
  }
  if (postQuery.error || !post) {
    return <div className="p-6 max-w-5xl mx-auto"><p className="text-destructive">Post not found</p></div>;
  }

  const startEditing = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setIsEditing(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/$orgSlug/communities/$communitySlug/spaces" params={{ orgSlug, communitySlug }} className="hover:text-gray-700 transition-colors">
          Spaces
        </Link>
        <span>&rsaquo;</span>
        {space && (
          <>
            <Link to="/$orgSlug/communities/$communitySlug/spaces/$spaceId" params={{ orgSlug, communitySlug, spaceId }} className="hover:text-gray-700 transition-colors flex items-center gap-1">
              <SpaceIcon icon={space.icon} className="h-3.5 w-3.5" />
              {space.name}
            </Link>
            <span>&rsaquo;</span>
          </>
        )}
        <span className="text-gray-900 truncate">{post.title}</span>
      </div>

      {/* Post */}
      <div className={`border border-border rounded-lg p-5 ${post.is_pinned ? 'bg-yellow-50/50 border-yellow-200' : 'bg-white'}`}>
        <div className="flex items-start gap-3">
          <Avatar name={post.author.name} imageUrl={post.author.image_url} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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

            {isEditing ? (
              <form
                onSubmit={(e) => { e.preventDefault(); editMutation.mutate(); }}
                className="mt-2 space-y-2"
              >
                <FormError mutation={editMutation} />
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <textarea
                  required
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={editMutation.isPending} className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-primary/90 disabled:opacity-50">
                    {editMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h1 className="text-base font-bold text-gray-900 mt-1">{post.title}</h1>
                <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">{post.content}</div>
              </>
            )}

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
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
                <span>{post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}</span>
              </button>

              <span className="text-xs text-gray-400">
                {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
              </span>

              {canEdit && !isEditing && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-auto"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Comments ({post.comments_count})
        </h3>

        <CommentForm
          communitySlug={communitySlug}
          spaceId={spaceId}
          postId={postId}
          onSubmitted={() => qc.invalidateQueries({ queryKey: ['space_post', communitySlug, spaceId, postId] })}
        />

        {post.comments && post.comments.length > 0 ? (
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  communitySlug={communitySlug}
                  spaceId={spaceId}
                  postId={postId}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                  onReply={(parentId) => setReplyTo(replyTo === parentId ? null : parentId)}
                />
                {replyTo === comment.id && (
                  <div className="ml-10 mt-2">
                    <CommentForm
                      communitySlug={communitySlug}
                      spaceId={spaceId}
                      postId={postId}
                      parentId={comment.id}
                      autoFocus
                      onSubmitted={() => {
                        setReplyTo(null);
                        qc.invalidateQueries({ queryKey: ['space_post', communitySlug, spaceId, postId] });
                      }}
                      onCancel={() => setReplyTo(null)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No comments yet. Be the first to respond!</p>
        )}
      </div>
    </div>
  );
}
