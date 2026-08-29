import { api, BASE } from './api';

export interface PostAuthor {
  id: string;
  name: string;
  image_url: string | null;
  role: string;
  organization: { id: string; name: string } | null;
}

export interface PostComment {
  id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author: PostAuthor;
  likes_count: number;
  liked: boolean;
  replies: PostComment[];
}

export interface Post {
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
  comments?: PostComment[];
}

export interface PaginatedPosts {
  data: Post[];
  meta: {
    current_page: number;
    total_pages: number;
    next_page: number | null;
    prev_page: number | null;
    total_count: number;
  };
}

export async function getPosts(
  params: { search?: string; page?: number; per_page?: number } = {},
): Promise<PaginatedPosts> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));

  // Keep the { data, meta } envelope (api.get unwraps data)
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/posts?${qs}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function getPost(id: string) {
  return api.get<Post>(`/posts/${id}`);
}

export function createPost(payload: { title: string; content: string }) {
  return api.post<Post>('/posts', { post: payload });
}

export function updatePost(id: string, payload: { title?: string; content?: string }) {
  return api.patch<Post>(`/posts/${id}`, { post: payload });
}

export function deletePost(id: string) {
  return api.delete(`/posts/${id}`);
}

export function togglePostLike(id: string) {
  return api.post<{ liked: boolean; likes_count: number }>(`/posts/${id}/toggle_like`, {});
}

export function createComment(postId: string, payload: { content: string; parent_id?: string }) {
  return api.post<PostComment>(`/posts/${postId}/comments`, { comment: payload });
}

export function deleteComment(postId: string, commentId: string) {
  return api.delete(`/posts/${postId}/comments/${commentId}`);
}

export function toggleCommentLike(postId: string, commentId: string) {
  return api.post<{ liked: boolean; likes_count: number }>(
    `/posts/${postId}/comments/${commentId}/toggle_like`,
    {},
  );
}
