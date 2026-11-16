/**
 * Turns sign-in input problems and failures into messages placed next to the right field
 * (docs/ENGINEERING_STANDARDS.md §6). Pure, so it can be tested without UI.
 */
import { isApiError } from '@/api/errors';

export type SignInErrors = {
  email?: string;
  password?: string;
  /** A message about the whole form rather than one field. */
  form?: string;
};

/** Checks the fields before any request is sent. Returns null when the input can be submitted. */
export function validateSignInInput(email: string, password: string): SignInErrors | null {
  const errors: SignInErrors = {};
  if (!email.trim()) {
    errors.email = 'Enter your email.';
  }
  if (!password) {
    errors.password = 'Enter your password.';
  }
  return errors.email || errors.password ? errors : null;
}

/** Maps a failed sign-in to user-facing messages. Never includes the password. */
export function signInErrorsFrom(error: unknown): SignInErrors {
  if (!isApiError(error)) {
    // For example, the credential could not be saved on the device.
    return { form: 'Signing in did not finish on this device. Please try again.' };
  }

  switch (error.kind) {
    case 'unauthorized':
      return { form: 'Invalid email or password.' };

    case 'validation': {
      // The backend's validation messages start with the field name, e.g. "email must be an email".
      const errors: SignInErrors = {};
      for (const message of error.messages) {
        if (message.startsWith('email')) {
          errors.email ??= 'Enter a valid email address.';
        } else if (message.startsWith('password')) {
          errors.password ??= 'Enter your password.';
        } else {
          errors.form ??= 'Check your email and password, then try again.';
        }
      }
      return errors.email || errors.password || errors.form
        ? errors
        : { form: 'Check your email and password, then try again.' };
    }

    case 'network':
      return { form: 'Cannot reach B4F Board. Check your connection and try again.' };

    default:
      return { form: 'Something went wrong on the server. Please try again.' };
  }
}
