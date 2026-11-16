/**
 * The app's only network boundary (docs/ARCHITECTURE.md §4).
 *
 * - The only `fetch` call and the only importer of `src/config/env.ts`.
 * - Adds the Bearer header through a token getter registered by the session owner, so this layer
 *   never touches credential storage.
 * - Reports every 401 on an authenticated request to the session owner (docs/ARCHITECTURE.md §8).
 *
 * Nothing here logs requests, headers, or bodies.
 */
import { API_BASE_URL } from '@/config/env';

import { ApiError, apiErrorFromResponse, networkError } from './errors';

const REQUEST_TIMEOUT_MS = 15_000;

type AuthHooks = {
  /** Returns the current access token, or null when signed out. */
  getToken: () => string | null;
  /** Called after a 401 with the token that request used. */
  onUnauthorized: (rejectedToken: string) => void;
};

let authHooks: AuthHooks = {
  getToken: () => null,
  onUnauthorized: () => {},
};

/** Registered once by the session owner. */
export function configureAuth(hooks: AuthHooks): void {
  authHooks = hooks;
}

type RequestOptions = {
  body?: unknown;
  /** Whether to send the Bearer token. Defaults to true. */
  authenticated?: boolean;
};

export async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  { body, authenticated = true }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = authenticated ? authHooks.getToken() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw networkError();
  } finally {
    clearTimeout(timeout);
  }

  const payload = await readJson(response);

  if (!response.ok) {
    if (response.status === 401 && token) {
      authHooks.onUnauthorized(token);
    }
    throw apiErrorFromResponse(response.status, payload);
  }

  if (payload === undefined) {
    // A success response that is not JSON breaks the documented contract.
    throw new ApiError('server', response.status, []);
  }
  return payload as T;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
