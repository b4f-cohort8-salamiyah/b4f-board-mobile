import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MyIssue } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { PriorityBadge, priorityLabel, StatusBadge, statusLabel } from '@/features/issues';

export function IssueRow({ issue }: { issue: MyIssue }) {
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/issues/[issueId]', params: { issueId: issue.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={
        `${issue.key}, ${issue.title}. Status ${statusLabel(issue.status)}, ` +
        `priority ${priorityLabel(issue.priority)}. Project ${issue.project.name}.`
      }
      accessibilityHint="Opens the issue details">
      {({ pressed }) => (
        <ThemedView type="backgroundElement" style={[styles.row, pressed && styles.pressed]}>
          <ThemedText type="small" themeColor="textSecondary">
            {issue.key} · {issue.project.name}
          </ThemedText>
          <ThemedText>{issue.title}</ThemedText>
          <View style={styles.badges}>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </View>
        </ThemedView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
