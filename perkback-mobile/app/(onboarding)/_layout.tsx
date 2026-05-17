import { Stack } from 'expo-router';
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="choose-role" />
      <Stack.Screen name="choose-account" />
      <Stack.Screen name="card-reveal" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}
