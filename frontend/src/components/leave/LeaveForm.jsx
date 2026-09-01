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

const leaveSchema = z.object({
  type: z.enum(["CASUAL", "SICK", "ANNUAL", "UNPAID"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  reason: z.string().trim().min(5, "Reason must be at least 5 characters"),
}).refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
  message: "End date must be after or equal to start date",
  path: ["endDate"],
});

export const LeaveForm = ({ onSubmit, isSubmitting }) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      type: 'CASUAL',
      startDate: '',
      endDate: '',
      reason: ''
    }
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Leave Type (CASUAL, SICK, ANNUAL, UNPAID)"
            value={value}
            onChangeText={onChange}
            autoCapitalize="characters"
            error={errors.type?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="startDate"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Start Date (YYYY-MM-DD)"
            placeholder="2026-09-01"
            value={value}
            onChangeText={onChange}
            error={errors.startDate?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="endDate"
        render={({ field: { onChange, value } }) => (
          <Input
            label="End Date (YYYY-MM-DD)"
            placeholder="2026-09-05"
            value={value}
            onChangeText={onChange}
            error={errors.endDate?.message}
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
        title="Submit Leave Request" 
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
