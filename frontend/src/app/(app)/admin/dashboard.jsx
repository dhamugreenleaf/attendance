import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { attendanceApi } from '../../../services/attendance.api';
import { employeeApi } from '../../../services/employee.api';
import { teamApi } from '../../../services/team.api';
import { colors } from '../../../styles/colors';
import { spacing, radius } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalEmployees: 0, totalTeams: 0, present: 0, absent: 0 });
  const [teamStats, setTeamStats] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [empRes, teamRes, attRes] = await Promise.all([
        employeeApi.getEmployees(),
        teamApi.getTeams(),
        attendanceApi.getAllAttendance()
      ]);

      const employees = empRes?.data || [];
      const teams = teamRes?.data || [];
      const allAttendance = attRes?.data || [];
      
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = allAttendance.filter(a => a.date === today);

      let p = 0, a = 0;
      
      const empAttendanceMap = {};
      todayAttendance.forEach(att => {
        empAttendanceMap[att.employeeId] = att.status;
        if (att.status === 'PRESENT') p++;
        else if (att.status === 'ABSENT') a++;
      });
      
      // If someone has no attendance record, they are not counted as absent globally yet, 
      // or we can count them as absent if we want "Default Present" workflow. 
      // Wait, PRD: "Everyone is present by default" when TL opens it.
      // So if not submitted, they are technically unknown. Let's just count explicit absents for now, 
      // or (total - present) = absent. Let's use total - present.
      a = employees.length - p;

      // Teams breakdown
      const teamsBreakdown = teams.map(team => {
        const teamEmployees = employees.filter(e => e.teamId === team.id);
        let tPresent = 0, tAbsent = 0;
        
        teamEmployees.forEach(emp => {
          const status = empAttendanceMap[emp.id];
          if (status === 'PRESENT') tPresent++;
          else tAbsent++; // Default to absent if not marked present
        });

        return {
          id: team.id,
          name: team.name,
          head: team.manager?.name || 'Unassigned',
          total: teamEmployees.length,
          tPresent,
          tAbsent
        };
      });

      setStats({
        totalEmployees: employees.length,
        totalTeams: teams.length,
        present: p,
        absent: a
      });
      setTeamStats(teamsBreakdown);
    } catch (error) {
      console.error('Failed to load admin dashboard', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning, {user?.name || user?.username || 'Admin'}</Text>
          <Text style={styles.title}>Company Attendance</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.totalEmployees}</Text>
            <Text style={styles.metricLabel}>Total Employees</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.totalTeams}</Text>
            <Text style={styles.metricLabel}>Total Teams</Text>
          </View>
          <View style={[styles.metricCard, styles.metricPresent]}>
            <Text style={[styles.metricValue, { color: colors.success }]}>{stats.present}</Text>
            <Text style={[styles.metricLabel, { color: colors.success }]}>Present Today</Text>
          </View>
          <View style={[styles.metricCard, styles.metricAbsent]}>
            <Text style={[styles.metricValue, { color: colors.error }]}>{stats.absent}</Text>
            <Text style={[styles.metricLabel, { color: colors.error }]}>Absent Today</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Teams</Text>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : teamStats.length === 0 ? (
          <Text style={styles.emptyText}>No teams created yet.</Text>
        ) : (
          teamStats.map(team => (
            <Card key={team.id} style={styles.teamCard}>
              <View style={styles.teamHeader}>
                <Text style={styles.teamName}>{team.name}</Text>
              </View>
              
              <View style={styles.teamInfo}>
                <Text style={styles.teamInfoLabel}>Head: <Text style={styles.teamInfoValue}>{team.head}</Text></Text>
                <Text style={styles.teamInfoLabel}>{team.total} Employees</Text>
              </View>

              <View style={styles.teamAttendance}>
                <Text style={styles.attendanceText}><Text style={styles.presentText}>{team.tPresent} Present</Text> · <Text style={styles.absentText}>{team.tAbsent} Absent</Text></Text>
              </View>

              <View style={styles.teamActions}>
                <Button 
                  title="View Team" 
                  variant="outline" 
                  size="small"
                  style={styles.actionBtn}
                  onPress={() => router.push(`/(app)/admin/teams/${team.id}`)}
                />
                <Button 
                  title="Manage" 
                  variant="outline" 
                  size="small"
                  style={styles.actionBtn}
                  onPress={() => router.push(`/(app)/admin/teams/${team.id}?edit=true`)}
                />
              </View>
            </Card>
          ))
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
  container: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricPresent: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  metricAbsent: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  metricValue: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  teamCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  teamHeader: {
    marginBottom: spacing.sm,
  },
  teamName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  teamInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  teamInfoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  teamInfoValue: {
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  teamAttendance: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  attendanceText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  presentText: {
    color: colors.success,
  },
  absentText: {
    color: colors.error,
  },
  teamActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    padding: spacing.xl,
  }
});
