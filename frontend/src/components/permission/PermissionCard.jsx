import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const getStatusColor = (status) => {
  switch (status) {
    case 'APPROVED': return { bg: '#D1FAE5', text: colors.success };
    case 'REJECTED': return { bg: '#FEE2E2', text: colors.error };
    case 'CANCELLED': return { bg: '#F3F4F6', text: colors.textMuted };
    default: return { bg: '#FEF3C7', text: colors.warning };
  }
};

export const PermissionCard = ({ permission, onPress, isApproverView }) => {
  if (!permission) return null;

  const statusColors = getStatusColor(permission.status);

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.date}>{permission.date}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {permission.status}
            </Text>
          </View>
        </View>

        {isApproverView && permission.employee && (
          <Text style={styles.employeeName}>
            {permission.employee.user.firstName} {permission.employee.user.lastName}
          </Text>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={16} color={colors.textMuted} />
            <Text style={styles.detailText}>
              {permission.startTime} - {permission.endTime}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="format-quote" size={16} color={colors.textMuted} />
            <Text style={styles.detailText} numberOfLines={2}>
              {permission.reason}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  date: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  employeeName: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  detailsContainer: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  }
});
