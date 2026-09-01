import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

export const StatCard = ({ title, value, icon, subtitle, loading, status }) => {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {icon && (
          <View style={[styles.iconContainer, status && { backgroundColor: getStatusColor(status) }]}>
            <MaterialIcons name={icon} size={24} color={status ? colors.surface : colors.primary} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.value}>{value ?? '—'}</Text>
        )}
      </View>
    </Card>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'success': return colors.success;
    case 'warning': return colors.warning;
    case 'error': return colors.error;
    case 'info': return colors.info;
    default: return colors.primaryLight;
  }
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    flex: 1,
    minWidth: '45%', // To allow two cards side by side
    marginHorizontal: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  iconContainer: {
    padding: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surfaceSecondary,
  },
  content: {
    marginTop: spacing.xs,
  },
  value: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  }
});
