import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
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

export const ManageEmployeesModal = ({
  visible,
  team,
  onClose,
  onUpdated,
}) => {
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectorVisible, setIsSelectorVisible] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (visible && team?.id) {
      loadTeamMembers();
      loadAllEmployees();
    }
  }, [visible, team?.id]);

  const loadTeamMembers = async () => {
    try {
      setIsLoading(true);
      const res = await teamApi.getTeamById(team.id);
      setMembers(res.data?.members || []);
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllEmployees = async () => {
    try {
      const res = await employeeApi.getEmployees().catch(() => ({ data: [] }));
      setAllEmployees(res.data || []);
    } catch (err) {
      console.error('Failed to load all employees:', err);
    }
  };

  if (!visible || !team) return null;

  // Available employees to add: not already in this team
  const currentMemberIds = members.map((m) => m.id);
  const selectableEmployees = allEmployees
    .filter((emp) => !currentMemberIds.includes(emp.id))
    .map((emp) => ({
      id: emp.id,
      title: emp.user?.name || emp.name || 'Employee',
      subtitle: `EMP${String(emp.id).padStart(4, '0')} · ${emp.designation || 'Staff'}`,
      badge: emp.team?.name ? `In: ${emp.team.name}` : 'Unassigned',
    }));

  const handleAddEmployees = async (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return;
    try {
      setIsLoading(true);
      await teamApi.updateTeam(team.id, {
        addEmployeeIds: selectedIds,
      });
      toast.show('✓ Employees added successfully', 'success');
      await loadTeamMembers();
      onUpdated?.();
    } catch (err) {
      toast.show(err?.response?.data?.message || 'Failed to add employees', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRemove = async () => {
    if (!employeeToRemove) return;
    try {
      setIsRemoving(true);
      await teamApi.updateTeam(team.id, {
        removeEmployeeIds: [employeeToRemove.id],
      });
      toast.show('✓ Employee removed from team', 'success');
      setEmployeeToRemove(null);
      await loadTeamMembers();
      onUpdated?.();
    } catch (err) {
      toast.show(err?.response?.data?.message || 'Failed to remove employee', 'error');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
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
          <SafeAreaView style={styles.sheetContainer}>
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.title}>Manage Team Employees</Text>
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

            {/* Action toolbar */}
            <View style={styles.toolbar}>
              <Text style={styles.memberCountText}>
                {members.length} {members.length === 1 ? 'Employee' : 'Employees'} in Team
              </Text>
              <TouchableOpacity
                style={styles.addBtn}
                activeOpacity={0.8}
                onPress={() => setIsSelectorVisible(true)}
              >
                <MaterialIcons name="person-add" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Add Employee</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Updating team members...</Text>
              </View>
            ) : (
              <FlatList
                data={members}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const empName = item.user?.name || 'Employee';
                  const empCode = `EMP${String(item.id).padStart(4, '0')}`;
                  const designation = item.designation || 'Staff';
                  const status = item.user?.status || item.approvalStatus || 'ACTIVE';
                  const isActive = status === 'ACTIVE' || status === 'APPROVED';

                  return (
                    <View style={styles.memberRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {empName[0].toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.memberInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {empName}
                          </Text>
                          <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
                            <Text style={[styles.statusText, isActive ? styles.textActive : styles.textInactive]}>
                              {isActive ? 'Active' : 'Inactive'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.memberMeta} numberOfLines={1}>
                          {empCode} · {designation}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.removeBtn}
                        activeOpacity={0.7}
                        onPress={() => setEmployeeToRemove(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="person-remove" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  );
                }}
                ListEmptyComponent={() => (
                  <View style={styles.emptyBox}>
                    <MaterialIcons name="group-off" size={40} color={colors.border} />
                    <Text style={styles.emptyTitle}>No Employees in Team</Text>
                    <Text style={styles.emptySubtitle}>
                      Use "+ Add Employee" above to assign employees to {team.name}.
                    </Text>
                  </View>
                )}
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Remove Confirmation In-App Modal */}
      <Modal
        visible={!!employeeToRemove}
        transparent
        animationType="fade"
        onRequestClose={() => setEmployeeToRemove(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconCircle}>
              <MaterialIcons name="person-remove" size={24} color={colors.error} />
            </View>
            <Text style={styles.confirmTitle}>Remove Employee from Team?</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to remove{' '}
              <Text style={{ fontWeight: '700', color: colors.textPrimary }}>
                {employeeToRemove?.user?.name || 'this employee'}
              </Text>{' '}
              from <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{team.name}</Text>?
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.7}
                onPress={() => setEmployeeToRemove(null)}
                disabled={isRemoving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                activeOpacity={0.8}
                onPress={confirmRemove}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteBtnText}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Searchable selector for adding employees */}
      <SearchableSelectorModal
        visible={isSelectorVisible}
        title="Add Employees to Team"
        items={selectableEmployees}
        isMulti={true}
        onSelect={handleAddEmployees}
        onClose={() => setIsSelectorVisible(false)}
        placeholder="Search employees to add..."
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
    maxHeight: '88%',
    minHeight: '55%',
    ...Platform.select({
      web: {
        maxWidth: 520,
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  memberCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingBox: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.full,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  textActive: {
    color: '#059669',
  },
  textInactive: {
    color: '#DC2626',
  },
  memberMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
  deleteBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
