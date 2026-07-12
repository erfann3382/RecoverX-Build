import React from 'react';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="scan/[category]" />
      <Stack.Screen name="results/[category]" />
    </Stack>
  );
}
