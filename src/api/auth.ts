import { request } from './client';
import type { CurrentUser, LoginResponse } from './types';

/** `POST /auth/login`. A 401 means the email or password was wrong. */
export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('POST', '/auth/login', {
    body: { email, password },
    authenticated: false,
  });
}

/** `GET /auth/me`. Confirms that the current token is still accepted. */
export function getCurrentUser(): Promise<CurrentUser> {
  return request<CurrentUser>('GET', '/auth/me');
}
