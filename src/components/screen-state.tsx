/**
 * The shared full-screen states (docs/ENGINEERING_STANDARDS.md §6), so every feature shows loading,
 * errors, empty lists, and not-found the same way.
 */
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { isApiError } from '@/api/errors';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenStateProps =
  | { kind: 'loading'; label: string }
  | { kind: 'error'; error: unknown; onRetry: () => void }
  | { kind: 'empty'; title: string; message: string }
  | { kind: 'notFound'; title: string; message: string };

export function ScreenState(props: ScreenStateProps) {
  const theme = useTheme();

  if (props.kind === 'loading') {
    return (
      <ThemedView style={styles.container} accessible accessibilityLabel={props.label}>
        <ActivityIndicator color={theme.textSecondary} />
      </ThemedView>
    );
  }

  const { title, message } =
    props.kind === 'error' ? errorText(props.error) : { title: props.title, message: props.message };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="smallBold" accessibilityRole="header" style={styles.center}>
          {title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {message}
        </ThemedText>
        {props.kind === 'error' && (
          <Pressable
            onPress={props.onRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">Try again</ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </ThemedView>
  );
}

/** Network, server, and permission failures are worded differently (ENGINEERING_STANDARDS.md §6). */
export function errorText(error: unknown): { title: string; message: string } {
  if (isApiError(error)) {
    switch (error.kind) {
      case 'network':
        return {
          title: 'Can’t reach B4F Board',
          message: 'Check your connection, then try again.',
        };
      case 'forbidden':
        return {
          title: 'Not permitted',
          message: 'Your role does not allow this.',
        };
    }
  }
  return {
    title: 'Something went wrong',
    message: 'The server could not complete the request. Please try again.',
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  center: {
    textAlign: 'center',
  },
  button: {
    minHeight: 44,
    minWidth: 44,
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
