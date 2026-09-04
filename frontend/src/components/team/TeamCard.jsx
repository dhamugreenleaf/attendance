import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing, radius } from '../../styles/spacing';

export const TeamCard = ({ team, onPress }) => {
  const presentCount = team?.attendanceSummary?.present || 0;
  const lateCount = team?.attendanceSummary?.late || 0;
  const absentCount = team?.attendanceSummary?.absent || 0;
  
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.teamName}>{team.name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Team Head</Text>
          <Text style={styles.value}>{team.manager?.name || 'Not Assigned'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Members</Text>
          <Text style={styles.value}>{team.employeeCount || 0} Employees</Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.attendanceTitle}>Today's Attendance</Text>
        <View style={styles.attendanceSummary}>
          <Text style={[styles.summaryText, { color: colors.success }]}>{presentCount} Present</Text>
          <Text style={styles.summaryDot}>·</Text>
          <Text style={[styles.summaryText, { color: colors.warning }]}>{lateCount} Late</Text>
          <Text style={styles.summaryDot}>·</Text>
          <Text style={[styles.summaryText, { color: colors.error }]}>{absentCount} Absent</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  teamName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  value: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  attendanceTitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attendanceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  summaryDot: {
    marginHorizontal: spacing.sm,
    color: colors.textMuted,
  }
});
