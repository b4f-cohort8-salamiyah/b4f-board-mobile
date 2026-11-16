import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useSession } from './session-provider';

/**
 * Shown when the stored session could not be checked for a network or server reason.
 * The user stays signed in on the device (docs/ARCHITECTURE.md §8).
 */
export function SessionRetryScreen() {
  const { session, retry } = useSession();
  const theme = useTheme();
  const retrying = session.status === 'restoreFailed' && session.retrying;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <ThemedText type="subtitle" accessibilityRole="header">
          Can’t reach B4F Board
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          You’re still signed in on this device. Check your connection, then try again.
        </ThemedText>

        <Pressable
          onPress={retry}
          disabled={retrying}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          accessibilityState={{ disabled: retrying, busy: retrying }}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.text },
            (pressed || retrying) && styles.pressed,
          ]}>
          {retrying ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <ThemedText themeColor="background" type="smallBold">
              Try again
            </ThemedText>
          )}
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
