import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { StatCard } from '../../../components/dashboard/StatCard';
import { colors } from '../../../styles/colors';
import { spacing } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const isLoading = false;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.name}>{user?.firstName || user?.email || 'Manager'}</Text>
          <Text style={styles.roleLabel}>Manager</Text>
        </View>

        <Text style={styles.sectionTitle}>My Teams Overview</Text>
        
        <View style={styles.statsGrid}>
          <StatCard title="Assigned Teams" value={null} icon="groups" loading={isLoading} />
          <StatCard title="Total Members" value={null} icon="people" loading={isLoading} />
        </View>

        <Text style={styles.sectionTitle}>Teams Attendance (Today)</Text>

        <View style={styles.statsGrid}>
          <StatCard title="Present" value={null} icon="check-circle" loading={isLoading} status="success" />
          <StatCard title="Absent" value={null} icon="cancel" loading={isLoading} status="error" />
          <StatCard title="Pending Actions" value={null} icon="pending-actions" loading={isLoading} status="warning" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },
  name: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.xs,
  },
});
