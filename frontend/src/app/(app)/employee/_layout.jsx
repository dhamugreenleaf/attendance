import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { ROLES } from '../../../constants/roles';
import { BOTTOM_TABS } from '../../../constants/navigation';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../../context/ThemeContext';
import { TouchableOpacity, View, Text } from 'react-native';

export default function EmployeeLayout() {
  const { user, isLoading } = useAuth();
  const { theme, toggleTheme, currentColors } = useAppTheme();

  if (isLoading) return null;

  if (user?.role !== ROLES.EMPLOYEE) {
    return <Redirect href="/" />;
  }

  const tabs = BOTTOM_TABS[ROLES.EMPLOYEE] || [];

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: currentColors.primary },
        headerTintColor: currentColors.surface,
        tabBarActiveTintColor: currentColors.primary,
        tabBarInactiveTintColor: currentColors.textMuted,
        tabBarStyle: { backgroundColor: currentColors.surface, borderTopColor: currentColors.border },
        headerTitle: () => (
          <Text style={{ 
            color: currentColors.surface, 
            fontSize: 22, 
            fontWeight: '800', 
            letterSpacing: 1, 
            fontFamily: 'System' 
          }}>
            WorkAxis
          </Text>
        ),
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
            <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 15 }}>
              <Feather name={theme === 'dark' ? 'sun' : 'moon'} size={22} color={currentColors.surface} />
            </TouchableOpacity>
          </View>
        )
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
