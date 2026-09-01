import React from 'react';
import { ScrollView, StyleSheet, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateLeave } from '../../../../hooks/useLeave';
import { LeaveForm } from '../../../../components/leave/LeaveForm';
import { colors } from '../../../../styles/colors';

export default function RequestLeaveScreen() {
  const router = useRouter();
  const createLeaveMutation = useCreateLeave();

  const handleSubmit = async (data) => {
    try {
      const response = await createLeaveMutation.mutateAsync(data);
      if (response.success) {
        Alert.alert('Success', 'Leave request submitted successfully');
        router.back();
      } else {
        Alert.alert('Error', response.message || 'Failed to submit request');
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.formContainer}>
        <LeaveForm 
          onSubmit={handleSubmit}
          isSubmitting={createLeaveMutation.isPending}
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
