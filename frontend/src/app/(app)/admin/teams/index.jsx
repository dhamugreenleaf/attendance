import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTeams, useUpdateTeam, useDeleteTeam } from '../../../../hooks/useTeam';
import { useAuth } from '../../../../hooks/useAuth';
import { useToast } from '../../../../components/ui/Toast';
import { TeamList } from '../../../../components/team/TeamList';
import { TeamActionMenu } from '../../../../components/team/TeamActionMenu';
import { TeamDetailsSheet } from '../../../../components/team/TeamDetailsSheet';
import { ManageEmployeesModal } from '../../../../components/team/ManageEmployeesModal';
import { ChangeTeamHeadModal } from '../../../../components/team/ChangeTeamHeadModal';
import { TeamCredentialModal } from '../../../../components/team/TeamCredentialModal';
import { colors } from '../../../../styles/colors';
import { radius, spacing } from '../../../../styles/spacing';

export default function TeamsIndex() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { data: response, isLoading, refetch, isRefetching } = useTeams();
  const updateTeamMutation = useUpdateTeam();
  const deleteTeamMutation = useDeleteTeam();

  // Active Team & Modal States
  const [actionTeam, setActionTeam] = useState(null);
  const [detailsTeamId, setDetailsTeamId] = useState(null);
  const [manageTeam, setManageTeam] = useState(null);
  const [changeHeadTeam, setChangeHeadTeam] = useState(null);
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

  const handleTeamPress = (team) => {
    setDetailsTeamId(team.id);
  };

  const handleCreatePress = () => {
    router.push('/(app)/admin/teams/create');
  };

  const handleMenuPress = (team) => {
    setActionTeam(team);
  };

  const handleToggleStatus = (team) => {
    const isActive = team.status === 'ACTIVE';
    const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = isActive ? 'Deactivate' : 'Activate';

    setConfirmModal({
      visible: true,
      title: `${actionLabel} Team`,
      message: `Are you sure you want to ${actionLabel.toLowerCase()} "${team.name}"?`,
      confirmText: actionLabel,
      isDestructive: isActive,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
          await updateTeamMutation.mutateAsync({
            id: team.id,
            data: { status: newStatus },
          });
          toast.show(`✓ Team ${actionLabel.toLowerCase()}d successfully`, 'success');
          refetch();
          setConfirmModal({ visible: false });
        } catch (err) {
          toast.show(err?.response?.data?.message || `Failed to ${actionLabel.toLowerCase()} team`, 'error');
          setConfirmModal({ visible: false });
        }
      },
    });
  };

  const handleDeleteTeam = (team) => {
    setConfirmModal({
      visible: true,
      title: 'Delete Team',
      message: `Are you sure you want to permanently delete "${team.name}"? Team members will become unassigned.`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setConfirmModal((prev) => ({ ...prev, isProcessing: true }));
          const res = await deleteTeamMutation.mutateAsync(team.id);
          if (res.success) {
            toast.show('✓ Team deleted successfully', 'success');
            refetch();
          } else {
            toast.show(res.message || 'Failed to delete team', 'error');
          }
          setConfirmModal({ visible: false });
        } catch (err) {
          toast.show(err?.response?.data?.message || 'Failed to delete team', 'error');
          setConfirmModal({ visible: false });
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TeamList
        teams={response?.data || []}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        onRefresh={refetch}
        onTeamPress={handleTeamPress}
        onMenuPress={handleMenuPress}
        onCreatePress={handleCreatePress}
        userRole={user?.role || 'ADMIN'}
      />

      {/* 3-Dot Action Menu */}
      <TeamActionMenu
        visible={!!actionTeam}
        team={actionTeam}
        userRole={user?.role || 'ADMIN'}
        onClose={() => setActionTeam(null)}
        onViewTeam={(team) => setDetailsTeamId(team.id)}
        onEditTeam={(team) => router.push(`/(app)/admin/teams/${team.id}`)}
        onManageEmployees={(team) => setManageTeam(team)}
        onChangeTeamHead={(team) => setChangeHeadTeam(team)}
        onToggleStatus={handleToggleStatus}
        onDeleteTeam={handleDeleteTeam}
      />

      {/* Team Details Sheet */}
      <TeamDetailsSheet
        visible={!!detailsTeamId}
        teamId={detailsTeamId}
        onClose={() => setDetailsTeamId(null)}
        onEdit={(team) => {
          setDetailsTeamId(null);
          router.push(`/(app)/admin/teams/${team.id}`);
        }}
        onManageEmployees={(team) => {
          setDetailsTeamId(null);
          setManageTeam(team);
        }}
        onChangeHead={(team) => {
          setDetailsTeamId(null);
          setChangeHeadTeam(team);
        }}
      />

      {/* Manage Employees Modal */}
      <ManageEmployeesModal
        visible={!!manageTeam}
        team={manageTeam}
        onClose={() => setManageTeam(null)}
        onUpdated={() => {
          refetch();
        }}
      />

      {/* Change Team Head Modal */}
      <ChangeTeamHeadModal
        visible={!!changeHeadTeam}
        team={changeHeadTeam}
        onClose={() => setChangeHeadTeam(null)}
        onSuccess={(creds) => {
          refetch();
          if (creds) {
            setCredentialData(creds);
          } else {
            toast.show('✓ Team Head updated successfully', 'success');
          }
        }}
      />

      {/* Secure Credentials Modal */}
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
                  confirmModal.isDestructive ? styles.btnDanger : styles.btnPrimary,
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
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnDanger: {
    backgroundColor: colors.error,
  },
  dialogConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
