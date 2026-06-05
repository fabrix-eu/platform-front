import { api, BASE } from './api';

// ── Types ────────────────────────────────────────────────────

export interface PostAuthor {
  id: string;
  name: string;
  image_url: string | null;
  role: string;
  organization: { id: string; name: string } | null;
}

export interface CommunitySpace {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
  posts_count: number;
  members_count: number;
  created_by: { id: string; name: string; image_url: string | null };
}

export interface SpacePostComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: PostAuthor;
  parent_id: string | null;
  likes_count: number;
  liked: boolean;
  replies: SpacePostComment[];
}

export interface SpacePost {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author: PostAuthor;
  likes_count: number;
  comments_count: number;
  liked: boolean;
  comments?: SpacePostComment[];
  space?: { id: string; name: string; icon: string };
}

interface PaginatedMeta {
  total_pages: number;
  current_page: number;
  next_page: number | null;
  prev_page: number | null;
  total_count: number;
}

// ── Spaces ───────────────────────────────────────────────────

const spacesPath = (communityId: string) =>
  `/communities/${communityId}/community_spaces`;

export function getSpaces(communityId: string) {
  return api.get<CommunitySpace[]>(spacesPath(communityId));
}

export function getSpace(communityId: string, spaceId: string) {
  return api.get<CommunitySpace>(`${spacesPath(communityId)}/${spaceId}`);
}

export function createSpace(communityId: string, data: { name: string; description?: string; icon?: string }) {
  return api.post<CommunitySpace>(spacesPath(communityId), data);
}

export function updateSpace(communityId: string, spaceId: string, data: { name?: string; description?: string; icon?: string }) {
  return api.patch<CommunitySpace>(`${spacesPath(communityId)}/${spaceId}`, data);
}

export function deleteSpace(communityId: string, spaceId: string) {
  return api.delete<CommunitySpace>(`${spacesPath(communityId)}/${spaceId}`);
}

// ── Posts ─────────────────────────────────────────────────────

const postsPath = (communityId: string, spaceId: string) =>
  `${spacesPath(communityId)}/${spaceId}/space_posts`;

export async function getPosts(communityId: string, spaceId: string, params?: { page?: number; per_page?: number }): Promise<{ data: SpacePost[]; meta: PaginatedMeta }> {
  const qp = new URLSearchParams();
  if (params?.page) qp.set('page', String(params.page));
  if (params?.per_page) qp.set('per_page', String(params.per_page));
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}${postsPath(communityId, spaceId)}?${qp}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error('Failed to load posts');
  return res.json();
}

export function getPost(communityId: string, spaceId: string, postId: string) {
  return api.get<SpacePost>(`${postsPath(communityId, spaceId)}/${postId}`);
}

export function createPost(communityId: string, spaceId: string, data: { title: string; content: string }) {
  return api.post<SpacePost>(postsPath(communityId, spaceId), data);
}

export function updatePost(communityId: string, spaceId: string, postId: string, data: { title?: string; content?: string }) {
  return api.patch<SpacePost>(`${postsPath(communityId, spaceId)}/${postId}`, data);
}

export function deletePost(communityId: string, spaceId: string, postId: string) {
  return api.delete<SpacePost>(`${postsPath(communityId, spaceId)}/${postId}`);
}

export function togglePostLike(communityId: string, spaceId: string, postId: string) {
  return api.post<{ liked: boolean; likes_count: number }>(
    `${postsPath(communityId, spaceId)}/${postId}/toggle_like`,
    {},
  );
}

export function togglePostPin(communityId: string, spaceId: string, postId: string) {
  return api.post<SpacePost>(
    `${postsPath(communityId, spaceId)}/${postId}/toggle_pin`,
    {},
  );
}

// ── Comments ─────────────────────────────────────────────────

const commentsPath = (communityId: string, spaceId: string, postId: string) =>
  `${postsPath(communityId, spaceId)}/${postId}/space_post_comments`;

export function getComments(communityId: string, spaceId: string, postId: string) {
  return api.get<SpacePostComment[]>(commentsPath(communityId, spaceId, postId));
}

export function createComment(communityId: string, spaceId: string, postId: string, data: { content: string; parent_id?: string }) {
  return api.post<SpacePostComment>(commentsPath(communityId, spaceId, postId), data);
}

export function updateComment(communityId: string, spaceId: string, postId: string, commentId: string, data: { content: string }) {
  return api.patch<SpacePostComment>(`${commentsPath(communityId, spaceId, postId)}/${commentId}`, data);
}

export function deleteComment(communityId: string, spaceId: string, postId: string, commentId: string) {
  return api.delete<SpacePostComment>(`${commentsPath(communityId, spaceId, postId)}/${commentId}`);
}

export function toggleCommentLike(communityId: string, spaceId: string, postId: string, commentId: string) {
  return api.post<{ liked: boolean; likes_count: number }>(
    `${commentsPath(communityId, spaceId, postId)}/${commentId}/toggle_like`,
    {},
  );
}

// ── Recent posts feed ────────────────────────────────────────

export function getRecentPosts(communityId: string) {
  return api.get<SpacePost[]>(`/communities/${communityId}/recent_posts`);
}
