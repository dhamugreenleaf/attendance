import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialIcons } from '@expo/vector-icons';
import { Input } from '../ui/Input';
import { SearchableSelectorModal } from './SearchableSelectorModal';
import { employeeApi } from '../../services/employee.api';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const teamValidationSchema = z.object({
  name: z.string().trim().min(2, 'Team name must be at least 2 characters').max(100),
  departmentName: z.string().trim().min(1, 'Department is required').max(100),
  managerId: z.number({ required_error: 'Team Head is required', invalid_type_error: 'Team Head is required' }).positive('Team Head is required'),
  employeeCount: z.union([z.string(), z.number()]).refine((val) => {
    if (val === '' || val === undefined || val === null) return false;
    const n = Number(val);
    return !isNaN(n) && n >= 0;
  }, { message: 'Please enter a valid number of members' }),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  description: z.string().trim().optional(),
});

export const TeamForm = ({ defaultValues, onSubmit, isSubmitting, isEdit = false }) => {
  const [employees, setEmployees] = useState([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Head selector modal
  const [headModalVisible, setHeadModalVisible] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(teamValidationSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      departmentName: defaultValues?.department?.name || defaultValues?.departmentName || '',
      managerId: defaultValues?.managerId || defaultValues?.manager?.id || undefined,
      employeeCount: defaultValues?.employeeCount !== undefined 
        ? defaultValues.employeeCount.toString() 
        : (defaultValues?.members?.length !== undefined ? defaultValues.members.length.toString() : ''),
      status: defaultValues?.status || 'ACTIVE',
      description: defaultValues?.description || '',
    },
  });

  const selectedManagerId = watch('managerId');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setIsLoadingMetadata(true);
      const empRes = await employeeApi.getEmployees().catch(() => ({ data: [] }));
      setEmployees(empRes.data || []);
    } catch (err) {
      console.error('Error loading employees:', err);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const employeeOptions = useMemo(() => {
    return employees.map((emp) => ({
      id: emp.user?.id || emp.userId,
      empRecordId: emp.id,
      title: emp.user?.name || emp.name || 'Employee',
      subtitle: `EMP${String(emp.id).padStart(4, '0')} · ${emp.designation || 'Staff'}`,
      badge: emp.department?.name || emp.team?.name || 'Staff',
    }));
  }, [employees]);

  const selectedHead = employees.find(
    (e) => (e.user?.id || e.userId) === selectedManagerId
  );

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      employeeCount: Number(data.employeeCount) || 0,
    });
  };

  if (isLoadingMetadata) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Loading staff data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.formContainer}>
      {/* 1. Core Team Information Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="info-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>General Information</Text>
        </View>

        {/* Team Name (Typing) */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Team Name *"
              placeholder="e.g. Development Team"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        {/* Department (Direct Typing - No Dropdown) */}
        <Controller
          control={control}
          name="departmentName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Department *"
              placeholder="e.g. Engineering, Sales, HR"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.departmentName?.message}
            />
          )}
        />
      </View>

      {/* 2. Team Leadership & Members Count Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="people-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Leadership & Staff Count</Text>
        </View>

        {/* Team Head Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Team Head *</Text>
          <TouchableOpacity
            style={[styles.selectorBox, errors.managerId && styles.selectorBoxError]}
            activeOpacity={0.7}
            onPress={() => setHeadModalVisible(true)}
          >
            <View style={styles.selectorContent}>
              <MaterialIcons
                name="person-outline"
                size={18}
                color={selectedHead ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.selectorText,
                  !selectedHead && styles.selectorPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedHead
                  ? `${selectedHead.user?.name || selectedHead.name}`
                  : 'Select Team Head'}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          {selectedHead && (
            <Text style={styles.fieldHelper}>
              EMP{String(selectedHead.id).padStart(4, '0')} · {selectedHead.designation || 'Team Head'}
            </Text>
          )}
          {errors.managerId && (
            <Text style={styles.errorText}>{errors.managerId.message}</Text>
          )}
        </View>

        {/* Assign Employees (Members Based Numbers Only Allowed) */}
        <Controller
          control={control}
          name="employeeCount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Assign Employees (Number of Members) *"
              placeholder="e.g. 10, 25, 30"
              value={value !== undefined && value !== null ? value.toString() : ''}
              onBlur={onBlur}
              onChangeText={(text) => {
                // Strictly allow numbers only
                const numericOnly = text.replace(/[^0-9]/g, '');
                onChange(numericOnly);
              }}
              keyboardType="numeric"
              error={errors.employeeCount?.message}
            />
          )}
        />
      </View>

      {/* 3. Settings Section */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="settings" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Settings</Text>
        </View>

        {/* Description (Optional) */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter brief team overview..."
                placeholderTextColor={colors.textMuted}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
              />
            </View>
          )}
        />

        {/* Team Status Switch */}
        <Controller
          control={control}
          name="status"
          render={({ field: { onChange, value } }) => {
            const isActive = value === 'ACTIVE';
            return (
              <View style={styles.switchContainer}>
                <View style={styles.switchLabelWrap}>
                  <Text style={styles.switchLabel}>Team Status</Text>
                  <View style={[styles.statusPill, isActive ? styles.pillActive : styles.pillInactive]}>
                    <Text style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}>
                      {isActive ? 'Active Team' : 'Inactive Team'}
                    </Text>
                  </View>
                </View>
                <Switch
                  trackColor={{ false: colors.border, true: 'rgba(26, 54, 93, 0.3)' }}
                  thumbColor={isActive ? colors.primary : colors.textMuted}
                  onValueChange={(val) => onChange(val ? 'ACTIVE' : 'INACTIVE')}
                  value={isActive}
                />
              </View>
            );
          }}
        />
      </View>

      {/* 4. Action Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          activeOpacity={0.85}
          disabled={isSubmitting}
          onPress={handleSubmit(handleFormSubmit)}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEdit ? 'Save Changes' : 'Create Team'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Team Head Selector Modal */}
      <SearchableSelectorModal
        visible={headModalVisible}
        title="Select Team Head"
        items={employeeOptions}
        selectedValue={selectedManagerId}
        onSelect={(emp) => setValue('managerId', emp.id, { shouldValidate: true })}
        onClose={() => setHeadModalVisible(false)}
        placeholder="Search employees for Team Head..."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingBox: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  formContainer: {
    width: '100%',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  fieldHelper: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
    marginLeft: 2,
  },
  selectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  selectorBoxError: {
    borderColor: colors.error,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectorText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  selectorPlaceholder: {
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 11,
    color: colors.error,
    marginTop: 3,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabelWrap: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    marginTop: 2,
  },
  pillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  pillInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#059669',
  },
  pillTextInactive: {
    color: '#DC2626',
  },
  submitContainer: {
    marginTop: 4,
    marginBottom: 24,
  },
  submitButton: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(26, 54, 93, 0.2)',
      },
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
