const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether a route param can be an issue id. `GET /issues/:id` only accepts UUIDs
 * (API_CONTRACT.md §6), so anything else is treated as not found without sending a request.
 */
export function isIssueId(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}
