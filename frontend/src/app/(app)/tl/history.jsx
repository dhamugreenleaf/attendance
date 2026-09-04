import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { attendanceApi } from '../../../services/attendance.api';
import { employeeApi } from '../../../services/employee.api';
import { colors } from '../../../styles/colors';
import { spacing, radius } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';
import { MaterialIcons, Feather } from '@expo/vector-icons';

const STATUS_COLORS = {
  PRESENT: colors.success,
  LATE: colors.warning,
  ABSENT: colors.error,
  NOT_MARKED: colors.textMuted,
};

const STATUS_LABELS = {
  PRESENT: 'Present',
  LATE: 'Late',
  ABSENT: 'Absent',
  NOT_MARKED: '—',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

export default function TLHistory() {
  const { user } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'monthly'
  const [date, setDate] = useState(new Date()); // used for daily
  const [monthDate, setMonthDate] = useState(new Date()); // used for monthly
  const [isLoading, setIsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [dailyStats, setDailyStats] = useState({ total: 0, present: 0, absent: 0, late: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ total: 0, present: 0, absent: 0, late: 0 });

  const dateString = date.toISOString().split('T')[0];
  const todayString = new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'daily') loadDailyData();
      else loadMonthlyData();
    }, [viewMode, dateString, monthDate.getMonth(), monthDate.getFullYear()])
  );

  const loadDailyData = async () => {
    try {
      setIsLoading(true);
      const res = await employeeApi.getEmployees();
      const employees = res.data || [];
      const myTeam = employees.filter(e =>
        (e.team?.managerId === user?.id || e.teamId === user?.teamId) &&
        e.approvalStatus !== 'PENDING'
      );
      const teamId = user?.teamId || (myTeam.length > 0 ? myTeam[0].teamId : null);

      let attendanceMap = {};
      if (teamId) {
        const attRes = await attendanceApi.getTeamAttendance(teamId, dateString);
        const records = attRes.data || [];
        attendanceMap = records.reduce((acc, curr) => {
          acc[curr.employeeId] = curr;
          return acc;
        }, {});
      }

      let p = 0, a = 0, l = 0;
      const merged = myTeam.map(emp => {
        const att = attendanceMap[emp.id];
        const status = att ? att.status : 'NOT_MARKED';
        if (status === 'PRESENT') p++;
        else if (status === 'LATE') l++;
        else if (status === 'ABSENT') a++;
        return { ...emp, attendanceStatus: status };
      });

      // Sort alphabetically
      merged.sort((a, b) => (a.user?.name || a.name || '').localeCompare(b.user?.name || b.name || ''));

      setDailyStats({ total: myTeam.length, present: p, absent: a, late: l });
      setTeamMembers(merged);
    } catch (error) {
      console.error('Failed to load daily history', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    try {
      setIsLoading(true);
      const res = await employeeApi.getEmployees();
      const employees = res.data || [];
      const myTeam = employees.filter(e =>
        (e.team?.managerId === user?.id || e.teamId === user?.teamId) &&
        e.approvalStatus !== 'PENDING'
      );

      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;

      // Fetch monthly summary for each employee concurrently
      const summaries = await Promise.all(
        myTeam.map(emp =>
          attendanceApi.getEmployeeMonthlySummary(emp.id, year, month)
            .then(r => ({ id: emp.id, ...r.data }))
            .catch(() => ({ id: emp.id, present: 0, absent: 0, late: 0 }))
        )
      );

      let totalP = 0, totalA = 0, totalL = 0;
      const summaryMap = {};
      summaries.forEach(s => {
        summaryMap[s.id] = s;
        totalP += s.present || 0;
        totalA += s.absent || 0;
        totalL += s.late || 0;
      });

      const merged = myTeam.map(emp => ({
        ...emp,
        monthlySummary: summaryMap[emp.id] || { present: 0, absent: 0, late: 0 }
      }));

      // Sort alphabetically
      merged.sort((a, b) => (a.user?.name || a.name || '').localeCompare(b.user?.name || b.name || ''));

      setMonthlyStats({ total: myTeam.length, present: totalP, absent: totalA, late: totalL });
      setTeamMembers(merged);
    } catch (error) {
      console.error('Failed to load monthly history', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate);
  };

  const changeMonth = (delta) => {
    const newDate = new Date(monthDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setMonthDate(newDate);
  };

  const stats = viewMode === 'daily' ? dailyStats : monthlyStats;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => router.replace('/(app)/tl/attendance')} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Attendance History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Header Controls */}
      <View style={styles.header}>
        {/* Day / Month Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'daily' && styles.modeTabActive]}
            onPress={() => setViewMode('daily')}
          >
            <Feather name="sun" size={14} color={viewMode === 'daily' ? colors.surface : colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.modeTabText, viewMode === 'daily' && styles.modeTabTextActive]}>Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'monthly' && styles.modeTabActive]}
            onPress={() => setViewMode('monthly')}
          >
            <Feather name="calendar" size={14} color={viewMode === 'monthly' ? colors.surface : colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.modeTabText, viewMode === 'monthly' && styles.modeTabTextActive]}>Monthly</Text>
          </TouchableOpacity>
        </View>

        {/* Date Navigator */}
        <View style={styles.dateNavigator}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => viewMode === 'daily' ? changeDate(-1) : changeMonth(-1)}
          >
            <MaterialIcons name="chevron-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.dateCenter}>
            <MaterialIcons name="event" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>
              {viewMode === 'daily'
                ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`
              }
            </Text>
          </View>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => viewMode === 'daily' ? changeDate(1) : changeMonth(1)}
            disabled={viewMode === 'daily' && dateString >= todayString}
          >
            <MaterialIcons
              name="chevron-right"
              size={22}
              color={viewMode === 'daily' && dateString >= todayString ? colors.textMuted : colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Summary Bar */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, { borderColor: colors.border }]}>
            <Text style={styles.summaryChipValue}>{stats.total}</Text>
            <Text style={styles.summaryChipLabel}>Total</Text>
          </View>
          <View style={[styles.summaryChip, { borderColor: colors.success + '60' }]}>
            <Text style={[styles.summaryChipValue, { color: colors.success }]}>{stats.present}</Text>
            <Text style={styles.summaryChipLabel}>Present</Text>
          </View>
          <View style={[styles.summaryChip, { borderColor: colors.warning + '60' }]}>
            <Text style={[styles.summaryChipValue, { color: colors.warning }]}>{stats.late}</Text>
            <Text style={styles.summaryChipLabel}>Late</Text>
          </View>
          <View style={[styles.summaryChip, { borderColor: colors.error + '60' }]}>
            <Text style={[styles.summaryChipValue, { color: colors.error }]}>{stats.absent}</Text>
            <Text style={styles.summaryChipLabel}>Absent</Text>
          </View>
        </View>

        {/* Employee List */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : teamMembers.length === 0 ? (
          <Text style={styles.emptyText}>No team members found.</Text>
        ) : (
          <View style={styles.listCard}>
            {teamMembers.map((emp, index) => {
              const name = emp.user?.name || emp.name || 'Unknown';
              if (viewMode === 'daily') {
                const status = emp.attendanceStatus || 'NOT_MARKED';
                const statusColor = STATUS_COLORS[status] || colors.textMuted;
                return (
                  <View
                    key={emp.id}
                    style={[styles.row, index !== teamMembers.length - 1 && styles.rowBorder]}
                  >
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarText}>{getInitials(name)}</Text>
                    </View>
                    <View style={styles.empInfo}>
                      <Text style={styles.empName}>{name}</Text>
                      <Text style={styles.empRole}>{emp.designation?.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '60' }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                        {STATUS_LABELS[status]}
                      </Text>
                    </View>
                  </View>
                );
              } else {
                const ms = emp.monthlySummary || {};
                return (
                  <View
                    key={emp.id}
                    style={[styles.row, index !== teamMembers.length - 1 && styles.rowBorder]}
                  >
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarText}>{getInitials(name)}</Text>
                    </View>
                    <View style={styles.empInfo}>
                      <Text style={styles.empName}>{name}</Text>
                      <Text style={styles.empRole}>{emp.designation?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.monthlyBadges}>
                      <View style={styles.monthlyBadge}>
                        <Text style={[styles.monthlyBadgeValue, { color: colors.success }]}>{ms.present || 0}</Text>
                        <Text style={styles.monthlyBadgeLabel}>P</Text>
                      </View>
                      <View style={styles.monthlyBadge}>
                        <Text style={[styles.monthlyBadgeValue, { color: colors.warning }]}>{ms.late || 0}</Text>
                        <Text style={styles.monthlyBadgeLabel}>L</Text>
                      </View>
                      <View style={styles.monthlyBadge}>
                        <Text style={[styles.monthlyBadgeValue, { color: colors.error }]}>{ms.absent || 0}</Text>
                        <Text style={styles.monthlyBadgeLabel}>A</Text>
                      </View>
                    </View>
                  </View>
                );
              }
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  appBarTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.full,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  modeTabActive: {
    backgroundColor: colors.primary,
  },
  modeTabText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: colors.surface,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  navBtn: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dateCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    }),
  },
  summaryChipValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  summaryChipLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.surface,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  empInfo: {
    flex: 1,
  },
  empName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  empRole: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  monthlyBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  monthlyBadge: {
    alignItems: 'center',
    minWidth: 32,
    backgroundColor: colors.background,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  monthlyBadgeValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  monthlyBadgeLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: spacing.xl,
    fontSize: typography.fontSize.sm,
  },
});
