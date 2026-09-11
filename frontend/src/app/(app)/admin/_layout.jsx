import React from 'react';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { ROLES } from '../../../constants/roles';
import { BOTTOM_TABS } from '../../../constants/navigation';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useAppTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import { NotificationBell } from '../../../components/ui/NotificationBell';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  const { theme, toggleTheme, currentColors } = useAppTheme();
  const { t } = useLanguage();
  const router = useRouter();

  if (isLoading) return null;

  if (user?.role !== ROLES.ADMIN) {
    return <Redirect href="/" />;
  }

  const tabs = BOTTOM_TABS[ROLES.ADMIN] || [];
  const isDark = theme === 'dark';
  const brandNavy = '#1A365D';
  const headerBg = isDark ? currentColors.surface : '#FFFFFF';
  const headerBorder = isDark ? currentColors.border : '#E2E8F0';

  const userInitial = (user?.name || user?.username || 'S')[0].toUpperCase();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: headerBg,
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: headerBorder,
          height: 60,
          ...Platform.select({
            web: {
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            },
            ios: {
              shadowOpacity: 0.04,
              shadowOffset: { width: 0, height: 1 },
              shadowRadius: 2,
            },
          }),
        },
        headerTitleAlign: 'left',
        headerTitle: () => (
          <View style={styles.headerLeftContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoLetter}>W</Text>
            </View>
            <View style={styles.brandTextContainer}>
              <Text style={[styles.brandTitle, { color: isDark ? '#FFFFFF' : brandNavy }]}>WorkAxis</Text>
              <Text style={styles.brandSubtitle}>Workforce Management</Text>
            </View>
          </View>
        ),
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <NotificationBell />
            <TouchableOpacity 
              style={styles.avatarButton} 
              onPress={() => router.push('/(app)/admin/profile')}
              activeOpacity={0.7}
            >
              <View style={[styles.avatarCircle, { backgroundColor: brandNavy }]}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
            </TouchableOpacity>
          </View>
        ),
        tabBarActiveTintColor: isDark ? currentColors.primary : brandNavy,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: isDark ? currentColors.surface : '#FFFFFF',
          borderTopColor: isDark ? currentColors.border : '#E2E8F0',
          borderTopWidth: 1,
          height: 58,
          paddingBottom: 6,
          paddingTop: 4,
          ...Platform.select({
            web: {
              boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.04)',
            },
            ios: {
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 3,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 1,
          letterSpacing: -0.2,
        },
        tabBarItemStyle: {
          paddingHorizontal: 0,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.name),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name={tab.icon} size={size || 22} color={color} />
            ),
          }}
        />
      ))}
      <Tabs.Screen
        name="plans"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 4,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1A365D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 12,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 12,
  },
  avatarButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
