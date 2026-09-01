import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../../../styles/colors';

export default function TeamsLayout() {
  return (
    <Stack screenOptions={{ 
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
    }}>
      <Stack.Screen name="index" options={{ title: 'Manage Teams', headerShown: false }} />
      <Stack.Screen name="create" options={{ title: 'Create Team', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Team Details' }} />
    </Stack>
  );
}
