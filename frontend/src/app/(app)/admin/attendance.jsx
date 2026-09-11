import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { attendanceApi } from '../../../services/attendance.api';
import { employeeApi } from '../../../services/employee.api';
import { colors } from '../../../styles/colors';
import { spacing, radius } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';

export default function AttendanceScreen() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async () => {
    try {
      const [attRes, empRes] = await Promise.allSettled([
        attendanceApi.getAllAttendance({ date: selectedDate }),
        employeeApi.getEmployees(),
      ]);

      const records = attRes.status === 'fulfilled' && attRes.value?.data ? attRes.value.data : [];
      const emps = empRes.status === 'fulfilled' && empRes.value?.data ? empRes.value.data : [];

      setAttendanceRecords(records);
      setEmployees(emps);
    } catch (err) {
      console.error('Error loading attendance data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Map employee records with their attendance status for selectedDate
  const mergedList = employees.map((emp) => {
    const record = attendanceRecords.find(
      (r) => r.employeeId === emp.id && r.date === selectedDate
    );
    return {
      empId: emp.id,
      name: emp.user?.name || emp.name || 'Employee',
      empCode: `EMP${String(emp.id).padStart(4, '0')}`,
      designation: emp.designation || 'Staff',
      department: emp.department?.name || emp.team?.name || 'General',
      status: record?.status || 'ABSENT',
      checkIn: record?.checkIn || record?.inTime || null,
      checkOut: record?.checkOut || record?.outTime || null,
      workHours: record?.workingHours || null,
    };
  });

  const filteredList = mergedList.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.empCode.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: mergedList.length,
    present: mergedList.filter((m) => m.status === 'PRESENT').length,
    late: mergedList.filter((m) => m.status === 'LATE').length,
    absent: mergedList.filter((m) => m.status === 'ABSENT').length,
    leave: mergedList.filter((m) => m.status === 'LEAVE').length,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT':
        return { bg: 'rgba(16, 185, 129, 0.1)', text: '#047857', border: '#10B981' };
      case 'LATE':
        return { bg: 'rgba(245, 158, 11, 0.12)', text: '#B45309', border: '#F59E0B' };
      case 'LEAVE':
        return { bg: 'rgba(139, 92, 246, 0.12)', text: '#6D28D9', border: '#8B5CF6' };
      case 'ABSENT':
      default:
        return { bg: 'rgba(239, 68, 68, 0.1)', text: '#B91C1C', border: '#EF4444' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Summary */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Company Attendance</Text>
          <Text style={styles.headerSubtitle}>
            Daily attendance register · {selectedDate}
          </Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{counts.total} Staff</Text>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#10B981' }]}>{counts.present}</Text>
          <Text style={styles.metricLabel}>Present</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#F59E0B' }]}>{counts.late}</Text>
          <Text style={styles.metricLabel}>Late</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#EF4444' }]}>{counts.absent}</Text>
          <Text style={styles.metricLabel}>Absent</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNumber, { color: '#8B5CF6' }]}>{counts.leave}</Text>
          <Text style={styles.metricLabel}>Leave</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, ID or department..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialIcons name="cancel" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {['ALL', 'PRESENT', 'LATE', 'ABSENT'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, statusFilter === tab && styles.filterChipActive]}
            onPress={() => setStatusFilter(tab)}
          >
            <Text style={[styles.filterChipText, statusFilter === tab && styles.filterChipTextActive]}>
              {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Attendance List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#1A365D" />
          <Text style={styles.loadingText}>Loading attendance records...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => String(item.empId)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const colorsScheme = getStatusColor(item.status);
            return (
              <View style={styles.employeeCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardNameWrap}>
                    <Text style={styles.empName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.empMeta}>
                      {item.empCode} · {item.designation} · {item.department}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: colorsScheme.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: colorsScheme.border }]} />
                    <Text style={[styles.statusText, { color: colorsScheme.text }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {(item.checkIn || item.checkOut) && (
                  <View style={styles.timeRow}>
                    <View style={styles.timeItem}>
                      <MaterialIcons name="login" size={13} color="#64748B" />
                      <Text style={styles.timeText}>In: {item.checkIn || '--:--'}</Text>
                    </View>
                    <View style={styles.timeItem}>
                      <MaterialIcons name="logout" size={13} color="#64748B" />
                      <Text style={styles.timeText}>Out: {item.checkOut || '--:--'}</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptySubtitle}>
                No attendance entries match your search or filter.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  totalBadge: {
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A365D',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1A365D',
    borderColor: '#1A365D',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 85,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardNameWrap: {
    flex: 1,
    paddingRight: 8,
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  empMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
});
