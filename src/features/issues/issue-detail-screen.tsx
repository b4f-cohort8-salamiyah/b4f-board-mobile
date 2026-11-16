import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import type { IssueDetail } from '@/api/types';
import { ScreenState } from '@/components/screen-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { PriorityBadge, StatusBadge } from './issue-badges';
import { useIssue } from './use-issue';

/** Read-only issue detail. Both 404 messages show the same not-found state (API_CONTRACT.md §6). */
export function IssueDetailScreen({ issueId }: { issueId: string }) {
  const { issue, error, refreshing, refresh, retry } = useIssue(issueId);
  const theme = useTheme();

  if (!issue) {
    if (isApiError(error) && (error.kind === 'notFound' || error.kind === 'validation')) {
      return <IssueNotFound />;
    }
    if (error) {
      return <ScreenState kind="error" error={error} onRetry={retry} />;
    }
    return <ScreenState kind="loading" label="Loading issue" />;
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={theme.textSecondary}
          />
        }>
        {error !== null && (
          <ThemedView type="backgroundElement" style={styles.notice}>
            <ThemedText type="small" accessibilityRole="alert">
              Couldn’t refresh. Showing the last loaded version. Pull down to try again.
            </ThemedText>
          </ThemedView>
        )}

        <ThemedText type="smallBold" themeColor="textSecondary">
          {issue.key} · {issue.project.name}
        </ThemedText>
        <ThemedText type="subtitle" accessibilityRole="header">
          {issue.title}
        </ThemedText>

        <View style={styles.badges}>
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </View>

        <ThemedView type="backgroundElement" style={styles.fields}>
          <Field label="Assignee" value={issue.assignee?.name ?? 'Unassigned'} />
          <Field label="Reporter" value={issue.reporter?.name ?? 'No reporter'} />
          <Field label="Story points" value={storyPointsText(issue.storyPoints)} />
          <Field label="Comments" value={commentCountText(issue._count.comments)} />
          <Field label="Project" value={issue.project.name} />
        </ThemedView>

        <View style={styles.section}>
          <ThemedText type="smallBold">Description</ThemedText>
          <ThemedText themeColor={issue.description ? 'text' : 'textSecondary'}>
            {issue.description || 'No description.'}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

export function IssueNotFound() {
  return (
    <ScreenState
      kind="notFound"
      title="Issue not found"
      message="It may have been deleted, or you may not have access to it."
    />
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field} accessible accessibilityLabel={`${label}: ${value}`}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small" style={styles.fieldValue}>
        {value}
      </ThemedText>
    </View>
  );
}

/** null means not estimated; 0 is a real estimate (API_CONTRACT.md §2). */
function storyPointsText(points: IssueDetail['storyPoints']): string {
  if (points === null) {
    return 'Not estimated';
  }
  return points === 1 ? '1 point' : `${points} points`;
}

function commentCountText(count: number): string {
  if (count === 0) {
    return 'No comments';
  }
  return count === 1 ? '1 comment' : `${count} comments`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    padding: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  notice: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  fields: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  fieldValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  section: {
    gap: Spacing.one,
  },
});
