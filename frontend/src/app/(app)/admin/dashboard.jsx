import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { attendanceApi } from '../../../services/attendance.api';
import { employeeApi } from '../../../services/employee.api';
import { teamApi } from '../../../services/team.api';
import { useLanguage } from '../../../context/LanguageContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 584,
    present: 0,
    absent: 584,
    late: 0,
    onLeave: 0,
    attendanceRate: 0,
  });
  const [teams, setTeams] = useState([
    { id: '1', name: 'Engineering', total: 142, present: 0, absent: 142, icon: 'settings' },
    { id: '2', name: 'Operations', total: 210, present: 0, absent: 210, icon: 'users' },
    { id: '3', name: 'Sales & Marketing', total: 232, present: 0, absent: 232, icon: 'trending-up' },
  ]);

  const loadDashboardData = useCallback(async () => {
    try {
      const [empRes, teamRes, attRes] = await Promise.allSettled([
        employeeApi.getEmployees(),
        teamApi.getTeams(),
        attendanceApi.getAllAttendance(),
      ]);

      const employees = (empRes.status === 'fulfilled' && empRes.value?.data) ? empRes.value.data : [];
      const teamsData = (teamRes.status === 'fulfilled' && teamRes.value?.data) ? teamRes.value.data : [];
      const allAttendance = (attRes.status === 'fulfilled' && attRes.value?.data) ? attRes.value.data : [];

      if (employees.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = allAttendance.filter((a) => a.date === today);

        let p = 0;
        let l = 0;
        let onLeave = 0;

        const empAttendanceMap = {};
        todayAttendance.forEach((att) => {
          empAttendanceMap[att.employeeId] = att.status;
          if (att.status === 'PRESENT') p++;
          else if (att.status === 'LATE') {
            l++;
            p++; // late counts towards present
          } else if (att.status === 'ON_LEAVE' || att.status === 'LEAVE') {
            onLeave++;
          }
        });

        const total = employees.length;
        const absent = Math.max(0, total - p - onLeave);
        const rate = total > 0 ? Math.round((p / total) * 100) : 0;

        setStats({
          totalEmployees: total,
          present: p,
          absent: absent,
          late: l,
          onLeave: onLeave,
          attendanceRate: rate,
        });

        if (teamsData.length > 0) {
          const defaultIcons = ['settings', 'users', 'trending-up', 'layers', 'briefcase'];
          const breakdown = teamsData.slice(0, 3).map((team, idx) => {
            const teamEmployees = employees.filter((e) => e.teamId === team.id);
            let tPresent = 0;
            teamEmployees.forEach((emp) => {
              const status = empAttendanceMap[emp.id];
              if (status === 'PRESENT' || status === 'LATE') tPresent++;
            });
            const tAbsent = Math.max(0, teamEmployees.length - tPresent);

            return {
              id: team.id,
              name: team.name,
              total: teamEmployees.length,
              present: tPresent,
              absent: tAbsent,
              icon: defaultIcons[idx % defaultIcons.length],
            };
          });
          setTeams(breakdown);
        }
      }
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Formatted date (e.g. "Thursday, 11 Sep 2026")
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const userName = user?.name ? user.name.split(' ')[0] : 'Sanjay';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1A365D']} tintColor="#1A365D" />
        }
      >
        {/* WELCOME SECTION */}
        <View style={styles.welcomeSection}>
          <Text style={styles.greetingText}>Good Morning, {userName}</Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <Text style={styles.pageTitle}>Company Attendance</Text>
        </View>

        {/* KEY ATTENDANCE SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardHeaderTitle}>Attendance Summary</Text>

          {/* 2x2 Grid */}
          <View style={styles.gridRow}>
            {/* Total Employees */}
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Total Employees</Text>
              <Text style={styles.metricValue}>{stats.totalEmployees}</Text>
            </View>

            {/* Present Today */}
            <View style={styles.metricBox}>
              <View style={styles.metricHeaderWithStatus}>
                <Text style={styles.metricLabel}>Present Today</Text>
                <View style={styles.statusDotGreen} />
              </View>
              <Text style={styles.metricValue}>{stats.present}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* Absent Today */}
            <View style={styles.metricBox}>
              <View style={styles.metricHeaderWithStatus}>
                <Text style={styles.metricLabel}>Absent Today</Text>
                <View style={styles.statusDotRed} />
              </View>
              <Text style={styles.metricValue}>{stats.absent}</Text>
            </View>

            {/* Attendance Rate */}
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Attendance Rate</Text>
              <Text style={styles.metricValue}>{stats.attendanceRate}%</Text>
            </View>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.markAttendanceBtn}
            onPress={() => router.push('/(app)/admin/attendance')}
            activeOpacity={0.85}
          >
            <Feather name="check-circle" size={16} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.markAttendanceBtnText}>Mark Attendance</Text>
          </TouchableOpacity>
        </View>

        {/* TODAY'S OVERVIEW SECTION */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionTitle}>Today’s Overview</Text>
        </View>

        <View style={styles.overviewContainer}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Present</Text>
            <Text style={[styles.overviewValue, { color: '#0F172A' }]}>{stats.present}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Absent</Text>
            <Text style={[styles.overviewValue, { color: '#0F172A' }]}>{stats.absent}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>Late</Text>
            <Text style={[styles.overviewValue, { color: '#0F172A' }]}>{stats.late}</Text>
          </View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}>
            <Text style={styles.overviewLabel}>On Leave</Text>
            <Text style={[styles.overviewValue, { color: '#0F172A' }]}>{stats.onLeave}</Text>
          </View>
        </View>

        {/* TEAMS SECTION */}
        <View style={styles.teamsHeaderRow}>
          <Text style={styles.sectionTitle}>Teams</Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/admin/teams')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color="#1A365D" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.teamsListContainer}>
            {teams.map((team) => (
              <TouchableOpacity
                key={team.id}
                style={styles.teamRowCard}
                onPress={() => router.push(`/(app)/admin/teams/${team.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.teamIconContainer}>
                  <Feather name={team.icon || 'users'} size={18} color="#1A365D" />
                </View>

                <View style={styles.teamDetailsContainer}>
                  <Text style={styles.teamNameText} numberOfLines={1}>
                    {team.name}
                  </Text>
                  <Text style={styles.teamCountText}>{team.total} employees</Text>
                </View>

                <View style={styles.teamPillsContainer}>
                  <View style={styles.presentPill}>
                    <Text style={styles.presentPillText}>{team.present} present</Text>
                  </View>
                  <View style={styles.absentPill}>
                    <Text style={styles.absentPillText}>{team.absent} absent</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },

  // Welcome section
  welcomeSection: {
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.4,
  },

  // Attendance Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  metricHeaderWithStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  statusDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  // Primary Action Button
  markAttendanceBtn: {
    backgroundColor: '#1A365D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 4,
  },
  btnIcon: {
    marginRight: 6,
  },
  markAttendanceBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // Today's Overview
  sectionHeaderContainer: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  overviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginBottom: 20,
    ...Platform.select({
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
  overviewItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  overviewDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  // Teams Section
  teamsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A365D',
  },
  teamsListContainer: {
    gap: 8,
  },
  teamRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...Platform.select({
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
  teamIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  teamDetailsContainer: {
    flex: 1,
    marginRight: 8,
  },
  teamNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  teamCountText: {
    fontSize: 11,
    color: '#64748B',
  },
  teamPillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presentPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  presentPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  absentPill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  absentPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
});
