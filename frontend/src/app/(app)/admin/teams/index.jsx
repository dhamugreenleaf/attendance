import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTeams } from '../../../../hooks/useTeam';
import { TeamList } from '../../../../components/team/TeamList';
import { Button } from '../../../../components/ui/Button';
import { colors } from '../../../../styles/colors';
import { spacing } from '../../../../styles/spacing';

export default function TeamsIndex() {
  const router = useRouter();
  const { data: response, isLoading, refetch, isRefetching } = useTeams();

  const handleTeamPress = (team) => {
    router.push(`/(app)/admin/teams/${team.id}`);
  };

  const handleCreatePress = () => {
    router.push('/(app)/admin/teams/create');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button 
          title="Create New Team" 
          onPress={handleCreatePress} 
          icon="add"
        />
      </View>
      <TeamList 
        teams={response?.data} 
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={refetch}
        onTeamPress={handleTeamPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  }
});
