import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { spacing } from '../../styles/spacing';

const teamSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  departmentId: z.coerce.number().int().positive("Valid Department ID required"),
  managerId: z.coerce.number().int().positive("Valid Manager ID required").optional().or(z.literal('')),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const TeamForm = ({ defaultValues, onSubmit, isSubmitting }) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: defaultValues || {
      name: '',
      departmentId: '',
      managerId: '',
      status: 'ACTIVE'
    }
  });

  const submitHandler = (data) => {
    // If managerId is empty string, convert to undefined
    if (data.managerId === '') {
      data.managerId = undefined;
    }
    onSubmit(data);
  };

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Team Name"
            placeholder="e.g. Engineering Alpha"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="departmentId"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Department ID"
            placeholder="e.g. 1"
            keyboardType="numeric"
            value={value?.toString()}
            onChangeText={onChange}
            error={errors.departmentId?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="managerId"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Manager ID (Optional)"
            placeholder="e.g. 5"
            keyboardType="numeric"
            value={value?.toString()}
            onChangeText={onChange}
            error={errors.managerId?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="status"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Status (ACTIVE or INACTIVE)"
            placeholder="ACTIVE"
            autoCapitalize="characters"
            value={value}
            onChangeText={onChange}
            error={errors.status?.message}
          />
        )}
      />

      <Button 
        title="Save Team" 
        onPress={handleSubmit(submitHandler)} 
        loading={isSubmitting}
        style={styles.submitBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: spacing.md,
  },
  submitBtn: {
    marginTop: spacing.md,
  }
});
