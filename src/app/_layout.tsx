import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { SessionProvider, useSession } from '@/features/auth';

// The splash stays up until the stored session has been checked (docs/ARCHITECTURE.md §8).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SessionProvider>
        <SplashScreenController />
        <RootNavigator />
      </SessionProvider>
    </ThemeProvider>
  );
}

function SplashScreenController() {
  const { session } = useSession();
  const restoring = session.status === 'restoring';

  useEffect(() => {
    if (!restoring) {
      SplashScreen.hideAsync();
    }
  }, [restoring]);

  return null;
}

/**
 * Public screens and signed-in screens are separated by guards: only one group is reachable at a
 * time, and a guard turning false removes that group's screens from history.
 */
function RootNavigator() {
  const { session } = useSession();
  const { status } = session;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      {/* Mounted under the splash while restoring, so no signed-in screen can flash. */}
      <Stack.Protected guard={status === 'signedOut' || status === 'restoring'}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>

      <Stack.Protected guard={status === 'restoreFailed'}>
        <Stack.Screen name="reconnect" />
      </Stack.Protected>
    </Stack>
  );
}
