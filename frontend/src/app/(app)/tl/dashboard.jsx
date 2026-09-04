import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons, Feather, Octicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { attendanceApi } from '../../../services/attendance.api';
import { employeeApi } from '../../../services/employee.api';
import { colors } from '../../../styles/colors';
import { spacing, radius } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';

const getInitials = (name) => {
  if (!name) return 'L';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export default function TLDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, ot: 0 });
  const [teamName, setTeamName] = useState('My Team');

  const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const todayApi = new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [user])
  );

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await employeeApi.getEmployees();
      const employees = res.data || [];
      const myTeam = employees.filter(e => 
        (e.team?.managerId === user?.id || e.teamId === user?.teamId) &&
        e.approvalStatus !== 'PENDING'
      );
      
      if (myTeam.length > 0 && myTeam[0].team?.name) {
        setTeamName(myTeam[0].team.name);
      }

      const teamId = user?.teamId || (myTeam.length > 0 ? myTeam[0].teamId : null);
      
      let attendanceMap = {};
      if (teamId) {
        const attRes = await attendanceApi.getTeamAttendance(teamId, todayApi);
        const attendanceData = attRes.data || [];
        attendanceMap = attendanceData.reduce((acc, curr) => {
          acc[curr.employeeId] = curr;
          return acc;
        }, {});
      }

      let p = 0, a = 0, l = 0, ot = 0;
      
      myTeam.forEach(emp => {
        const att = attendanceMap[emp.id];
        const status = att ? att.status : 'NOT_MARKED';
        
        if (status === 'PRESENT') p++;
        else if (status === 'LATE') l++;
        else if (status === 'ABSENT' || status === 'ON_LEAVE' || status === 'HALF_DAY') a++;
        
        if (att && att.overtimeMinutes > 0) {
          ot++;
        }
      });

      setStats({ total: myTeam.length, present: p, absent: a, late: l, ot });
    } catch (error) {
      console.error('Failed to load TL dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const totalTracked = stats.present + stats.late + stats.absent;
  const pPct = totalTracked ? (stats.present / totalTracked) * 100 : 0;
  const lPct = totalTracked ? (stats.late / totalTracked) * 100 : 0;
  const aPct = totalTracked ? (stats.absent / totalTracked) * 100 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Enterprise Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.userProfile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name || user?.firstName)}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.name || user?.firstName || 'Lead'}</Text>
          </View>
        </View>
        <View style={styles.dateContainer}>
          <Octicons name="calendar" size={14} color={colors.textSecondary} />
          <Text style={styles.dateText}>{todayStr}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Team Context Header */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.sectionSubtitle}>{teamName}</Text>
        </View>

        {/* Analytics Widget */}
        <View style={styles.widgetCard}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ margin: spacing.xl }} />
          ) : (
            <>
              {/* Primary Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>TOTAL</Text>
                  <Text style={styles.statValue}>{stats.total}</Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>PRESENT</Text>
                  <Text style={[styles.statValue, { color: colors.success }]}>{stats.present}</Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>LATE</Text>
                  <Text style={[styles.statValue, { color: colors.warning }]}>{stats.late}</Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>ABSENT</Text>
                  <Text style={[styles.statValue, { color: colors.error }]}>{stats.absent}</Text>
                </View>
              </View>

              {/* Data Visualization */}
              <View style={styles.chartSection}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartLabel}>ATTENDANCE DISTRIBUTION</Text>
                  <Text style={styles.chartStatus}>{totalTracked}/{stats.total} Logged</Text>
                </View>
                
                <View style={styles.progressTrack}>
                  {totalTracked === 0 ? (
                    <View style={[styles.progressBar, { width: '100%', backgroundColor: colors.border }]} />
                  ) : (
                    <>
                      {pPct > 0 && <View style={[styles.progressBar, { width: `${pPct}%`, backgroundColor: colors.success }]} />}
                      {lPct > 0 && <View style={[styles.progressBar, { width: `${lPct}%`, backgroundColor: colors.warning }]} />}
                      {aPct > 0 && <View style={[styles.progressBar, { width: `${aPct}%`, backgroundColor: colors.error }]} />}
                    </>
                  )}
                </View>
                
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendIndicator, { backgroundColor: colors.success }]} />
                    <Text style={styles.legendText}>Present ({pPct.toFixed(0)}%)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendIndicator, { backgroundColor: colors.warning }]} />
                    <Text style={styles.legendText}>Late ({lPct.toFixed(0)}%)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendIndicator, { backgroundColor: colors.error }]} />
                    <Text style={styles.legendText}>Absent ({aPct.toFixed(0)}%)</Text>
                  </View>
                </View>
              </View>

              {/* Secondary Metrics */}
              {stats.ot > 0 && (
                <View style={styles.secondaryMetric}>
                  <MaterialIcons name="schedule" size={16} color="#6366F1" />
                  <Text style={styles.secondaryMetricText}>
                    <Text style={{ fontWeight: 'bold' }}>{stats.ot}</Text> employees logged overtime
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>Operations</Text>
        </View>

        {/* Enterprise List Menu for Actions */}
        <View style={styles.menuCard}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(app)/tl/attendance')}
            activeOpacity={0.6}
          >
            <View style={[styles.menuIconBox, { backgroundColor: colors.primary + '15' }]}>
              <MaterialIcons name="fact-check" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuItemTitle}>Mark Attendance</Text>
              <Text style={styles.menuItemSub}>Daily attendance register</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.hDivider} />

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(app)/tl/shift')}
            activeOpacity={0.6}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#8b5cf615' }]}>
              <Feather name="clock" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.menuTextContent}>
              <Text style={styles.menuItemTitle}>Manage Shifts</Text>
              <Text style={styles.menuItemSub}>Configure weekly schedules</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA', // ultra light gray for corporate feel
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 8, // slight rounding for corporate vs full circle
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  greeting: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  
  // Widget Styling (Clean lines, minimal shadow)
  widgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  vDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  // Chart Styling
  chartSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  chartStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendIndicator: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  secondaryMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF', // subtle indigo tint
    padding: spacing.sm,
    borderRadius: 6,
    marginTop: spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  secondaryMetricText: {
    fontSize: 11,
    color: '#4F46E5',
  },

  // Enterprise Menu List for Operations
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuTextContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  menuItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  hDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 70, // Align with text
  },
});
