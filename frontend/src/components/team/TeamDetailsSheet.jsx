import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { teamApi } from '../../services/team.api';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';
import { typography } from '../../styles/typography';

export const TeamDetailsSheet = ({
  visible,
  teamId,
  onClose,
  onEdit,
  onManageEmployees,
  onChangeHead,
}) => {
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && teamId) {
      loadDetails();
    }
  }, [visible, teamId]);

  const loadDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await teamApi.getTeamById(teamId);
      if (res.success && res.data) {
        setTeam(res.data);
      } else {
        setError('Unable to load team details.');
      }
    } catch (err) {
      console.error('Failed to load team details:', err);
      setError(err?.response?.data?.message || 'Unable to load team details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  const attendance = team?.attendanceSummary;
  const hasAttendanceData = attendance && attendance.hasData && attendance.total > 0;
  const members = team?.members || [];
  const isActive = team?.status === 'ACTIVE';

  return (
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

          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.sheetTitle}>Team Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading team details...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={36} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadDetails}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : team ? (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Main Card */}
              <View style={styles.overviewCard}>
                <View style={styles.teamHeaderRow}>
                  <View style={styles.teamTitleWrap}>
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

                {/* Team Head & Member Count */}
                <View style={styles.metaGrid}>
                  <View style={styles.metaBox}>
                    <Text style={styles.metaLabel}>TEAM HEAD</Text>
                    <View style={styles.headRow}>
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
                    <Text style={styles.metaLabel}>TOTAL EMPLOYEES</Text>
                    <Text style={styles.employeeCountNumber}>
                      {team.employeeCount !== undefined ? team.employeeCount : members.length}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Today's Attendance Section */}
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
                    <MaterialIcons name="schedule" size={20} color={colors.textMuted} />
                    <Text style={styles.noAttendanceText}>
                      No attendance records logged for today yet.
                    </Text>
                  </View>
                )}
              </View>

              {/* Team Members List */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderBetween}>
                  <View style={styles.sectionHeader}>
                    <MaterialIcons name="people-outline" size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Team Members</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{members.length}</Text>
                    </View>
                  </View>

                  {onManageEmployees && (
                    <TouchableOpacity
                      style={styles.manageBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        onClose();
                        onManageEmployees(team);
                      }}
                    >
                      <Text style={styles.manageBtnText}>Manage</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {members.length === 0 ? (
                  <View style={styles.emptyMembersBox}>
                    <MaterialIcons name="person-outline" size={32} color={colors.border} />
                    <Text style={styles.emptyMembersText}>No employees assigned to this team yet.</Text>
                  </View>
                ) : (
                  <View style={styles.memberList}>
                    {members.map((emp) => {
                      const empUser = emp.user;
                      const empName = empUser?.name || 'Team Member';
                      const empInitial = empName[0].toUpperCase();
                      const designation = emp.designation || 'Staff';
                      const empCode = `EMP${String(emp.id).padStart(4, '0')}`;
                      const empStatus = empUser?.status || emp.approvalStatus || 'ACTIVE';
                      const isEmpActive = empStatus === 'ACTIVE' || empStatus === 'APPROVED';

                      return (
                        <View key={emp.id} style={styles.memberRow}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{empInitial}</Text>
                          </View>
                          <View style={styles.memberInfo}>
                            <View style={styles.memberNameRow}>
                              <Text style={styles.memberName} numberOfLines={1}>
                                {empName}
                              </Text>
                              <View style={[styles.empStatusDot, { backgroundColor: isEmpActive ? '#10B981' : '#EF4444' }]} />
                            </View>
                            <Text style={styles.memberMeta} numberOfLines={1}>
                              {empCode} · {designation}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
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
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    minHeight: '60%',
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
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  overviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  teamHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  teamTitleWrap: {
    flex: 1,
    marginRight: spacing.md,
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
    marginVertical: 14,
  },
  metaGrid: {
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
    marginBottom: 6,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flexShrink: 1,
  },
  employeeCountNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
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
  manageBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  manageBtnText: {
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
    flexShrink: 1,
  },
  emptyMembersBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  emptyMembersText: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.textMuted,
  },
  memberList: {
    gap: 10,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  empStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  memberMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});
