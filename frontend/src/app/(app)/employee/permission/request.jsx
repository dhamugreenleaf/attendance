import React from 'react';
import { ScrollView, StyleSheet, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreatePermission } from '../../../../hooks/usePermission';
import { PermissionForm } from '../../../../components/permission/PermissionForm';
import { colors } from '../../../../styles/colors';

export default function RequestPermissionScreen() {
  const router = useRouter();
  const createPermissionMutation = useCreatePermission();

  const handleSubmit = async (data) => {
    try {
      const response = await createPermissionMutation.mutateAsync(data);
      if (response.success) {
        Alert.alert('Success', 'Permission request submitted successfully');
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
        <PermissionForm 
          onSubmit={handleSubmit}
          isSubmitting={createPermissionMutation.isPending}
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
