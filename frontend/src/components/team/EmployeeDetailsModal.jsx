import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { spacing, radius } from '../../styles/spacing';
import { attendanceApi } from '../../services/attendance.api';
import { employeeApi } from '../../services/employee.api';
import { useAuth } from '../../hooks/useAuth';

const editSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').regex(/^[a-zA-Z\s]*$/, 'Only alphabets are allowed'),
  designation: z.string().min(2, 'Role is required').regex(/^[a-zA-Z\s]*$/, 'Only alphabets are allowed'),
  phone: z.string().length(10, 'Phone number must be exactly 10 digits').regex(/^\d+$/, 'Only numbers are allowed'),
});

export const EmployeeDetailsModal = ({ visible, employee, mode: initialMode = 'view', onClose, onUpdate }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'view', 'edit', 'create'
  const [summary, setSummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      designation: '',
      phone: '',
    }
  });

  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      if (initialMode === 'create') {
        reset({ name: '', designation: '', phone: '' });
        setSummary(null);
      } else if (employee) {
        reset({
          name: employee.user?.name || employee.name || '',
          designation: employee.designation || '',
          phone: employee.phone || '',
        });
        if (initialMode === 'view') {
          loadSummary();
        }
      }
    }
  }, [visible, employee, initialMode]);

  const loadSummary = async () => {
    if (!employee?.id) return;
    setIsLoadingSummary(true);
    try {
      const now = new Date();
      const res = await attendanceApi.getEmployeeMonthlySummary(employee.id, now.getFullYear(), now.getMonth() + 1);
      setSummary(res.data);
    } catch (error) {
      console.error('Failed to load monthly summary', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleSave = async (data) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        data.teamId = user?.teamId; // Default to current TL's team
        const res = await employeeApi.createEmployee(data);
        if (res.success) {
          setSuccessMsg('Employee created successfully!');
          onUpdate();
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        const res = await employeeApi.updateEmployee(employee.id, data);
        if (res.success) {
          setSuccessMsg('Employee details updated successfully!');
          onUpdate();
          setTimeout(() => {
            setMode('view');
          }, 1500);
        }
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save employee details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to completely delete ${(employee.user?.name || employee.name)}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await employeeApi.deleteEmployee(employee.id);
              onUpdate();
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete employee');
            }
          }
        }
      ]
    );
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return 'U';
    return nameStr.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formatText = (text) => {
    const filtered = text.replace(/[^a-zA-Z\s]/g, '');
    return filtered.split(' ').map(word => {
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    }).join(' ');
  };

  const formatPhone = (text) => {
    return text.replace(/[^\d]/g, '');
  };

  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // If visible but no employee and not creating, return null
  if (visible && !employee && mode !== 'create') return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <View style={styles.headerIconContainer}>
                  <MaterialIcons 
                    name={mode === 'create' ? 'person-add' : mode === 'edit' ? 'edit' : 'person'} 
                    size={24} 
                    color={colors.primary} 
                  />
                </View>
                <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
                  {mode === 'edit' ? 'Edit Employee' : mode === 'create' ? 'Add New Employee' : 'Employee Details'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {mode === 'view' && employee ? (
                <View style={styles.viewContainer}>
                  <View style={styles.profileHeader}>
                    <View style={styles.avatarLarge}>
                      <Text style={styles.avatarTextLarge}>
                        {getInitials(employee.user?.name || employee.name)}
                      </Text>
                    </View>
                    <Text style={styles.empName}>{employee.user?.name || employee.name}</Text>
                    <Text style={styles.empRole}>{employee.designation || 'Team Member'}</Text>
                    <View style={styles.phoneBadge}>
                      <MaterialIcons name="phone" size={14} color={colors.textSecondary} style={{marginRight: 4}}/>
                      <Text style={styles.empPhone}>{employee.phone || 'No phone number'}</Text>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>This Month's Attendance</Text>
                    <View style={styles.statsContainer}>
                      {isLoadingSummary ? (
                        <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl, flex: 1 }} />
                      ) : summary ? (
                        <>
                          <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
                            <Text style={styles.statValue}>{summary.present || 0}</Text>
                            <Text style={styles.statLabel}>Present</Text>
                          </View>
                          <View style={[styles.statCard, { borderLeftColor: colors.error }]}>
                            <Text style={styles.statValue}>{summary.absent || 0}</Text>
                            <Text style={styles.statLabel}>Absent</Text>
                          </View>
                          <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
                            <Text style={styles.statValue}>{summary.late || 0}</Text>
                            <Text style={styles.statLabel}>Late</Text>
                          </View>
                        </>
                      ) : (
                        <Text style={styles.loadingText}>No data available.</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.viewActions}>
                    <Button 
                      title="Edit" 
                      variant="primary" 
                      onPress={() => setMode('edit')} 
                      style={styles.actionBtnHalf}
                      icon="edit"
                    />
                    <Button 
                      title="Delete" 
                      variant="outline" 
                      onPress={confirmDelete} 
                      style={[styles.actionBtnHalf, { borderColor: colors.error }]}
                      textStyle={{ color: colors.error }}
                      icon="delete"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.formContainer}>
                  {successMsg ? (
                    <View style={styles.successBanner}>
                      <MaterialIcons name="check-circle" size={20} color={colors.success} style={{marginRight: 8}} />
                      <Text style={styles.successText}>{successMsg}</Text>
                    </View>
                  ) : null}
                  
                  <View style={styles.inputGroup}>
                    <Controller
                      control={control}
                      name="name"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          label="Full Name *"
                          placeholder="Enter employee's full name"
                          onBlur={onBlur}
                          onChangeText={(text) => onChange(formatText(text))}
                          value={value}
                          error={errors.name?.message}
                        />
                      )}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Controller
                      control={control}
                      name="designation"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          label="Role / Designation *"
                          placeholder="e.g. Software Engineer"
                          onBlur={onBlur}
                          onChangeText={(text) => onChange(formatText(text))}
                          value={value}
                          error={errors.designation?.message}
                        />
                      )}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Controller
                      control={control}
                      name="phone"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          label="Phone Number *"
                          placeholder="Enter phone number"
                          keyboardType="phone-pad"
                          maxLength={10}
                          onBlur={onBlur}
                          onChangeText={(text) => onChange(formatPhone(text))}
                          value={value}
                          error={errors.phone?.message}
                        />
                      )}
                    />
                  </View>

                  <View style={styles.formActions}>
                    <Button 
                      title={mode === 'create' ? "Create Employee" : "Save Changes"} 
                      onPress={handleSubmit(handleSave)} 
                      isLoading={isSubmitting}
                      style={styles.fullWidthBtn}
                    />
                    <Button 
                      title="Cancel" 
                      variant="outline" 
                      onPress={() => mode === 'create' ? onClose() : setMode('view')} 
                      style={styles.fullWidthBtn}
                    />
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', // Centered for web/tablet, works for mobile too if max height is set
    alignItems: 'center',
    padding: spacing.md, // Reduced from lg to give more space on small mobiles
  },
  keyboardView: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '95%', // Allow a bit more height on mobile
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg, // Reduced from xl to save horizontal space
    width: '100%',
    maxHeight: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      }
    })
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md, // Reduced from xl
  },
  headerTitleContainer: {
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerIconContainer: {
    backgroundColor: colors.primary + '15',
    padding: spacing.sm,
    borderRadius: radius.full,
    marginRight: spacing.sm, 
  },
  title: {
    flex: 1, 
    fontSize: typography.fontSize.lg, // Reduced from xl
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.full,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  viewContainer: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg, // Reduced from xxl
  },
  avatarLarge: {
    width: 72, // Reduced from 100
    height: 72, // Reduced from 100
    borderRadius: 36, // Reduced from 50
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 4px 12px ${colors.primary}40`,
      }
    })
  },
  avatarTextLarge: {
    color: colors.surface,
    fontSize: 28, // Reduced from 36
    fontWeight: typography.fontWeight.bold,
  },
  empName: {
    fontSize: typography.fontSize.xl, // Reduced from xxl
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  empRole: {
    fontSize: typography.fontSize.sm, // Reduced from md
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, // Reduced from sm
    borderRadius: radius.full,
  },
  empPhone: {
    fontSize: typography.fontSize.xs, // Reduced from sm
    color: colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg, // Reduced from xxl
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs, // Reduced from sm
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm, // Reduced from md
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.sm, // Reduced from md
    borderRadius: radius.md,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xl, // Reduced from xxl
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10, // Very small text for stat labels to save space
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  loadingText: {
    textAlign: 'center',
    padding: spacing.md,
    color: colors.textMuted,
  },
  viewActions: {
    flexDirection: 'row', // Side-by-side to save vertical space
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtnHalf: {
    flex: 1, // Take up half the width
  },
  formActions: {
    flexDirection: 'column',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  fullWidthBtn: {
    width: '100%',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  successText: {
    color: colors.success,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  }
});
