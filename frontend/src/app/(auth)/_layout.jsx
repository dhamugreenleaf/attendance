import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  // If already authenticated, redirect to the application area
  if (isAuthenticated && user?.role) {
    return <Redirect href={`/(app)/${user.role.toLowerCase()}/dashboard`} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

