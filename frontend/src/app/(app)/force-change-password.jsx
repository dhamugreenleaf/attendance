import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialIcons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { authApi } from '../../services/auth.api';
import { useAuth } from '../../hooks/useAuth';
import { saveToken } from '../../utils/storage';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => data.oldPassword !== data.newPassword, {
  message: 'New password cannot be the same as old password',
  path: ['newPassword'],
});

export default function ForceChangePassword() {
  const router = useRouter();
  const { user, restoreSession, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Sends both oldPassword and newPassword for validation
      const response = await authApi.forceChangePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      if (response.success) {
        // Save the fresh token (isTemporaryPassword=false) so session restores correctly
        if (response.data?.token) {
          await saveToken(response.data.token);
        }

        Alert.alert('Success', 'Password updated successfully!', [
          {
            text: 'OK',
            onPress: async () => {
              await restoreSession();
              const targetRole = user?.role ? user.role.toLowerCase() : 'employee';
              router.replace(`/(app)/${targetRole}/dashboard`);
            }
          }
        ]);
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'An error occurred while updating password';
      Alert.alert('Update Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
      router.replace('/(auth)/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.replace('/(auth)/login');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="lock-reset" size={28} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.cardTitle}>Set New Password</Text>
          <Text style={styles.cardSubtitle}>
            Please enter your old password and create a new secure password to continue.
          </Text>

          <Controller
            control={control}
            name="oldPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Old Password"
                placeholder="Enter old password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.oldPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="New Password"
                placeholder="Enter new password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirm New Password"
                placeholder="Re-enter new password"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button
            title="Update Password"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            style={styles.submitButton}
          />

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <MaterialIcons name="logout" size={16} color={colors.textSecondary} style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Sign out to login as different user</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    padding: spacing.xl,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  logoutButton: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});
