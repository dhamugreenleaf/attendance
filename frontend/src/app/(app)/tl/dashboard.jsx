import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialIcons, Feather, Octicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { attendanceApi } from '../../../services/attendance.api';
import { employeeApi } from '../../../services/employee.api';
import { colors } from '../../../styles/colors';
import { spacing, radius } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';
import { useLanguage } from '../../../context/LanguageContext';

const getInitials = (name) => {
  if (!name) return 'L';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export default function TLDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, permission: 0, ot: 0 });
  const [teamName, setTeamName] = useState('My Team');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const todayApi = new Date().toISOString().split('T')[0];
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

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

      let p = 0, a = 0, l = 0, pr = 0, ot = 0;
      
      myTeam.forEach(emp => {
        const att = attendanceMap[emp.id];
        const status = att ? att.status : 'NOT_MARKED';
        
        if (status === 'PRESENT') p++;
        else if (status === 'LATE') l++;
        else if (status === 'ABSENT' || status === 'ON_LEAVE' || status === 'HALF_DAY') a++;
        else if (status === 'PERMISSION') pr++;
        
        if (att && att.overtimeMinutes > 0) {
          ot++;
        }
      });

      setStats({ total: myTeam.length, present: p, absent: a, late: l, permission: pr, ot });
    } catch (error) {
      console.error('Failed to load TL dashboard data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return t('goodMorning');
    if (hr < 17) return t('goodAfternoon');
    return t('goodEvening');
  };

  const totalTracked = stats.present + stats.late + stats.absent + stats.permission;
  const pPct = totalTracked ? (stats.present / totalTracked) * 100 : 0;
  const lPct = totalTracked ? (stats.late / totalTracked) * 100 : 0;
  const aPct = totalTracked ? (stats.absent / totalTracked) * 100 : 0;
  const prPct = totalTracked ? (stats.permission / totalTracked) * 100 : 0;

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
            <Text style={styles.userName}>{user?.name || user?.firstName || t('teamLead')}</Text>
          </View>
        </View>
        <View style={styles.timeDateWrapper}>
          <Text style={styles.timeText}>{timeStr}</Text>
          <View style={styles.dateRow}>
            <Octicons name="calendar" size={12} color={colors.textSecondary} />
            <Text style={styles.dateText}>{todayStr}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Team Context Header */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>{t('overview')}</Text>
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
                  <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{t('total')}</Text>
                  <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{stats.total}</Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{t('present')}</Text>
                  <Text style={[styles.statValue, { color: colors.success }]} numberOfLines={1} adjustsFontSizeToFit>{stats.present}</Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{t('late')}</Text>
                  <Text style={[styles.statValue, { color: colors.warning }]} numberOfLines={1} adjustsFontSizeToFit>{stats.late}</Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{t('absent')}</Text>
                  <Text style={[styles.statValue, { color: colors.error }]} numberOfLines={1} adjustsFontSizeToFit>{stats.absent}</Text>
                </View>
                <View style={styles.vDivider} />
                <View style={styles.statCell}>
                  <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>PERM.</Text>
                  <Text style={[styles.statValue, { color: colors.info }]} numberOfLines={1} adjustsFontSizeToFit>{stats.permission}</Text>
                </View>
              </View>

              {/* Data Visualization */}
              <View style={styles.chartSection}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartLabel}>{t('attendanceDistribution')}</Text>
                  <Text style={styles.chartStatus}>{totalTracked}/{stats.total} {t('logged')}</Text>
                </View>
                
                <View style={styles.progressTrack}>
                  {totalTracked === 0 ? (
                    <View style={[styles.progressBar, { width: '100%', backgroundColor: colors.border }]} />
                  ) : (
                    <>
                      {pPct > 0 && <View style={[styles.progressBar, { width: `${pPct}%`, backgroundColor: colors.success }]} />}
                      {lPct > 0 && <View style={[styles.progressBar, { width: `${lPct}%`, backgroundColor: colors.warning }]} />}
                      {aPct > 0 && <View style={[styles.progressBar, { width: `${aPct}%`, backgroundColor: colors.error }]} />}
                      {prPct > 0 && <View style={[styles.progressBar, { width: `${prPct}%`, backgroundColor: colors.info }]} />}
                    </>
                  )}
                </View>
                
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendIndicator, { backgroundColor: colors.success }]} />
                    <Text style={styles.legendText}>{t('present')} ({pPct.toFixed(0)}%)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendIndicator, { backgroundColor: colors.warning }]} />
                    <Text style={styles.legendText}>{t('late')} ({lPct.toFixed(0)}%)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendIndicator, { backgroundColor: colors.error }]} />
                    <Text style={styles.legendText}>{t('absent')} ({aPct.toFixed(0)}%)</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendIndicator, { backgroundColor: colors.info }]} />
                    <Text style={styles.legendText}>Perm. ({prPct.toFixed(0)}%)</Text>
                  </View>
                </View>
              </View>

              {/* Secondary Metrics */}
              {stats.ot > 0 && (
                <View style={styles.secondaryMetric}>
                  <MaterialIcons name="schedule" size={16} color="#6366F1" />
                  <Text style={styles.secondaryMetricText}>
                    <Text style={{ fontWeight: 'bold' }}>{stats.ot}</Text> {t('employeesLoggedOvertime')}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>{t('operations')}</Text>
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
              <Text style={styles.menuItemTitle}>{t('markAttendance')}</Text>
              <Text style={styles.menuItemSub}>{t('dailyAttendanceRegister')}</Text>
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
              <Text style={styles.menuItemTitle}>{t('manageShifts')}</Text>
              <Text style={styles.menuItemSub}>{t('configureWeeklySchedules')}</Text>
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
  timeDateWrapper: {
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    minWidth: 0,
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
    fontSize: 20,
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
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
