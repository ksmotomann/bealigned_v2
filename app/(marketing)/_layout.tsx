import { Stack } from 'expo-router'

export default function MarketingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="our-story" />
      <Stack.Screen name="faq" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
    </Stack>
  )
}