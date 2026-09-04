import React from 'react';
import { View, StyleSheet, Text, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { spacing } from '../../styles/spacing';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

const teamSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  managerName: z.string().trim().optional().or(z.literal('')),
  employeeCount: z.union([z.coerce.number().int().min(0), z.literal('')]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const TeamForm = ({ defaultValues, onSubmit, isSubmitting }) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: defaultValues || {
      name: '',
      managerName: '',
      employeeCount: '',
      status: 'ACTIVE'
    }
  });

  const submitHandler = (data) => {
    if (data.managerName === '') {
      data.managerName = undefined;
    }
    if (data.employeeCount === '') {
      data.employeeCount = undefined;
    }
    onSubmit(data);
  };

  return (
    <Card style={styles.formCard}>
      <Text style={styles.title}>Team Details</Text>

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Team Name"
            placeholder="e.g. HR Team"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="managerName"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Team Head"
            placeholder="Enter Team Head Name"
            value={value}
            onChangeText={onChange}
            error={errors.managerName?.message}
          />
        )}
      />

      {!defaultValues && (
        <Controller
          control={control}
          name="employeeCount"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Assign Employees"
              placeholder="Enter number of employees"
              value={value?.toString()}
              onChangeText={onChange}
              keyboardType="numeric"
              error={errors.employeeCount?.message}
            />
          )}
        />
      )}

      <Controller
        control={control}
        name="status"
        render={({ field: { onChange, value } }) => (
          <View style={styles.switchContainer}>
            <View>
              <Text style={styles.switchLabel}>Team Access</Text>
              <Text style={styles.switchSubLabel}>{value === 'ACTIVE' ? 'Active' : 'Inactive'}</Text>
            </View>
            <Switch
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={value === 'ACTIVE' ? colors.primary : colors.textMuted}
              onValueChange={(val) => onChange(val ? 'ACTIVE' : 'INACTIVE')}
              value={value === 'ACTIVE'}
            />
          </View>
        )}
      />

      {defaultValues && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Employees</Text>
          <Text style={styles.infoValue}>{defaultValues.members?.length || 0} Employees</Text>
        </View>
      )}

      <Button 
        title={defaultValues ? "Update Team" : "Create Team"} 
        onPress={handleSubmit(submitHandler)} 
        isLoading={isSubmitting}
        style={styles.submitBtn}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  formCard: {
    margin: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  switchSubLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  submitBtn: {
    marginTop: spacing.md,
  }
});
