/**
 * Status and priority badges. The backend value → theme token mapping lives here, in the feature,
 * not in the theme (docs/DESIGN_SEMANTICS.md §2). Every badge shows its text label: colour is
 * never the only signal.
 */
import { StyleSheet } from 'react-native';

import type { IssuePriority, IssueStatus } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, type ThemeColor } from '@/constants/theme';

type BadgeStyle = { label: string; background: ThemeColor; text: ThemeColor };

const STATUS: Record<IssueStatus, BadgeStyle> = {
  TODO: { label: 'To Do', background: 'statusTodo', text: 'statusTodoText' },
  IN_PROGRESS: {
    label: 'In Progress',
    background: 'statusInProgress',
    text: 'statusInProgressText',
  },
  REVIEW: { label: 'Review', background: 'statusReview', text: 'statusReviewText' },
  DONE: { label: 'Done', background: 'statusDone', text: 'statusDoneText' },
};

const PRIORITY: Record<IssuePriority, BadgeStyle> = {
  LOW: { label: 'Low', background: 'priorityLow', text: 'priorityLowText' },
  MEDIUM: { label: 'Medium', background: 'priorityMedium', text: 'priorityMediumText' },
  HIGH: { label: 'High', background: 'priorityHigh', text: 'priorityHighText' },
  URGENT: { label: 'Urgent', background: 'priorityUrgent', text: 'priorityUrgentText' },
};

export function statusLabel(status: IssueStatus): string {
  return STATUS[status].label;
}

export function priorityLabel(priority: IssuePriority): string {
  return PRIORITY[priority].label;
}

export function StatusBadge({ status }: { status: IssueStatus }) {
  return <Badge style={STATUS[status]} accessibilityLabel={`Status: ${STATUS[status].label}`} />;
}

export function PriorityBadge({ priority }: { priority: IssuePriority }) {
  return (
    <Badge
      style={PRIORITY[priority]}
      accessibilityLabel={`Priority: ${PRIORITY[priority].label}`}
    />
  );
}

function Badge({ style, accessibilityLabel }: { style: BadgeStyle; accessibilityLabel: string }) {
  return (
    <ThemedView
      type={style.background}
      style={styles.badge}
      accessible
      accessibilityLabel={accessibilityLabel}>
      <ThemedText type="small" themeColor={style.text}>
        {style.label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.three,
  },
});
