import { useLocalSearchParams } from 'expo-router';

import { IssueDetailScreen, IssueNotFound, isIssueId } from '@/features/issues';

export default function IssueRoute() {
  const { issueId } = useLocalSearchParams<{ issueId: string }>();

  // An id that cannot be a UUID is not found, and no request is sent.
  if (!isIssueId(issueId)) {
    return <IssueNotFound />;
  }
  return <IssueDetailScreen key={issueId} issueId={issueId} />;
}
