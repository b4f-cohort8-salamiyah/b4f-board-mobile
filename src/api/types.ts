/**
 * Response shapes from docs/API_CONTRACT.md. Only what the current slice uses is declared here;
 * shapes for later endpoints are added with the slice that relies on them.
 */

/** `GET /auth/me` (API_CONTRACT.md §4). */
export type CurrentUser = {
  id: string;
  email: string;
  name: string;
};

/** `POST /auth/login` (API_CONTRACT.md §3). */
export type LoginResponse = {
  accessToken: string;
  user: CurrentUser;
};

/** Enum `IssueStatus` (API_CONTRACT.md §2). */
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

/** Enum `IssuePriority` (API_CONTRACT.md §2). */
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/** Scalar fields of an issue, returned by both issue endpoints (API_CONTRACT.md §2). */
export type IssueFields = {
  id: string;
  projectId: string;
  key: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string | null;
  reporterId: string | null;
  /** null means not estimated; 0 is a real value. */
  storyPoints: number | null;
  /** null means backlog. */
  sprintId: string | null;
  /** ISO-8601 string. */
  createdAt: string;
  /** ISO-8601 string. */
  updatedAt: string;
};

export type IssueProject = {
  id: string;
  key: string;
  name: string;
  workspaceId: string;
};

/** One item of `GET /users/me/issues` (API_CONTRACT.md §5). */
export type MyIssue = IssueFields & {
  project: IssueProject;
};

/** `GET /issues/:id` (API_CONTRACT.md §6). */
export type IssueDetail = IssueFields & {
  assignee: { id: string; name: string } | null;
  reporter: { id: string; name: string } | null;
  project: IssueProject;
  _count: { comments: number };
};
