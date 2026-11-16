import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { getMyIssues } from '@/api/issues';
import type { MyIssue } from '@/api/types';

/**
 * The signed-in user's assigned issues: a local, refreshable copy of the server
 * (docs/ARCHITECTURE.md §12). Loads on focus and on pull-to-refresh, never runs two requests at
 * once, and ignores a response that is no longer the latest.
 *
 * Order is the server's (`updatedAt`, newest first), the interim order until the My Issues
 * prioritization rule is decided (docs/MOBILE_SCOPE.md §H, question 2).
 */
export function useMyIssues() {
  const [issues, setIssues] = useState<MyIssue[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);

  const latestRequest = useRef(0);
  const inFlight = useRef<{ requestId: number; promise: Promise<void> } | null>(null);

  const load = useCallback((): Promise<void> => {
    if (inFlight.current) {
      return inFlight.current.promise;
    }
    const requestId = ++latestRequest.current;
    const promise = (async () => {
      try {
        const result = await getMyIssues();
        if (requestId === latestRequest.current) {
          setIssues(result);
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
    inFlight.current = { requestId, promise };
    return promise;
  }, []);

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

  return { issues, error, refreshing, refresh, retry };
}
