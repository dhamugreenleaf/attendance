import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // We are authenticated. 
  // Let the nested role layouts (admin, hr, etc.) handle their own tabs.
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

