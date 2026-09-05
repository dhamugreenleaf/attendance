import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { ROLES } from '../../../constants/roles';
import { BOTTOM_TABS } from '../../../constants/navigation';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { ToastProvider } from '../../../components/ui/Toast';
import { NotificationBell } from '../../../components/ui/NotificationBell';
import { useAppTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { TouchableOpacity, View, Text } from 'react-native';


export default function TlLayout() {
  const { user, isLoading } = useAuth();
  const { theme, toggleTheme, currentColors } = useAppTheme();
  const { t } = useLanguage();

  if (isLoading) return null;

  if (user?.role !== ROLES.TL) {
    return <Redirect href="/" />;
  }

  const tabs = BOTTOM_TABS[ROLES.TL] || [];

  return (
    <ToastProvider>
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
              <NotificationBell />
            </View>
          )
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: t(tab.name),
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name={tab.icon} size={size} color={color} />
              ),
            }}
          />
        ))}
        <Tabs.Screen
          name="history"
          options={{
            href: null,
            title: 'History'
          }}
        />
      </Tabs>
    </ToastProvider>
  );
}
