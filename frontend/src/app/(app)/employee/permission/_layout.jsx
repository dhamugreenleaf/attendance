import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../../../styles/colors';

export default function EmployeePermissionLayout() {
  return (
    <Stack screenOptions={{ 
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
    }}>
      <Stack.Screen name="index" options={{ title: 'My Permissions', headerShown: false }} />
      <Stack.Screen name="request" options={{ title: 'Request Permission', presentation: 'modal' }} />
    </Stack>
  );
}
