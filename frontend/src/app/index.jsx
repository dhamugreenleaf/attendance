import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/ui/Loading';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <Loading message="Starting application..." />;
  }

  if (isAuthenticated && user?.role) {
    if (user.isTemporaryPassword) {
      return <Redirect href="/(app)/force-change-password" />;
    }
    return <Redirect href={`/(app)/${user.role.toLowerCase()}/dashboard`} />;
  }

  return <Redirect href="/(auth)/login" />;
}

