import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ATTENDANCE_STATUS } from '../../constants/attendance';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

export const AttendanceStatus = ({ status, style }) => {
  const getStatusStyle = () => {
    switch (status) {
      case ATTENDANCE_STATUS.PRESENT:
        return { bg: '#D1FAE5', text: colors.success };
      case ATTENDANCE_STATUS.ABSENT:
        return { bg: '#FEE2E2', text: colors.error };
      case ATTENDANCE_STATUS.LATE:
        return { bg: '#FEF3C7', text: colors.warning };
      case ATTENDANCE_STATUS.HALF_DAY:
        return { bg: '#DBEAFE', text: colors.info };
      case ATTENDANCE_STATUS.LEAVE:
      case ATTENDANCE_STATUS.PERMISSION:
      case ATTENDANCE_STATUS.ON_DUTY:
      case ATTENDANCE_STATUS.WFH:
        return { bg: '#F3E8FF', text: '#9333EA' }; // Purple theme for special statuses
      case ATTENDANCE_STATUS.HOLIDAY:
      case ATTENDANCE_STATUS.WEEKLY_OFF:
        return { bg: colors.surfaceSecondary, text: colors.textSecondary };
      default:
        return { bg: colors.surfaceSecondary, text: colors.textSecondary };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <View style={[styles.container, { backgroundColor: statusStyle.bg }, style]}>
      <Text style={[styles.text, { color: statusStyle.text }]}>
        {status ? status.replace('_', ' ') : 'UNKNOWN'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  }
});
