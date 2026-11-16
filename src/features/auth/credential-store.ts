/**
 * Secure persistence for the access token (docs/ARCHITECTURE.md §7).
 *
 * This is the only module that imports the storage package. Everything else goes through
 * these three functions, and only the session owner calls them.
 *
 * The token is opaque: it is never decoded, logged, or included in an error message.
 */
import * as SecureStore from 'expo-secure-store';

const CREDENTIAL_KEY = 'b4f.accessToken';

// Readable only while the device is unlocked, and never copied to another device through a
// backup restore.
const STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function saveCredential(token: string): Promise<void> {
  await SecureStore.setItemAsync(CREDENTIAL_KEY, token, STORE_OPTIONS);
}

/** Returns the stored token, or null when none is stored. */
export async function readCredential(): Promise<string | null> {
  return SecureStore.getItemAsync(CREDENTIAL_KEY, STORE_OPTIONS);
}

export async function deleteCredential(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDENTIAL_KEY, STORE_OPTIONS);
}
