import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../../../styles/colors';

export default function TeamsLayout() {
  return (
    <Stack screenOptions={{ 
        headerShown: false,
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
