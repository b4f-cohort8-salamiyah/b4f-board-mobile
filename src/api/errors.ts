/**
 * One error type for every failed API call (docs/ARCHITECTURE.md §5).
 *
 * The backend's error body is `{ statusCode, message, error, path, timestamp }`, where `message` is
 * a string or a string array (docs/API_CONTRACT.md §1). Callers rely on `kind`, never on the
 * backend's `error` text.
 */

export type ApiErrorKind =
  | 'unauthorized' // 401: the session has ended, or the login was rejected
  | 'forbidden' // 403: not permitted
  | 'notFound' // 404: missing, or the caller is not a member
  | 'validation' // 400: the request was rejected as invalid
  | 'server' // any other failure response, including a malformed one
  | 'network'; // no response: offline, unreachable, or timed out

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** The HTTP status, or null when no response arrived. */
  readonly status: number | null;
  /** The backend's messages, always as an array. Never contains credentials. */
  readonly messages: string[];

  constructor(kind: ApiErrorKind, status: number | null, messages: string[]) {
    super(messages[0] ?? kind);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.messages = messages;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function kindForStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'validation';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'notFound';
    default:
      return 'server';
  }
}

/** Reads `message` from an error body as a string array; anything unexpected yields []. */
export function messagesFromBody(body: unknown): string[] {
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return [];
  }
  const { message } = body as { message: unknown };
  if (typeof message === 'string') {
    return [message];
  }
  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

/** Builds the error for a non-2xx response. */
export function apiErrorFromResponse(status: number, body: unknown): ApiError {
  return new ApiError(kindForStatus(status), status, messagesFromBody(body));
}

/** Builds the error for a request that got no usable response. */
export function networkError(): ApiError {
  return new ApiError('network', null, []);
}
