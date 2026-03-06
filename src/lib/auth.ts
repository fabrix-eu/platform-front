import { api } from './api';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const tokens = await api.post<AuthTokens>('/auth_tokens', { email, password });
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
  return tokens;
}

export async function logout(): Promise<void> {
  try {
    await api.delete('/auth_tokens');
  } catch {
    // ignore
  }
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export async function getMe(): Promise<User> {
  return api.get<User>('/me');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}
