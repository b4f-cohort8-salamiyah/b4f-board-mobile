/**
 * The single session owner (docs/ARCHITECTURE.md §7–8).
 *
 * - The only caller of the credential store.
 * - Holds the token in a ref, never in render state, context, props, or logs.
 * - Registers the token getter and the 401 handler with the API client.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';

import { getCurrentUser, login } from '@/api/auth';
import { configureAuth } from '@/api/client';
import { isApiError } from '@/api/errors';

import { deleteCredential, readCredential, saveCredential } from './credential-store';
import { initialSessionState, sessionReducer, type SessionState } from './session-state';

type SessionContextValue = {
  session: SessionState;
  /** Throws an ApiError when the login is rejected or the backend cannot be reached. */
  signIn: (email: string, password: string) => Promise<void>;
  /** Local only: deletes the stored credential. The backend has no logout. */
  signOut: () => Promise<void>;
  /** Checks the stored credential again after a network or server failure. */
  retry: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, initialSessionState);
  const tokenRef = useRef<string | null>(null);

  // Registered before the restore effect below runs, so restore requests use this token.
  useEffect(() => {
    configureAuth({
      getToken: () => tokenRef.current,
      onUnauthorized: (rejectedToken) => {
        // A late 401 for a token that is no longer current must not end the new session.
        if (rejectedToken !== tokenRef.current) {
          return;
        }
        tokenRef.current = null;
        dispatch({ type: 'unauthorized' });
        deleteCredential().catch(() => {
          // The credential is checked again at the next startup, where a 401 ends it.
        });
      },
    });
  }, []);

  const restore = useCallback(async () => {
    let token: string | null;
    try {
      token = await readCredential();
    } catch {
      // Storage could not be read. Keep whatever is stored and offer a retry.
      dispatch({ type: 'restoreFailed' });
      return;
    }

    if (!token) {
      dispatch({ type: 'noCredential' });
      return;
    }

    tokenRef.current = token;
    try {
      const user = await getCurrentUser();
      dispatch({ type: 'restoreSucceeded', user });
    } catch (error) {
      if (isApiError(error) && error.kind === 'unauthorized') {
        // Already handled by onUnauthorized: credential deleted, signed out as expired.
        return;
      }
      // Network or server failure: the credential is kept (docs/ARCHITECTURE.md §8).
      dispatch({ type: 'restoreFailed' });
    }
  }, []);

  useEffect(() => {
    restore();
  }, [restore]);

  const retry = useCallback(() => {
    dispatch({ type: 'retry' });
    restore();
  }, [restore]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { accessToken, user } = await login(email, password);
    await saveCredential(accessToken);
    tokenRef.current = accessToken;
    dispatch({ type: 'signedIn', user });
  }, []);

  const signOut = useCallback(async () => {
    tokenRef.current = null;
    try {
      await deleteCredential();
    } finally {
      dispatch({ type: 'signedOut' });
    }
  }, []);

  const value = useMemo(
    () => ({ session, signIn, signOut, retry }),
    [session, signIn, signOut, retry],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used inside SessionProvider.');
  }
  return value;
}
