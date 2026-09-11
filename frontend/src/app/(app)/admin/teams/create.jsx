import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useToast } from '../../../../components/ui/Toast';
import { useCreateTeam } from '../../../../hooks/useTeam';
import { TeamForm } from '../../../../components/team/TeamForm';
import { TeamCredentialModal } from '../../../../components/team/TeamCredentialModal';
import { colors } from '../../../../styles/colors';
import { spacing, radius } from '../../../../styles/spacing';
import { typography } from '../../../../styles/typography';

export default function CreateTeamScreen() {
  const router = useRouter();
  const toast = useToast();
  const createTeamMutation = useCreateTeam();
  const [credentialData, setCredentialData] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      const response = await createTeamMutation.mutateAsync(formData);
      if (response.success) {
        toast.show('✓ Team created successfully', 'success');
        if (response.data && response.data.credentials) {
          setCredentialData({
            ...response.data.credentials,
            teamName: formData.name,
          });
        } else {
          setTimeout(() => {
            router.back();
          }, 600);
        }
      } else {
        toast.show(response.message || 'Failed to create team', 'error');
      }
    } catch (error) {
      toast.show(
        error?.response?.data?.message || 'An error occurred while creating the team',
        'error'
      );
    }
  };

  const handleCloseCredentialModal = () => {
    setCredentialData(null);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sleek Mobile Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.screenTitle} numberOfLines={1}>
            Create New Team
          </Text>
          <Text style={styles.screenSubtitle} numberOfLines={1}>
            Set up team & assign staff
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TeamForm
            onSubmit={handleSubmit}
            isSubmitting={createTeamMutation.isPending}
            isEdit={false}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Team Head Credentials Modal */}
      <TeamCredentialModal
        visible={!!credentialData}
        credentials={credentialData}
        onClose={handleCloseCredentialModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  screenTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  screenSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 90, // Generous padding so bottom tabs never obstruct the submit button
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
});
