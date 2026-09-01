import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTeam, useUpdateTeam, useDeleteTeam } from '../../../../hooks/useTeam';
import { TeamForm } from '../../../../components/team/TeamForm';
import { Loading } from '../../../../components/ui/Loading';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { Button } from '../../../../components/ui/Button';
import { colors } from '../../../../styles/colors';
import { spacing } from '../../../../styles/spacing';
import { typography } from '../../../../styles/typography';

export default function TeamDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const { data: response, isLoading, isError, refetch } = useTeam(id);
  const updateTeamMutation = useUpdateTeam();
  const deleteTeamMutation = useDeleteTeam();

  if (isLoading) return <Loading message="Loading team details..." />;
  if (isError || !response?.data) return <ErrorState message="Failed to load team" onRetry={refetch} />;

  const team = response.data;

  const handleUpdate = async (data) => {
    try {
      const res = await updateTeamMutation.mutateAsync({ id, data });
      if (res.success) {
        Alert.alert('Success', 'Team updated successfully');
        setIsEditing(false);
      } else {
        Alert.alert('Error', res.message || 'Failed to update team');
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'An error occurred');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Team',
      'Are you sure you want to delete this team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteTeamMutation.mutateAsync(id);
              if (res.success) {
                Alert.alert('Success', 'Team deleted');
                router.back();
              } else {
                Alert.alert('Error', res.message || 'Failed to delete team');
              }
            } catch (error) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete team');
            }
          }
        }
      ]
    );
  };

  if (isEditing) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.editHeader}>
          <Text style={styles.title}>Edit Team</Text>
          <Button title="Cancel" variant="secondary" onPress={() => setIsEditing(false)} />
        </View>
        <TeamForm 
          defaultValues={{
            name: team.name,
            departmentId: team.departmentId,
            managerId: team.managerId || '',
            status: team.status
          }}
          onSubmit={handleUpdate}
          isSubmitting={updateTeamMutation.isPending}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.teamName}>{team.name}</Text>
          <View style={[styles.badge, { backgroundColor: team.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[styles.badgeText, { color: team.status === 'ACTIVE' ? colors.success : colors.error }]}>
              {team.status}
            </Text>
          </View>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Department ID</Text>
          <Text style={styles.value}>{team.departmentId}</Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Manager ID</Text>
          <Text style={styles.value}>{team.managerId || 'Unassigned'}</Text>
        </View>

        {team.members && (
          <View style={styles.infoGroup}>
            <Text style={styles.label}>Members</Text>
            <Text style={styles.value}>{team.members.length} employees</Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <Button 
            title="Edit Team" 
            onPress={() => setIsEditing(true)} 
            icon="edit"
            style={styles.actionButton}
          />
          <Button 
            title="Delete Team" 
            variant="danger" 
            onPress={handleDelete} 
            icon="delete"
            style={styles.actionButton}
            loading={deleteTeamMutation.isPending}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  detailsContainer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 8,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  teamName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  infoGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    marginBottom: 4,
  },
  value: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  actionsContainer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    width: '100%',
  }
});
