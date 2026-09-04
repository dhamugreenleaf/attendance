import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Platform,
  Modal, TextInput, KeyboardAvoidingView
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/Button';
import { employeeApi } from '../../../services/employee.api';
import { useToast } from '../../../components/ui/Toast';
import { colors } from '../../../styles/colors';
import { spacing, radius } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';

// Shift definitions — DO NOT MODIFY
const SHIFTS = {
  MORNING:   { key: 'MORNING',   label: 'M', fullLabel: 'Morning',   startTime: '09:00', endTime: '17:00', icon: 'sun',   color: '#F59E0B', bgLight: '#FEF3C7' },
  AFTERNOON: { key: 'AFTERNOON', label: 'A', fullLabel: 'Afternoon', startTime: '13:00', endTime: '21:00', icon: 'cloud', color: '#F97316', bgLight: '#FFF0E6' },
  NIGHT:     { key: 'NIGHT',     label: 'N', fullLabel: 'Night',     startTime: '21:00', endTime: '05:00', icon: 'moon',  color: '#6366F1', bgLight: '#EEF2FF' },
  OFF:       { key: 'OFF',       label: 'Off', fullLabel: 'Holiday', startTime: null,    endTime: null,    icon: 'slash', color: '#94A3B8', bgLight: '#F1F5F9' },
};

