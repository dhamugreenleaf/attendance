import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing, radius } from '../../styles/spacing';

export const AttendanceStatusBadge = ({ status }) => {
  let backgroundColor = colors.neutralLight;
  let textColor = colors.neutral;
  let label = 'Not Marked';
  let icon = '—';

  switch (status) {
    case 'PRESENT':
      backgroundColor = colors.successLight;
      textColor = colors.success;
      label = 'Present';
      icon = '✓';
      break;
    case 'LATE':
      backgroundColor = colors.warningLight;
      textColor = colors.warning;
      label = 'Late';
      icon = '⚠';
      break;
    case 'ABSENT':
      backgroundColor = colors.errorLight;
      textColor = colors.error;
      label = 'Absent';
      icon = '✕';
      break;
    case 'HALF_DAY':
      backgroundColor = colors.infoLight;
      textColor = colors.info;
      label = 'Half Day';
      icon = '◐';
      break;
    case 'ON_LEAVE':
      backgroundColor = colors.neutralLight;
      textColor = colors.neutral;
      label = 'On Leave';
      icon = '✈';
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.icon, { color: textColor }]}>{icon}</Text>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginRight: 4,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
