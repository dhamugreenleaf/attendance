import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

export const TeamCard = ({ team, onPress }) => {
  if (!team) return null;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.name}>{team.name}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: team.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2' }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: team.status === 'ACTIVE' ? colors.success : colors.error }
            ]}>
              {team.status}
            </Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <MaterialIcons name="domain" size={16} color={colors.textMuted} />
            <Text style={styles.detailText}>Dept ID: {team.departmentId}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="person" size={16} color={colors.textMuted} />
            <Text style={styles.detailText}>
              Manager ID: {team.managerId || 'Unassigned'}
            </Text>
          </View>
          {team.members && (
            <View style={styles.detailRow}>
              <MaterialIcons name="groups" size={16} color={colors.textMuted} />
              <Text style={styles.detailText}>
                Members: {team.members.length}
              </Text>
            </View>
          )}
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
    marginBottom: spacing.md,
  },
  name: {
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
  }
});
