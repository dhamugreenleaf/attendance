import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useToast } from '../ui/Toast';
import { teamApi } from '../../services/team.api';
import { employeeApi } from '../../services/employee.api';
import { SearchableSelectorModal } from './SearchableSelectorModal';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';
import { typography } from '../../styles/typography';

export const ChangeTeamHeadModal = ({
  visible,
  team,
  onClose,
  onSuccess, // (credentials) => void
}) => {
  const toast = useToast();
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [generateCredentials, setGenerateCredentials] = useState(true);
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadEmployees();
      setSelectedEmployee(null);
      setShowConfirm(false);
    }
  }, [visible]);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await employeeApi.getEmployees().catch(() => ({ data: [] }));
      setAllEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to load employees for team head selection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible || !team) return null;

  const currentManagerId = team?.manager?.id || team?.managerId;
  const currentHeadName = team.manager?.name || 'Unassigned';

  const selectableEmployees = allEmployees
    .filter((emp) => (emp.user?.id || emp.userId) !== currentManagerId)
    .map((emp) => ({
      id: emp.user?.id || emp.userId,
      empRecordId: emp.id,
      title: emp.user?.name || emp.name || 'Employee',
      subtitle: `EMP${String(emp.id).padStart(4, '0')} · ${emp.designation || 'Staff'}`,
      badge: emp.department?.name || emp.team?.name || 'Staff',
      raw: emp,
    }));

  const handleSelectEmployee = (item) => {
    setSelectedEmployee(item);
  };

  const handleProceedToConfirm = () => {
    if (!selectedEmployee) {
      toast.show('Please select a new Team Head.', 'error');
      return;
    }
    setShowConfirm(true);
  };

  const handleSave = async () => {
    if (!selectedEmployee) return;

    try {
      setIsSubmitting(true);
      const res = await teamApi.updateTeam(team.id, {
        managerId: selectedEmployee.id,
        generateCredentials,
      });

      if (res.success) {
        setShowConfirm(false);
        onClose();
        const creds = res.data?.credentials
          ? { ...res.data.credentials, teamName: team.name }
          : null;
        onSuccess?.(creds);
      } else {
        toast.show(res.message || 'Failed to update Team Head', 'error');
      }
    } catch (err) {
      toast.show(err?.response?.data?.message || 'Failed to update Team Head', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible && !showConfirm}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={styles.sheetContainer}>
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.title}>Change Team Head</Text>
                <Text style={styles.subtitle}>{team.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.body}>
              {/* Current Head */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionLabel}>CURRENT TEAM HEAD</Text>
                <View style={styles.currentHeadRow}>
                  <View style={styles.headAvatar}>
                    <Text style={styles.headAvatarText}>
                      {currentHeadName[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.headInfo}>
                    <Text style={styles.headName}>{currentHeadName}</Text>
                    <Text style={styles.headRole}>Team Lead</Text>
                  </View>
                </View>
              </View>

              {/* New Head Selector */}
              <View style={styles.sectionBox}>
                <Text style={styles.sectionLabel}>NEW TEAM HEAD *</Text>
                <TouchableOpacity
                  style={[
                    styles.selectorTrigger,
                    selectedEmployee && styles.selectorTriggerFilled,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setIsSelectorVisible(true)}
                >
                  <View style={styles.selectorContent}>
                    <MaterialIcons
                      name="person-search"
                      size={20}
                      color={selectedEmployee ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.selectorText,
                        !selectedEmployee && styles.selectorPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {selectedEmployee ? selectedEmployee.title : 'Select new Team Head'}
                    </Text>
                  </View>
                  <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
                {selectedEmployee && (
                  <Text style={styles.selectedSubtitle}>
                    {selectedEmployee.subtitle}
                  </Text>
                )}
              </View>

              {/* Generate credentials switch */}
              <View style={styles.switchRow}>
                <View style={styles.switchTextWrap}>
                  <Text style={styles.switchTitle}>Generate Login Credentials</Text>
                  <Text style={styles.switchDesc}>
                    Creates temporary login password for the new Team Head
                  </Text>
                </View>
                <Switch
                  value={generateCredentials}
                  onValueChange={setGenerateCredentials}
                  trackColor={{ false: colors.border, true: 'rgba(26, 54, 93, 0.3)' }}
                  thumbColor={generateCredentials ? colors.primary : colors.textMuted}
                />
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueBtn,
                  !selectedEmployee && styles.continueBtnDisabled,
                ]}
                activeOpacity={0.8}
                disabled={!selectedEmployee}
                onPress={handleProceedToConfirm}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconCircle}>
              <MaterialIcons name="swap-horiz" size={26} color={colors.primary} />
            </View>

            <Text style={styles.confirmTitle}>Confirm Team Head Change</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to appoint{' '}
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                {selectedEmployee?.title}
              </Text>{' '}
              as the new Team Head for{' '}
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                {team.name}
              </Text>
              ?
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.7}
                onPress={() => setShowConfirm(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                activeOpacity={0.8}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm & Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Employee Searchable Selector */}
      <SearchableSelectorModal
        visible={isSelectorVisible}
        title="Select New Team Head"
        items={selectableEmployees}
        selectedValue={selectedEmployee?.id}
        onSelect={handleSelectEmployee}
        onClose={() => setIsSelectorVisible(false)}
        placeholder="Search eligible employees..."
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    ...Platform.select({
      web: {
        maxWidth: 480,
        alignSelf: 'center',
        width: '100%',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  body: {
    padding: spacing.lg,
  },
  sectionBox: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  currentHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  headInfo: {
    flex: 1,
  },
  headName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headRole: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  selectorTriggerFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(26, 54, 93, 0.02)',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  selectorPlaceholder: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  selectedSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  switchTextWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  switchDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  continueBtn: {
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  confirmCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
