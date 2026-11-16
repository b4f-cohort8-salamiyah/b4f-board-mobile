import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { getIssue } from '@/api/issues';
import type { IssueDetail } from '@/api/types';

/**
 * Screen data for one issue: a local, refreshable copy of the server (docs/ARCHITECTURE.md §12).
 * Loads on focus and on pull-to-refresh, never runs two requests for the same issue at once, and
 * ignores a response that is no longer the latest.
 */
export function useIssue(issueId: string) {
  const [issue, setIssue] = useState<IssueDetail | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);

  const latestRequest = useRef(0);
  const inFlight = useRef<{ requestId: number; issueId: string; promise: Promise<void> } | null>(
    null,
  );

  const load = useCallback((): Promise<void> => {
    if (inFlight.current?.issueId === issueId) {
      return inFlight.current.promise;
    }
    const requestId = ++latestRequest.current;
    const promise = (async () => {
      try {
        const result = await getIssue(issueId);
        if (requestId === latestRequest.current) {
          setIssue(result);
          setError(null);
        }
      } catch (caught) {
        if (requestId === latestRequest.current) {
          setError(caught);
        }
      } finally {
        if (inFlight.current?.requestId === requestId) {
          inFlight.current = null;
        }
      }
    })();
    inFlight.current = { requestId, issueId, promise };
    return promise;
  }, [issueId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const retry = useCallback(() => {
    setError(null);
    load();
  }, [load]);

  return { issue, error, refreshing, refresh, retry };
}