const WORK_SHIFTS = ['MORNING', 'AFTERNOON', 'NIGHT', 'OFF'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getTodayIdx() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function subtractOneHour(timeStr) {
  if (!timeStr) return '—';
  const [hStr, mStr] = timeStr.split(':');
  let h = (parseInt(hStr, 10) - 1 + 24) % 24;
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function to12h(timeStr) {
  if (!timeStr) return '—';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// Get dominant shift for an employee (most common shift across 7 days)
function getDominantShift(weekPlan) {
  const counts = {};
  weekPlan.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'MORNING';
}

// ─── Weekly Schedule Popup ───────────────────────────────────────────────────
const WeeklyScheduleModal = ({ visible, employee, weekPlan, shifts, onClose, onSave }) => {
  const [localPlan, setLocalPlan] = useState([...weekPlan]);
  const todayIdx = getTodayIdx();

  if (!employee) return null;
  const empName = employee.user?.name || employee.name || 'Employee';

  const handleShiftSelect = (dayIdx, shiftKey) => {
    setLocalPlan(prev => {
      const updated = [...prev];
      updated[dayIdx] = shiftKey;
      return updated;
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={() => setLocalPlan([...weekPlan])}>
      <View style={mStyles.overlay}>
        <View style={mStyles.card}>
          {/* Header */}
          <View style={mStyles.header}>
            <View style={mStyles.headerLeft}>
              <Text style={mStyles.title}>{empName}'s Schedule</Text>
              <Text style={mStyles.subtitle}>Assign shifts for the week</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
              <MaterialIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Weekly List */}
          <ScrollView style={mStyles.weekList} showsVerticalScrollIndicator={false}>
            {DAYS.map((day, i) => {
              const currentShift = localPlan[i] || 'MORNING';
              const isToday = i === todayIdx;
              
              return (
                <View key={i} style={[mStyles.dayRow, isToday && mStyles.dayRowToday]}>
                  <View style={mStyles.dayInfo}>
                    <Text style={[mStyles.dayName, isToday && { color: colors.primary, fontWeight: 'bold' }]}>{day}</Text>
                    {isToday && <Text style={mStyles.todayBadge}>Today</Text>}
                  </View>
                  
                  <View style={mStyles.shiftSelector}>
                    {WORK_SHIFTS.map(shiftKey => {
                      const def = shifts[shiftKey] || SHIFTS[shiftKey];
                      const isSelected = currentShift === shiftKey;
                      return (
                        <TouchableOpacity
                          key={shiftKey}
                          style={[
                            mStyles.shiftOption,
                            isSelected && { backgroundColor: def.color, borderColor: def.color }
                          ]}
                          onPress={() => handleShiftSelect(i, shiftKey)}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            mStyles.shiftOptionText,
                            isSelected && { color: '#fff' },
                            !isSelected && shiftKey === 'OFF' && { color: colors.textMuted }
                          ]}>
                            {def.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Actions */}
          <View style={mStyles.actions}>
            <TouchableOpacity style={mStyles.cancelBtn} onPress={onClose}>
              <Text style={mStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={mStyles.saveBtn}
              onPress={() => { onSave(employee.id, localPlan); onClose(); }}
            >
              <Text style={mStyles.saveText}>Save Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Edit Shift Timing Modal ─────────────────────────────────────────────────
const EditShiftModal = ({ visible, shift, onClose, onSave }) => {
  const [startTime, setStartTime] = useState(shift?.startTime || '09:00');
  const [endTime, setEndTime] = useState(shift?.endTime || '17:00');
  if (!shift || shift.key === 'OFF') return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onShow={() => { setStartTime(shift.startTime); setEndTime(shift.endTime); }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.editCard}>
          <View style={[styles.editHeader, { borderBottomColor: shift.color + '40' }]}>
            <View style={[styles.editIconWrap, { backgroundColor: shift.bgLight }]}>
              <Feather name={shift.icon} size={22} color={shift.color} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.editTitle}>{shift.fullLabel} Shift</Text>
              <Text style={styles.editSubtitle}>Set office timing</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.editCloseBtn}>
              <MaterialIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>In Time</Text>
              <TextInput style={styles.timeInput} value={startTime} onChangeText={setStartTime} placeholder="09:00" placeholderTextColor={colors.textMuted} keyboardType="numbers-and-punctuation" maxLength={5} />
              <Text style={styles.timeHint}>24h format</Text>
            </View>
            <View style={styles.timeSep}><MaterialIcons name="arrow-forward" size={20} color={colors.textMuted} /></View>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>Out Time</Text>
              <TextInput style={styles.timeInput} value={endTime} onChangeText={setEndTime} placeholder="17:00" placeholderTextColor={colors.textMuted} keyboardType="numbers-and-punctuation" maxLength={5} />
              <Text style={styles.timeHint}>24h format</Text>
            </View>
          </View>
          <View style={[styles.portalBox, { backgroundColor: shift.bgLight, borderColor: shift.color + '40' }]}>
            <MaterialIcons name="lock-open" size={15} color={shift.color} style={{ marginRight: 6 }} />
            <Text style={[styles.portalText, { color: shift.color }]}>
              Portal opens at <Text style={{ fontWeight: 'bold' }}>{subtractOneHour(startTime)}</Text> (1 hr before)
            </Text>
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.editCancelBtn} onPress={onClose}>
              <Text style={styles.editCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.editSaveBtn, { backgroundColor: shift.color }]} onPress={() => { onSave(shift.key, startTime, endTime); onClose(); }}>
              <Text style={styles.editSaveText}>Save Timing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ManageShifts() {
  const { user } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [weeklyPlans, setWeeklyPlans] = useState({});
  const [teamName, setTeamName] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [shifts, setShifts] = useState(SHIFTS);

  const [scheduleModal, setScheduleModal] = useState({ visible: false, employee: null });
  const [editModal, setEditModal] = useState({ visible: false, shift: null });

  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const todayIdx = getTodayIdx();

  useFocusEffect(useCallback(() => { loadTeamData(); }, [user]));

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      setIsSaved(false);
      const res = await employeeApi.getEmployees();
      const employees = res.data || [];
      const myTeam = employees
        .filter(e => (e.team?.managerId === user?.id || e.teamId === user?.teamId) && e.approvalStatus !== 'PENDING')
        .sort((a, b) => (a.user?.name || a.name || '').localeCompare(b.user?.name || b.name || ''));

      if (myTeam.length > 0 && myTeam[0].team?.name) setTeamName(myTeam[0].team.name);

      const initial = {};
      myTeam.forEach(emp => {
        const def = emp.shift || 'MORNING';
        initial[emp.id] = ['Mon','Tue','Wed','Thu','Fri'].map(() => def).concat(['OFF', 'OFF']);
      });

      setWeeklyPlans(initial);
      setTeamMembers(myTeam);
    } catch (error) {
      toast.show('Failed to load team members.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSchedule = (empId, plan) => {
    setWeeklyPlans(prev => ({ ...prev, [empId]: plan }));
    setIsSaved(false); 
    toast.show('Weekly schedule updated! Don\'t forget to Save Shifts.', 'info');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await Promise.all(
        teamMembers.map(emp =>
          employeeApi.updateEmployee(emp.id, { shift: weeklyPlans[emp.id]?.[todayIdx] || 'MORNING' }).catch(() => null)
        )
      );
      setIsSaved(true);
      toast.show('All shift assignments saved successfully!', 'success');
    } catch {
      toast.show('Failed to save shifts. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveShiftTime = (shiftKey, startTime, endTime) => {
    setShifts(prev => ({ ...prev, [shiftKey]: { ...prev[shiftKey], startTime, endTime } }));
    toast.show(`${shifts[shiftKey].fullLabel} shift timing updated!`, 'success');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <View>
          <Text style={styles.appBarTitle}>Manage Shifts</Text>
          <Text style={styles.appBarSub}>{todayStr} · {teamName || 'My Team'}</Text>
        </View>
        <View style={styles.dateBadge}>
          <MaterialIcons name="group" size={14} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.dateBadgeText}>{teamMembers.length} Staff</Text>
        </View>
      </View>

      {/* Shift Legend Cards */}
      <View style={styles.legendBar}>
        {[shifts.MORNING, shifts.AFTERNOON, shifts.NIGHT].map(s => (
          <View key={s.key} style={[styles.legendCard, { backgroundColor: s.bgLight, borderColor: s.color + '40' }]}>
            <View style={styles.legendCardTop}>
              <Feather name={s.icon} size={12} color={s.color} style={{ marginRight: 4 }} />
              <Text style={[styles.legendLabel, { color: s.color }]}>{s.fullLabel}</Text>
              <TouchableOpacity onPress={() => setEditModal({ visible: true, shift: s })} style={styles.editIconBtn}>
                <MaterialIcons name="edit" size={12} color={s.color} />
              </TouchableOpacity>
            </View>
            <Text style={styles.legendTime}>{to12h(s.startTime)} – {to12h(s.endTime)}</Text>
            <Text style={styles.legendPortal}>🔓 {subtractOneHour(s.startTime)}</Text>
          </View>
        ))}
      </View>

      {/* Employee List */}
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : teamMembers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="group-off" size={48} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
            <Text style={styles.emptyText}>No approved team members found.</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {teamMembers.map((emp, index) => {
              const name = emp.user?.name || emp.name || 'Unknown';
              const plan = weeklyPlans[emp.id] || Array(7).fill('MORNING');
              
              // Get today's shift specifically for the indicator
              const todayShiftKey = plan[todayIdx] || 'MORNING';
              const todayShiftDef = shifts[todayShiftKey] || SHIFTS[todayShiftKey];

              return (
                <View key={emp.id} style={[styles.row, index !== teamMembers.length - 1 && styles.rowBorder]}>
                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: todayShiftDef.color }]}>
                    <Text style={styles.avatarText}>{getInitials(name)}</Text>
                  </View>

                  {/* Name */}
                  <View style={styles.empInfo}>
                    <Text style={styles.empName}>{name}</Text>
                    <Text style={styles.empRole}>{emp.designation || 'Team Member'}</Text>
                  </View>

                  {/* Right Actions: Today's Shift Indicator + Calendar Btn */}
                  <View style={styles.actionGroup}>
                    {/* Today's Shift Indicator (non-clickable) */}
                    <View style={[styles.shiftIndicator, { backgroundColor: todayShiftDef.bgLight, borderColor: todayShiftDef.color + '40' }]}>
                       <Feather name={todayShiftDef.icon} size={14} color={todayShiftDef.color} />
                       <Text style={[styles.shiftIndicatorText, { color: todayShiftDef.color }]}>{todayShiftDef.label}</Text>
                    </View>

                    {/* Calendar Button -> Opens Weekly Schedule */}
                    <TouchableOpacity
                      style={styles.calendarBtn}
                      onPress={() => setScheduleModal({ visible: true, employee: emp })}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      {!isLoading && teamMembers.length > 0 && (
        <View style={styles.footer}>
          {!isSaved ? (
            <Button title="Save Shifts" onPress={handleSave} isLoading={isSaving} />
          ) : (
            <View style={styles.savedBanner}>
              <MaterialIcons name="check-circle" size={18} color={colors.success} style={{ marginRight: 6 }} />
              <Text style={styles.savedText}>Shifts saved for today!</Text>
            </View>
          )}
        </View>
      )}

      {/* Weekly Schedule Modal */}
      <WeeklyScheduleModal
        visible={scheduleModal.visible}
        employee={scheduleModal.employee}
        weekPlan={weeklyPlans[scheduleModal.employee?.id] || Array(7).fill('MORNING')}
        shifts={shifts}
        onClose={() => setScheduleModal({ visible: false, employee: null })}
        onSave={handleSaveSchedule}
      />

      {/* Edit Shift Timing Modal */}
      <EditShiftModal
        visible={editModal.visible}
        shift={editModal.shift}
        onClose={() => setEditModal({ visible: false, shift: null })}
        onSave={handleSaveShiftTime}
      />
    </SafeAreaView>
  );
}

// ─── Main Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  appBar: {
    backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4 }, android: { elevation: 3 }, web: { boxShadow: '0 2px 8px rgba(0,0,0,0.07)' } }),
  },
  appBarTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  appBarSub: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '15', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.primary + '30' },
  dateBadgeText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary },
  legendBar: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  legendCard: { flex: 1, minWidth: 90, borderRadius: radius.md, padding: spacing.sm, borderWidth: 1 },
  legendCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  legendLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3, flex: 1 },
  editIconBtn: { padding: 2 },
  legendTime: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  legendPortal: { fontSize: 9, color: colors.textMuted, fontWeight: '500' },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  listCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 2 }, web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } }),
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, gap: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { color: '#fff', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold },
  empInfo: { flex: 1, marginRight: spacing.xs },
  empName: { fontSize: typography.fontSize.sm, fontWeight: '700', color: colors.textPrimary },
  empRole: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 0 },
  shiftIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.full, borderWidth: 1,
  },
  shiftIndicatorText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  calendarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },

  footer: { backgroundColor: colors.surface, padding: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  savedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success + '15', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.success + '40' },
  savedText: { color: colors.success, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },
  emptyContainer: { alignItems: 'center', paddingTop: spacing.xxl * 2 },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: typography.fontSize.sm },
  // Edit timing modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  editCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, width: '100%', maxWidth: 400, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 }, android: { elevation: 10 }, web: { boxShadow: '0 20px 40px rgba(0,0,0,0.15)' } }) },
  editHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1 },
  editIconWrap: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  editTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  editSubtitle: { fontSize: typography.fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  editCloseBtn: { padding: spacing.xs, backgroundColor: colors.background, borderRadius: radius.full },
  timeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.lg },
  timeField: { flex: 1 },
  timeSep: { paddingTop: 32, alignItems: 'center' },
  timeLabel: { fontSize: typography.fontSize.xs, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeInput: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary, textAlign: 'center' },
  timeHint: { fontSize: 9, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  portalBox: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.xl },
  portalText: { flex: 1, fontSize: typography.fontSize.sm },
  editActions: { flexDirection: 'row', gap: spacing.md },
  editCancelBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  editCancelText: { fontWeight: '700', color: colors.textSecondary, fontSize: typography.fontSize.sm },
  editSaveBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  editSaveText: { fontWeight: '700', color: '#fff', fontSize: typography.fontSize.sm },
});

