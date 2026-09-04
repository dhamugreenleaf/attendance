import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing, radius } from '../../styles/spacing';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';

export const EmployeeRow = ({ employee, onPress, onMenuPress, showAttendance = true }) => {
  const name = employee?.user?.name || employee?.name || 'Unknown Employee';
  const designation = employee?.designation || 'Team Member';
  const phone = employee?.phone || 'No phone number';
  
  // Extract initials for avatar
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const status = employee?.attendance?.status || 'NOT_MARKED';

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || 'U'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.designation} numberOfLines={1}>{designation}</Text>
          <Text style={styles.phone} numberOfLines={1}>{phone}</Text>
        </View>
      </View>
      
      <View style={styles.rightContent}>
        {employee?.approvalStatus === 'PENDING' ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending Approval</Text>
          </View>
        ) : showAttendance && (
          <View style={styles.attendanceWrapper}>
            <AttendanceStatusBadge status={status} />
          </View>
        )}
        {onMenuPress && (
          <TouchableOpacity style={styles.menuButton} onPress={onMenuPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MaterialIcons name="more-vert" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      }
    }),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 4px 12px ${colors.primary}40`,
      }
    })
  },
  avatarText: {
    color: colors.surface,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  designation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  phone: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
  },
  attendanceWrapper: {
    marginRight: spacing.sm,
  },
  menuButton: {
    padding: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.background,
  },
  pendingBadge: {
    backgroundColor: colors.warning + '20', // Light warning color
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning + '50',
  },
  pendingText: {
    color: colors.warning,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  }
});
