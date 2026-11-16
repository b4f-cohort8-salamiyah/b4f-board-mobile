import { request } from './client';
import type { IssueDetail, MyIssue } from './types';

/** `GET /users/me/issues`: the caller's assigned issues, newest `updatedAt` first, unpaginated. */
export function getMyIssues(): Promise<MyIssue[]> {
  return request<MyIssue[]>('GET', '/users/me/issues');
}

/**
 * `GET /issues/:id`. Both "Issue not found" and "Workspace not found" arrive as a notFound error.
 * The id must already be a valid UUID; see src/features/issues/issue-id.ts.
 */
export function getIssue(issueId: string): Promise<IssueDetail> {
  return request<IssueDetail>('GET', `/issues/${encodeURIComponent(issueId)}`);
}
