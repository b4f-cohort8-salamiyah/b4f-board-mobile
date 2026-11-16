import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenState } from '@/components/screen-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth';
import { useTheme } from '@/hooks/use-theme';

import { IssueRow } from './issue-row';
import { useMyIssues } from './use-my-issues';

export function MyIssuesScreen() {
  const { issues, error, refreshing, refresh, retry } = useMyIssues();
  const theme = useTheme();

  let body;
  if (issues) {
    body = (
      // Virtualized: the list has no server-side limit (docs/ENGINEERING_STANDARDS.md §13).
      <FlatList
        data={issues}
        keyExtractor={(issue) => issue.id}
        renderItem={({ item }) => <IssueRow issue={item} />}
        contentContainerStyle={[styles.list, issues.length === 0 && styles.emptyList]}
        ListHeaderComponent={
          error !== null ? (
            <ThemedView type="backgroundElement" style={styles.notice}>
              <ThemedText type="small" accessibilityRole="alert">
                Couldn’t refresh. Showing the last loaded issues. Pull down to try again.
              </ThemedText>
            </ThemedView>
          ) : undefined
        }
        ListEmptyComponent={
          <ScreenState
            kind="empty"
            title="No assigned issues"
            message="Issues assigned to you will appear here."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.textSecondary}
          />
        }
      />
    );
  } else if (error) {
    body = <ScreenState kind="error" error={error} onRetry={retry} />;
  } else {
    body = <ScreenState kind="loading" label="Loading your issues" />;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Header />
        <View style={styles.body}>{body}</View>
      </SafeAreaView>
    </ThemedView>
  );
}

/** Title, the signed-in user, and sign-out (plans/slice-01-foundation.md, piece 5). */
function Header() {
  const { session, signOut } = useSession();
  const theme = useTheme();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // The session is still ended locally; the stored credential is checked again at startup.
    }
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <ThemedText type="subtitle" accessibilityRole="header">
          My Issues
        </ThemedText>
        {session.status === 'signedIn' && (
          <ThemedText type="small" themeColor="textSecondary">
            Signed in as {session.user.name}
          </ThemedText>
        )}
      </View>
      <Pressable
        onPress={handleSignOut}
        disabled={signingOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        accessibilityState={{ disabled: signingOut }}
        style={({ pressed }) => [
          styles.signOut,
          { backgroundColor: theme.backgroundElement },
          (pressed || signingOut) && styles.pressed,
        ]}>
        <ThemedText type="smallBold">Sign out</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerText: {
    flex: 1,
    minWidth: 160,
  },
  signOut: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
  },
  list: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  emptyList: {
    flexGrow: 1,
  },
  notice: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
});
