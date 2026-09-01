import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { ROLES } from '../../../constants/roles';
import { BOTTOM_TABS } from '../../../constants/navigation';
import { colors } from '../../../styles/colors';
import { MaterialIcons } from '@expo/vector-icons';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user?.role !== ROLES.ADMIN) {
    return <Redirect href="/" />;
  }

  const tabs = BOTTOM_TABS[ROLES.ADMIN] || [];

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.surface,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
