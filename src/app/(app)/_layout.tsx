import { Stack } from 'expo-router';

/** Signed-in screens: the tabs, plus screens pushed above them (issue detail). */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="issues/[issueId]"
        options={{ headerShown: true, title: 'Issue', headerBackTitle: 'My Issues' }}
      />
    </Stack>
  );
}
