import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';
import { typography } from '../../styles/typography';

export const TeamCard = ({ team, onPress, onMenuPress }) => {
  const departmentName = team?.department?.name || 'General';
  const managerName = team?.manager?.name || 'Unassigned';
  const employeeCount = team?.employeeCount !== undefined ? team.employeeCount : (team?.members?.length || 0);
  const status = team?.status || 'ACTIVE';
  const isActive = status === 'ACTIVE';

  const attendance = team?.attendanceSummary;
  const hasAttendanceData = attendance && attendance.hasData && attendance.total > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Top Header: Team Name, Status, Three-dot Menu */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.teamName} numberOfLines={1}>
            {team.name}
          </Text>
          <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
            <View style={[styles.statusDot, isActive ? styles.dotActive : styles.dotInactive]} />
            <Text style={[styles.statusText, isActive ? styles.textActive : styles.textInactive]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          activeOpacity={0.6}
          onPress={(e) => {
            e?.stopPropagation?.();
            onMenuPress?.(team);
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="more-vert" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Department & Team Head */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialIcons name="domain" size={14} color={colors.textMuted} style={styles.metaIcon} />
          <Text style={styles.metaText} numberOfLines={1}>
            {departmentName}
          </Text>
        </View>

        <View style={styles.metaDot} />

        <View style={styles.metaItem}>
          <MaterialIcons name="person" size={14} color={colors.textMuted} style={styles.metaIcon} />
          <Text style={styles.metaText} numberOfLines={1}>
            Head: <Text style={styles.metaHighlight}>{managerName}</Text>
          </Text>
        </View>
      </View>

      {/* Member count */}
      <View style={styles.employeeCountRow}>
        <MaterialIcons name="groups" size={15} color={colors.primary} style={styles.metaIcon} />
        <Text style={styles.employeeCountText}>
          {employeeCount} {employeeCount === 1 ? 'Employee' : 'Employees'}
        </Text>
      </View>

      {/* Today's Attendance (Only displayed when real attendance records exist for today) */}
      {hasAttendanceData && (
        <View style={styles.attendanceContainer}>
          <View style={styles.attendanceDivider} />
          <View style={styles.attendanceHeader}>
            <Text style={styles.attendanceLabel}>Today's Attendance</Text>
          </View>
          <View style={styles.attendanceStats}>
            <View style={styles.statChip}>
              <View style={[styles.indicatorDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.statText, { color: '#047857' }]}>
                {attendance.present || 0} Present
              </Text>
            </View>

            {attendance.late > 0 && (
              <View style={styles.statChip}>
                <View style={[styles.indicatorDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.statText, { color: '#B45309' }]}>
                  {attendance.late} Late
                </Text>
              </View>
            )}

            {attendance.absent > 0 && (
              <View style={styles.statChip}>
                <View style={[styles.indicatorDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.statText, { color: '#B91C1C' }]}>
                  {attendance.absent} Absent
                </Text>
              </View>
            )}

            {attendance.leave > 0 && (
              <View style={styles.statChip}>
                <View style={[styles.indicatorDot, { backgroundColor: '#8B5CF6' }]} />
                <Text style={[styles.statText, { color: '#6D28D9' }]}>
                  {attendance.leave} Leave
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    gap: 4,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  statusInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#10B981',
  },
  dotInactive: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  textActive: {
    color: '#059669',
  },
  textInactive: {
    color: '#DC2626',
  },
  menuButton: {
    padding: 6,
    marginRight: -4,
    borderRadius: radius.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '52%',
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  metaHighlight: {
    fontWeight: '600',
    color: '#334155',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  employeeCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  employeeCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  attendanceContainer: {
    marginTop: 10,
  },
  attendanceDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  attendanceHeader: {
    marginBottom: 4,
  },
  attendanceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  attendanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
