import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTeam, useUpdateTeam, useDeleteTeam } from '../../../../hooks/useTeam';
import { useToast } from '../../../../components/ui/Toast';
import { TeamForm } from '../../../../components/team/TeamForm';
import { ManageEmployeesModal } from '../../../../components/team/ManageEmployeesModal';
import { ChangeTeamHeadModal } from '../../../../components/team/ChangeTeamHeadModal';
import { TeamCredentialModal } from '../../../../components/team/TeamCredentialModal';
import { colors } from '../../../../styles/colors';
import { spacing, radius } from '../../../../styles/spacing';
import { typography } from '../../../../styles/typography';

export default function TeamDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isManageEmployeesOpen, setIsManageEmployeesOpen] = useState(false);
  const [isChangeHeadOpen, setIsChangeHeadOpen] = useState(false);
  const [credentialData, setCredentialData] = useState(null);

  // In-App Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDestructive: false,
    onConfirm: null,
    isProcessing: false,
  });

  const { data: teamResponse, isLoading, error, refetch } = useTeam(id);
  const updateTeamMutation = useUpdateTeam();
  const deleteTeamMutation = useDeleteTeam();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading team details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !teamResponse?.data) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>Unable to load team</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const team = teamResponse.data;
  const attendance = team.attendanceSummary;
  const hasAttendanceData = attendance && attendance.hasData && attendance.total > 0;
  const members = team.members || [];
  const isActive = team.status === 'ACTIVE';

  const handleUpdate = async (formData) => {
    try {
      const res = await updateTeamMutation.mutateAsync({ id, data: formData });
      if (res.success) {
        toast.show('✓ Team updated successfully', 'success');
        setIsEditing(false);
        refetch();
      } else {
        toast.show(res.message || 'Failed to update team', 'error');
      }
    } catch (error) {
      toast.show(error?.response?.data?.message || 'Failed to update team', 'error');
    }
  };

  const handleToggleStatus = () => {
    const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
    const actionName = isActive ? 'Deactivate' : 'Activate';

    setConfirmModal({
      visible: true,
      title: `${actionName} Team`,
      message: `Are you sure you want to ${actionName.toLowerCase()} ${team?.name}?`,
      confirmText: actionName,
      isDestructive: isActive,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
          await updateTeamMutation.mutateAsync({ id, data: { status: newStatus } });
          toast.show(`✓ Team ${actionName.toLowerCase()}d successfully`, 'success');
          refetch();
          setConfirmModal({ visible: false });
        } catch (err) {
          toast.show(err?.response?.data?.message || `Failed to ${actionName.toLowerCase()} team`, 'error');
          setConfirmModal({ visible: false });
        }
      },
    });
  };

  const handleDelete = () => {
    setConfirmModal({
      visible: true,
      title: 'Delete Team',
      message: `Are you sure you want to delete "${team?.name}"? Employees assigned to this team will become unassigned.`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
          const res = await deleteTeamMutation.mutateAsync(id);
          if (res.success) {
            toast.show('✓ Team deleted successfully', 'success');
            setConfirmModal({ visible: false });
            router.back();
          } else {
            toast.show(res.message || 'Failed to delete team', 'error');
            setConfirmModal({ visible: false });
          }
        } catch (error) {
          toast.show(error?.response?.data?.message || 'Failed to delete team', 'error');
          setConfirmModal({ visible: false });
        }
      },
    });
  };

  if (isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.editHeaderBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setIsEditing(false)}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={styles.backText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Team</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TeamForm
            defaultValues={{
              name: team.name,
              departmentId: team.departmentId || team.department?.id,
              departmentName: team.department?.name || '',
              managerId: team.managerId || team.manager?.id,
              employeeCount: team.employeeCount !== undefined ? team.employeeCount : (team.members?.length || 0),
              status: team.status,
              description: team.description,
            }}
            onSubmit={handleUpdate}
            isSubmitting={updateTeamMutation.isPending}
            isEdit={true}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Team Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={styles.titleWrap}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.departmentName}>
                {team.department?.name ? `${team.department.name} Department` : 'General Department'}
              </Text>
            </View>
            <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
              <Text style={[styles.statusText, isActive ? styles.textActive : styles.textInactive]}>
                {isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>TEAM HEAD</Text>
              <View style={styles.headWrap}>
                <View style={styles.headAvatar}>
                  <Text style={styles.headAvatarText}>
                    {(team.manager?.name || 'U')[0].toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.headName} numberOfLines={1}>
                  {team.manager?.name || 'Unassigned'}
                </Text>
              </View>
            </View>

            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>EMPLOYEES</Text>
              <Text style={styles.empCountText}>
                {team.employeeCount !== undefined ? team.employeeCount : members.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => setIsEditing(true)}
          >
            <MaterialIcons name="edit" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => setIsManageEmployeesOpen(true)}
          >
            <MaterialIcons name="group-add" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>Members</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => setIsChangeHeadOpen(true)}
          >
            <MaterialIcons name="swap-horiz" size={18} color={colors.primary} />
            <Text style={styles.actionBtnText}>Head</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={handleToggleStatus}
          >
            <MaterialIcons
              name={isActive ? 'block' : 'check-circle'}
              size={18}
              color={isActive ? '#D97706' : colors.success}
            />
            <Text style={[styles.actionBtnText, { color: isActive ? '#D97706' : colors.success }]}>
              {isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today's Attendance */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="event-available" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Today's Attendance</Text>
          </View>

          {hasAttendanceData ? (
            <View style={styles.attendanceGrid}>
              <View style={[styles.attendBox, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.attendCount, { color: '#047857' }]}>
                  {attendance.present || 0}
                </Text>
                <Text style={[styles.attendName, { color: '#065F46' }]}>Present</Text>
              </View>

              <View style={[styles.attendBox, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.attendCount, { color: '#B45309' }]}>
                  {attendance.late || 0}
                </Text>
                <Text style={[styles.attendName, { color: '#92400E' }]}>Late</Text>
              </View>

              <View style={[styles.attendBox, { backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.attendCount, { color: '#DC2626' }]}>
                  {attendance.absent || 0}
                </Text>
                <Text style={[styles.attendName, { color: '#991B1B' }]}>Absent</Text>
              </View>

              <View style={[styles.attendBox, { backgroundColor: '#F5F3FF' }]}>
                <Text style={[styles.attendCount, { color: '#7C3AED' }]}>
                  {attendance.leave || 0}
                </Text>
                <Text style={[styles.attendName, { color: '#5B21B6' }]}>Leave</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noAttendanceBox}>
              <MaterialIcons name="schedule" size={18} color={colors.textMuted} />
              <Text style={styles.noAttendanceText}>
                No attendance recorded for today yet.
              </Text>
            </View>
          )}
        </View>

        {/* Team Members */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderBetween}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="people-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Team Members</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{members.length}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.manageLink}
              onPress={() => setIsManageEmployeesOpen(true)}
            >
              <Text style={styles.manageLinkText}>Manage</Text>
            </TouchableOpacity>
          </View>

          {members.length === 0 ? (
            <View style={styles.emptyMembersBox}>
              <MaterialIcons name="person-outline" size={32} color={colors.border} />
              <Text style={styles.emptyMembersText}>No employees assigned to this team.</Text>
            </View>
          ) : (
            <View style={styles.memberList}>
              {members.map((emp) => {
                const empUser = emp.user;
                const empName = empUser?.name || 'Employee';
                const designation = emp.designation || 'Staff';
                const empCode = `EMP${String(emp.id).padStart(4, '0')}`;
                const status = empUser?.status || emp.approvalStatus || 'ACTIVE';
                const isEmpActive = status === 'ACTIVE' || status === 'APPROVED';

                return (
                  <View key={emp.id} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.avatarLetter}>
                        {empName[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.empNameText} numberOfLines={1}>
                          {empName}
                        </Text>
                        <View style={[styles.empStatusDot, { backgroundColor: isEmpActive ? '#10B981' : '#EF4444' }]} />
                      </View>
                      <Text style={styles.empMetaText} numberOfLines={1}>
                        {empCode} · {designation}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Delete button at bottom */}
        <TouchableOpacity
          style={styles.deleteTeamBtn}
          activeOpacity={0.8}
          onPress={handleDelete}
        >
          <MaterialIcons name="delete-outline" size={18} color={colors.error} />
          <Text style={styles.deleteTeamText}>Delete Team</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <ManageEmployeesModal
        visible={isManageEmployeesOpen}
        team={team}
        onClose={() => setIsManageEmployeesOpen(false)}
        onUpdated={refetch}
      />

      <ChangeTeamHeadModal
        visible={isChangeHeadOpen}
        team={team}
        onClose={() => setIsChangeHeadOpen(false)}
        onSuccess={(creds) => {
          refetch();
          if (creds) {
            setCredentialData(creds);
          } else {
            toast.show('✓ Team Head updated successfully', 'success');
          }
        }}
      />

      <TeamCredentialModal
        visible={!!credentialData}
        credentials={credentialData}
        onClose={() => setCredentialData(null)}
      />

      {/* In-App Action Confirmation Modal */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!confirmModal.isProcessing) {
            setConfirmModal({ visible: false });
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmDialog}>
            <View style={[styles.dialogIconCircle, confirmModal.isDestructive ? styles.dialogIconDanger : styles.dialogIconPrimary]}>
              <MaterialIcons
                name={confirmModal.isDestructive ? 'delete-outline' : 'info-outline'}
                size={26}
                color={confirmModal.isDestructive ? colors.error : colors.primary}
              />
            </View>
            <Text style={styles.dialogTitle}>{confirmModal.title}</Text>
            <Text style={styles.dialogMessage}>{confirmModal.message}</Text>

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                activeOpacity={0.7}
                disabled={confirmModal.isProcessing}
                onPress={() => setConfirmModal({ visible: false })}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dialogConfirmBtn,
                  confirmModal.isDestructive ? styles.btnPrimaryDanger : styles.btnPrimarySolid,
                ]}
                activeOpacity={0.8}
                disabled={confirmModal.isProcessing}
                onPress={confirmModal.onConfirm}
              >
                {confirmModal.isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.dialogConfirmText}>
                    {confirmModal.confirmText}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.textSecondary,
  },
  errorTitle: {
    marginTop: spacing.sm,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  editHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  backText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  overviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  departmentName: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textActive: {
    color: '#059669',
  },
  textInactive: {
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaBox: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flexShrink: 1,
  },
  empCountText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  manageLink: {
    padding: 4,
  },
  manageLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  attendanceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  attendBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attendCount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  attendName: {
    fontSize: 11,
    fontWeight: '600',
  },
  noAttendanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: radius.md,
  },
  noAttendanceText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyMembersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  emptyMembersText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  memberList: {
    gap: 10,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarLetter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  empNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  empStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  empMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  deleteTeamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    marginTop: spacing.sm,
  },
  deleteTeamText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmDialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 380,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dialogIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  dialogIconDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  dialogIconPrimary: {
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
  },
  dialogActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  dialogCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dialogConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimarySolid: {
    backgroundColor: colors.primary,
  },
  btnPrimaryDanger: {
    backgroundColor: colors.error,
  },
  dialogConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
