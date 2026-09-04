import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, Text, TouchableOpacity, Clipboard, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateTeam } from '../../../../hooks/useTeam';
import { TeamForm } from '../../../../components/team/TeamForm';
import { colors } from '../../../../styles/colors';
import { typography } from '../../../../styles/typography';
import { spacing } from '../../../../styles/spacing';
import { Button } from '../../../../components/ui/Button';

export default function CreateTeamScreen() {
  const router = useRouter();
  const createTeamMutation = useCreateTeam();
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const handleSubmit = async (data) => {
    try {
      const response = await createTeamMutation.mutateAsync(data);
      if (response.success) {
        if (response.data && response.data.credentials) {
          setCredentials(response.data.credentials);
          setSuccessModalVisible(true);
        } else {
          Alert.alert('Success', 'Team created successfully');
          router.back();
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to create team');
      }
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'An error occurred while creating the team');
    }
  };

  const handleCloseModal = () => {
    setSuccessModalVisible(false);
    router.back();
  };

  return (
    <>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <TeamForm 
            onSubmit={handleSubmit}
            isSubmitting={createTeamMutation.isPending}
          />
        </View>
      </ScrollView>

      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.modalTitle}>Team Created Successfully!</Text>
            
            {credentials && (
              <>
                <Text style={styles.modalSubtitle}>Temporary Head Account Created</Text>
                
                <View style={styles.credentialsBox}>
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>Username:</Text>
                    <Text style={styles.credentialValue}>{credentials.username}</Text>
                  </View>
                  <View style={styles.credentialRow}>
                    <Text style={styles.credentialLabel}>Password:</Text>
                    <Text style={styles.credentialValue}>{credentials.password}</Text>
                  </View>
                </View>
                
                <Text style={styles.warningText}>
                  Please save these credentials. You will not be able to see them again.
                </Text>

                <Button 
                  title="Share via WhatsApp" 
                  variant="outline"
                  icon="share"
                  onPress={() => {
                    const message = `Hello, your Team Head account has been created.\n\nUsername: ${credentials.username}\nTemporary Password: ${credentials.password}\n\nPlease login and change your password.`;
                    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`).catch(() => {
                      Alert.alert('Error', 'Could not open WhatsApp.');
                    });
                  }}
                  style={{ width: '100%', marginBottom: spacing.md }}
                />
              </>
            )}

            <Button 
              title="Continue" 
              onPress={handleCloseModal} 
              style={styles.continueButton}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  formContainer: {
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successIcon: {
    fontSize: 32,
    color: colors.success,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  credentialsBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  credentialLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  credentialValue: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'monospace',
  },
  warningText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  continueButton: {
    width: '100%',
  }
});
