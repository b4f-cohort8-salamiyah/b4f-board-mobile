/**
 * The session as a pure state machine (docs/ARCHITECTURE.md §8). Side effects such as reading or
 * deleting the stored credential live in the session provider, not here.
 *
 * The token is never part of this state.
 */
import type { CurrentUser } from '@/api/types';

/** Why the user is on the sign-in screen. `expired` means the backend rejected the session. */
export type EndReason = 'expired' | null;

export type SessionState =
  /** Startup: checking a stored credential. The splash screen stays up. */
  | { status: 'restoring' }
  /** The check failed for a network or server reason. The credential is kept. */
  | { status: 'restoreFailed'; retrying: boolean }
  | { status: 'signedOut'; endReason: EndReason }
  | { status: 'signedIn'; user: CurrentUser };

export type SessionEvent =
  /** No credential is stored. */
  | { type: 'noCredential' }
  /** `GET /auth/me` accepted the stored credential. */
  | { type: 'restoreSucceeded'; user: CurrentUser }
  /** `GET /auth/me` failed for a network or server reason. */
  | { type: 'restoreFailed' }
  /** The user asked to check the stored credential again. */
  | { type: 'retry' }
  /** A login succeeded and its credential was saved. */
  | { type: 'signedIn'; user: CurrentUser }
  /** The backend answered 401 to the current credential. */
  | { type: 'unauthorized' }
  /** The user signed out. */
  | { type: 'signedOut' };

export const initialSessionState: SessionState = { status: 'restoring' };

function isChecking(state: SessionState): boolean {
  return state.status === 'restoring' || (state.status === 'restoreFailed' && state.retrying);
}

/** Events that do not apply to the current state leave it unchanged. */
export function sessionReducer(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case 'noCredential':
      return isChecking(state) ? { status: 'signedOut', endReason: null } : state;

    case 'restoreSucceeded':
      return isChecking(state) ? { status: 'signedIn', user: event.user } : state;

    case 'restoreFailed':
      return isChecking(state) ? { status: 'restoreFailed', retrying: false } : state;

    case 'retry':
      return state.status === 'restoreFailed' && !state.retrying
        ? { status: 'restoreFailed', retrying: true }
        : state;

    case 'signedIn':
      return state.status === 'signedOut' ? { status: 'signedIn', user: event.user } : state;

    case 'unauthorized':
      return isChecking(state) || state.status === 'signedIn'
        ? { status: 'signedOut', endReason: 'expired' }
        : state;

    case 'signedOut':
      return state.status === 'signedIn' ? { status: 'signedOut', endReason: null } : state;
  }
}
