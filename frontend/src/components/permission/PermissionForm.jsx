import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { spacing } from '../../styles/spacing';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

const permissionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Use HH:MM"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Use HH:MM"),
  reason: z.string().trim().min(5, "Reason must be at least 5 characters"),
}).refine((data) => {
  const start = new Date(`1970-01-01T${data.startTime}`);
  const end = new Date(`1970-01-01T${data.endTime}`);
  return start < end;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const PermissionForm = ({ onSubmit, isSubmitting }) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      date: '',
      startTime: '',
      endTime: '',
      reason: ''
    }
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="date"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Date (YYYY-MM-DD)"
            placeholder="2026-09-01"
            value={value}
            onChangeText={onChange}
            error={errors.date?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="startTime"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Start Time (HH:MM)"
            placeholder="14:00"
            value={value}
            onChangeText={onChange}
            error={errors.startTime?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="endTime"
        render={({ field: { onChange, value } }) => (
          <Input
            label="End Time (HH:MM)"
            placeholder="16:00"
            value={value}
            onChangeText={onChange}
            error={errors.endTime?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="reason"
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Reason</Text>
            <Input
              multiline
              numberOfLines={4}
              value={value}
              onChangeText={onChange}
              error={errors.reason?.message}
              style={styles.textArea}
            />
          </View>
        )}
      />

      <Button 
        title="Submit Request" 
        onPress={handleSubmit(onSubmit)} 
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
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: typography.fontWeight.medium,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: spacing.md,
  }
});
