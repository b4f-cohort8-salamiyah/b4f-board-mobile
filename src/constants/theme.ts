/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    // Issue status and priority tokens. Source of truth: the B4F Board web app's
    // rendered badges (see docs/DESIGN_SEMANTICS.md). Always use a background with
    // its matching text token, and always pair the colour with a text label.
    statusTodo: '#f3f4f6',
    statusTodoText: '#374151',
    statusInProgress: '#dbeafe',
    statusInProgressText: '#1d4ed8',
    statusReview: '#fef3c7',
    statusReviewText: '#b45309',
    statusDone: '#dcfce7',
    statusDoneText: '#15803d',
    priorityLow: '#f3f4f6',
    priorityLowText: '#374151',
    priorityMedium: '#dbeafe',
    priorityMediumText: '#1d4ed8',
    priorityHigh: '#ffedd5',
    priorityHighText: '#c2410c',
    priorityUrgent: '#fee2e2',
    priorityUrgentText: '#b91c1c',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    statusTodo: '#1f2937',
    statusTodoText: '#d1d5db',
    statusInProgress: '#1e3a8a',
    statusInProgressText: '#93c5fd',
    statusReview: '#78350f',
    statusReviewText: '#fcd34d',
    statusDone: '#14532d',
    statusDoneText: '#86efac',
    priorityLow: '#1f2937',
    priorityLowText: '#d1d5db',
    priorityMedium: '#1e3a8a',
    priorityMediumText: '#93c5fd',
    priorityHigh: '#7c2d12',
    priorityHighText: '#fdba74',
    priorityUrgent: '#7f1d1d',
    priorityUrgentText: '#fca5a5',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
