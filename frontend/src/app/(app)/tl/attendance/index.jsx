import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../../hooks/useAuth';
import { Button } from '../../../../components/ui/Button';
import { useToast } from '../../../../components/ui/Toast';
import { employeeApi } from '../../../../services/employee.api';
import { attendanceApi } from '../../../../services/attendance.api';
import { colors } from '../../../../styles/colors';
import { spacing, radius } from '../../../../styles/spacing';
import { typography } from '../../../../styles/typography';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Helper to get dates for Monday to Friday of the current week
const getWeekDates = () => {
  const curr = new Date();
  const day = curr.getDay(); // 0=Sun, 1=Mon...
  const first = curr.getDate() - day + (day === 0 ? -6 : 1); // Monday
  
  const week = [];
  for (let i = 0; i < 5; i++) {
    const next = new Date(curr.getTime());
    next.setDate(first + i);
    week.push(next.toISOString().split('T')[0]);
  }
  return week;
};

const getInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

// Segmented Control for Today's Attendance
const AttendanceSegmentedControl = ({ value, onChange, disabled }) => {
  const options = [
    { value: 'PRESENT', label: 'P', color: colors.success },
    { value: 'LATE', label: 'L', color: colors.warning },
    { value: 'ABSENT', label: 'A', color: colors.error },
    { value: 'OVERTIME', label: 'OT', color: '#6366F1' },
  ];
  return (
    <View style={[styles.modernSegmented, disabled && { opacity: 0.6 }]}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          disabled={disabled}
          style={[
            styles.modernSegment,
            value === opt.value && { backgroundColor: opt.color }
          ]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.modernSegmentText,
            value === opt.value && { color: colors.surface, fontWeight: 'bold' }
          ]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function DefaultAttendanceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [attendanceState, setAttendanceState] = useState({}); // { employeeId: status } for TODAY
  const [weeklyData, setWeeklyData] = useState({}); // { employeeId: { date: status } }
  const [teamName, setTeamName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const weekDates = getWeekDates();
  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;

  useFocusEffect(
    useCallback(() => {
      loadTeamData();
    }, [user])
  );

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      const res = await employeeApi.getEmployees();
      const employees = res.data || [];
      const myTeam = employees.filter(e => 
        (e.team?.managerId === user?.id || e.teamId === user?.teamId) &&
        e.approvalStatus !== 'PENDING'
      ).sort((a, b) => {
        const nameA = (a.user?.name || a.name || '').toLowerCase();
        const nameB = (b.user?.name || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      if (myTeam.length > 0 && myTeam[0].team?.name) {
        setTeamName(myTeam[0].team.name);
      }
      
      const teamId = user?.teamId || (myTeam.length > 0 ? myTeam[0].teamId : null);
      
      let weekDataObj = {};
      let todayRecords = [];
      
      if (teamId) {
        // Fetch all 5 days of the week in parallel
        const promises = weekDates.map(date => attendanceApi.getTeamAttendance(teamId, date));
        const results = await Promise.all(promises);
        
        myTeam.forEach(emp => {
          weekDataObj[emp.id] = {};
        });

        results.forEach((attRes, index) => {
          const date = weekDates[index];
          const records = attRes.data || [];
          
          if (date === todayStr) {
            todayRecords = records;
          }

          records.forEach(curr => {
            if (weekDataObj[curr.employeeId]) {
              weekDataObj[curr.employeeId][date] = curr.status;
            }
          });
        });

        if (todayRecords.length > 0) {
          setIsSubmitted(true);
        } else {
          setIsSubmitted(false);
        }
      }

      setWeeklyData(weekDataObj);

      const initialState = {};
      myTeam.forEach(emp => {
        // Default to PRESENT for today if not already marked
        initialState[emp.id] = weekDataObj[emp.id]?.[todayStr] || 'PRESENT';
      });

      setAttendanceState(initialState);
      setTeamMembers(myTeam);
    } catch (error) {
      toast.show('Failed to load team members.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusSelect = (employeeId, status) => {
    if (isSubmitted) return;
    setAttendanceState(prev => ({ ...prev, [employeeId]: status }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const records = Object.keys(attendanceState).map(empId => ({
        employeeId: parseInt(empId, 10),
        status: attendanceState[empId]
      }));

      await attendanceApi.bulkMark(todayStr, records);
      setIsSubmitted(true);
      toast.show('Attendance saved successfully!', 'success');
      
      // Refresh the grid to show the newly saved attendance
      loadTeamData();
    } catch (error) {
      toast.show('Failed to save attendance. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getSummary = () => {
    let p = 0, l = 0, a = 0, ot = 0;
    Object.values(attendanceState).forEach(status => {
      if (status === 'PRESENT') p++;
      else if (status === 'LATE') l++;
      else if (status === 'ABSENT') a++;
      else if (status === 'OVERTIME') ot++;
    });
    return { p, l, a, ot, total: teamMembers.length };
  };

  const summary = getSummary();
  const displayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appBar}>
        <View style={styles.appBarTop}>
          <View>
            <Text style={styles.appBarTitle}>Attendance</Text>
            <Text style={styles.appBarSub}>{displayDate} · {teamName || 'Team'}</Text>
          </View>
          <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/(app)/tl/history')}>
            <MaterialIcons name="calendar-month" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : teamMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="group-off" size={48} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
            <Text style={styles.emptyText}>No approved team members found.</Text>
          </View>
        ) : (
          <>
            {isSubmitted && !isWeekend && (
              <View style={styles.lockedBanner}>
                <MaterialIcons name="lock" size={18} color={colors.primary} style={{marginRight: 6}} />
                <Text style={styles.lockedText}>Attendance submitted. Portal opens tomorrow at 8:00 AM.</Text>
              </View>
            )}
            
            {isWeekend && (
              <View style={[styles.lockedBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }]}>
                <MaterialIcons name="weekend" size={18} color={colors.warning} style={{marginRight: 6}} />
                <Text style={[styles.lockedText, { color: colors.warning }]}>It's the weekend! Attendance cannot be marked today.</Text>
              </View>
            )}

            <View style={styles.listCard}>
              {teamMembers.map((emp, index) => {
                const name = emp.user?.name || emp.name || 'Unknown';
                const empWeekly = weeklyData[emp.id] || {};

                return (
                  <View key={emp.id} style={[styles.empCard, index !== teamMembers.length - 1 && styles.rowBorder]}>
                    
                    {/* Top Row: Avatar & Name */}
                    <View style={styles.empHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(name)}</Text>
                      </View>
                      <View style={styles.empInfo}>
                        <Text style={styles.empName}>{name}</Text>
                        <Text style={styles.empRole}>{emp.designation || 'Team Member'}</Text>
                      </View>
                    </View>

                    {/* Bottom Row: Weekly Grid & Action */}
                    <View style={styles.empActionsRow}>
                      
                      {/* Weekly Grid (Mon-Fri) */}
                      <View style={styles.weekGrid}>
                        {weekDates.map((date, i) => {
                          const status = empWeekly[date];
                          const isTodayCell = date === todayStr;
                          
                          let cellText = '-';
                          let cellColor = colors.textMuted;
                          let cellBg = colors.background;
                          
                          if (status === 'PRESENT') { cellText = 'P'; cellColor = colors.success; cellBg = colors.success + '15'; }
                          else if (status === 'LATE') { cellText = 'L'; cellColor = colors.warning; cellBg = colors.warning + '15'; }
                          else if (status === 'ABSENT') { cellText = 'A'; cellColor = colors.error; cellBg = colors.error + '15'; }
                          else if (status === 'OVERTIME') { cellText = 'OT'; cellColor = '#6366F1'; cellBg = '#6366F115'; }

                          return (
                            <View key={date} style={styles.dayCol}>
                              <Text style={[styles.dayLabel, isTodayCell && { color: colors.primary, fontWeight: 'bold' }]}>
                                {DAYS_OF_WEEK[i]}
                              </Text>
                              <View style={[
                                styles.dayCell, 
                                { backgroundColor: cellBg, borderColor: cellColor + '40' },
                                isTodayCell && { borderWidth: 1.5, borderColor: colors.primary }
                              ]}>
                                <Text style={[styles.dayCellText, { color: cellColor }]}>{cellText}</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>

                      {/* Today's Segmented Control */}
                      {!isWeekend && (
                        <View style={styles.todayAction}>
                          <Text style={styles.todayActionLabel}>Today</Text>
                          <AttendanceSegmentedControl
                            value={attendanceState[emp.id]}
                            onChange={(status) => handleStatusSelect(emp.id, status)}
                            disabled={isSubmitted}
                          />
                        </View>
                      )}
                    </View>

                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {!isLoading && teamMembers.length > 0 && !isWeekend && (
        <View style={styles.footer}>
          <View style={styles.footerSummary}>
            <Text style={styles.footerSummaryText}>{summary.total} Employees</Text>
            <View style={styles.footerStats}>
              <Text style={styles.footerStatText}><Text style={{color: colors.success}}>{summary.p}</Text> P</Text>
              <Text style={styles.footerStatText}> · <Text style={{color: colors.warning}}>{summary.l}</Text> L</Text>
              <Text style={styles.footerStatText}> · <Text style={{color: colors.error}}>{summary.a}</Text> A</Text>
              <Text style={styles.footerStatText}> · <Text style={{color: '#6366F1'}}>{summary.ot}</Text> OT</Text>
            </View>
          </View>
          {!isSubmitted && (
            <Button title="Save Attendance" onPress={handleSave} isLoading={isSaving} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  appBar: {
    backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4 }, android: { elevation: 3 }, web: { boxShadow: '0 2px 8px rgba(0,0,0,0.07)' } }),
  },
  appBarTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appBarTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  appBarSub: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  historyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  lockedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '15', padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary + '30' },
  lockedText: { flex: 1, color: colors.primary, fontSize: typography.fontSize.sm, fontWeight: '700' },
  
  listCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 2 }, web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } }),
  },
  empCard: { padding: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  
  empHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  avatarText: { color: '#fff', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  empInfo: { flex: 1 },
  empName: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  empRole: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  empActionsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  
  weekGrid: { flexDirection: 'row', gap: 4 },
  dayCol: { alignItems: 'center', gap: 4 },
  dayLabel: { fontSize: 9, fontWeight: '600', color: colors.textSecondary },
  dayCell: { width: 24, height: 24, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayCellText: { fontSize: 10, fontWeight: 'bold' },
  
  todayAction: { alignItems: 'center', gap: 4 },
  todayActionLabel: { fontSize: 9, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' },
  
  modernSegmented: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: radius.sm, padding: 2, borderWidth: 1, borderColor: colors.border },
  modernSegment: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 4, minWidth: 28, alignItems: 'center', justifyContent: 'center' },
  modernSegmentText: { fontSize: typography.fontSize.xs, fontWeight: '700', color: colors.textSecondary },
  
  footer: { backgroundColor: colors.surface, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  footerSummary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  footerSummaryText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  footerStats: { flexDirection: 'row' },
  footerStatText: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.textSecondary },
  
  emptyContainer: { alignItems: 'center', paddingTop: spacing.xxl * 2 },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: typography.fontSize.sm, marginTop: spacing.md },
});