// ─── Weekly Modal Styles ──────────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.xl, paddingBottom: spacing.xxl,
    maxHeight: '90%',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16 }, android: { elevation: 12 }, web: { boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' } }),
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  headerLeft: { flex: 1 },
  title: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  closeBtn: { padding: spacing.xs, backgroundColor: colors.background, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  
  weekList: { marginBottom: spacing.lg },
  dayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  dayRowToday: {
    backgroundColor: colors.primary + '08',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderBottomWidth: 0,
    marginVertical: 4,
  },
  dayInfo: { flexDirection: 'row', alignItems: 'center', width: 80 },
  dayName: { fontSize: typography.fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  todayBadge: {
    marginLeft: 6, fontSize: 9, fontWeight: 'bold', color: '#fff',
    backgroundColor: colors.primary, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4,
  },
  shiftSelector: {
    flexDirection: 'row', backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md, padding: 4, gap: 2,
  },
  shiftOption: {
    width: 32, height: 32, borderRadius: radius.sm,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  shiftOptionText: { fontSize: 11, fontWeight: 'bold', color: colors.textSecondary },
  
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  cancelText: { fontWeight: '700', color: colors.textSecondary, fontSize: typography.fontSize.sm },
  saveBtn: { flex: 2, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontWeight: '700', color: '#fff', fontSize: typography.fontSize.sm },
});
