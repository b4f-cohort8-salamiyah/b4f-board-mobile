/**
 * The app's only configuration module and the only reader of `process.env` (docs/ARCHITECTURE.md §6).
 *
 * `EXPO_PUBLIC_*` values are compiled into the app and are public. They never hold a secret.
 * They must be read with literal dot access, or Expo does not inline them.
 */

const ABSOLUTE_HTTP_URL = /^https?:\/\/[^\s/?#]+(\/[^\s?#]*)?$/;

/**
 * Validates the backend origin: an absolute http(s) URL without a trailing slash.
 * Throws with an explanation instead of letting the app start with a broken origin.
 */
export function parseApiBaseUrl(value: string | undefined): string {
  if (!value) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is not set. Copy .env.example to .env.local.');
  }
  if (!ABSOLUTE_HTTP_URL.test(value)) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must be an absolute http(s) URL.');
  }
  if (value.endsWith('/')) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must not end with a slash.');
  }
  return value;
}

export const API_BASE_URL = parseApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
