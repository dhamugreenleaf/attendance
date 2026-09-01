import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { StatCard } from '../../../components/dashboard/StatCard';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { colors } from '../../../styles/colors';
import { spacing } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';
import { AttendanceStatus } from '../../../components/attendance/AttendanceStatus';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.name}>{user?.firstName || user?.email || 'Employee'}</Text>
        </View>

        <Text style={styles.sectionTitle}>Today's Attendance</Text>
        
        <Card style={styles.attendanceCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <AttendanceStatus status={null} />
          </View>
          
          <Text style={styles.timeText}>00:00 Hrs</Text>
          <Text style={styles.timeLabel}>Working Hours Today</Text>

          <View style={styles.actionButtons}>
            <Button 
              title="Check In" 
              onPress={() => {}} 
              style={styles.actionButton}
            />
            <Button 
              title="Check Out" 
              onPress={() => {}} 
              variant="secondary"
              style={styles.actionButton}
              disabled={true}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>My Summary</Text>

        <View style={styles.statsGrid}>
          <StatCard title="Leaves Balance" value={null} icon="event-note" />
          <StatCard title="Permissions" value={null} icon="assignment-ind" />
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
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  attendanceCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  timeText: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  timeLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -spacing.xs,
  },
});
