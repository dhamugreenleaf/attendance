import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateTeam } from '../../../../hooks/useTeam';
import { TeamForm } from '../../../../components/team/TeamForm';
import { colors } from '../../../../styles/colors';

export default function CreateTeamScreen() {
  const router = useRouter();
  const createTeamMutation = useCreateTeam();

  const handleSubmit = async (data) => {
    try {
      const response = await createTeamMutation.mutateAsync(data);
      if (response.success) {
        Alert.alert('Success', 'Team created successfully');
        router.back();
      } else {
        Alert.alert('Error', response.message || 'Failed to create team');
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'An error occurred while creating the team');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.formContainer}>
        <TeamForm 
          onSubmit={handleSubmit}
          isSubmitting={createTeamMutation.isPending}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  formContainer: {
    paddingVertical: 16,
  }
});
