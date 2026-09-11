import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { employeeApi } from '../../../services/employee.api';
import { attendanceApi } from '../../../services/attendance.api';
import { useToast } from '../../../components/ui/Toast';

// Helper: extract accurate initials from employee's real name
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U';
  const clean = name.trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function EmployeesScreen() {
  const params = useLocalSearchParams();
  let toastContext = null;
  try {
    toastContext = useToast();
  } catch (e) {
    // Graceful fallback if mounted without ToastProvider
  }

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE'

  // Switch to requested filter tab from route params (e.g. filter=PENDING)
  useEffect(() => {
    if (params?.filter) {
      const target = String(params.filter).toUpperCase();
      if (['ALL', 'ACTIVE', 'PENDING', 'INACTIVE'].includes(target)) {
        setActiveFilter(target);
      }
    }
  }, [params?.filter]);

  // Modal / Action states
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [isRemovalVisible, setIsRemovalVisible] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editErrors, setEditErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Monthly summary state for Details Modal
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Local fallback toast state if needed
  const [localToast, setLocalToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    if (toastContext?.show) {
      toastContext.show(message, type);
    } else {
      setLocalToast({ message, type });
      setTimeout(() => setLocalToast(null), 3000);
    }
  }, [toastContext]);

  // Load employee data from backend
  const loadEmployees = useCallback(async () => {
    try {
      const res = await employeeApi.getEmployees();
      const raw = res?.data || (Array.isArray(res) ? res : []);
      setEmployees(raw);
    } catch (error) {
      console.error('Failed to load employees:', error);
      showToast('Failed to load employees', 'error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEmployees();
  };

  // Counts for notifications and chips
  const counts = useMemo(() => {
    let pending = 0;
    let active = 0;
    let inactive = 0;

    employees.forEach((emp) => {
      const isPending =
        emp.approvalStatus === 'PENDING' || emp.approvalStatus === 'REMOVAL PENDING';
      const isInactive =
        emp.user?.status === 'INACTIVE' || emp.approvalStatus === 'REJECTED';

      if (isPending) pending++;
      else if (isInactive) inactive++;
      else active++;
    });

    return { total: employees.length, pending, active, inactive };
  }, [employees]);

  // Efficient memoized filtering
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return employees.filter((emp) => {
      const empName = (emp.user?.name || emp.name || '').toLowerCase();
      const empId = `emp-${emp.id}`.toLowerCase();
      const rawId = `${emp.id}`;
      const designation = (emp.designation || '').toLowerCase();
      const email = (emp.user?.email || emp.email || '').toLowerCase();
      const phone = (emp.phone || '').toLowerCase();

      // Search match
      const matchesSearch =
        !q ||
        empName.includes(q) ||
        empId.includes(q) ||
        rawId.includes(q) ||
        designation.includes(q) ||
        email.includes(q) ||
        phone.includes(q);

      if (!matchesSearch) return false;

      // Status filter
      const isPending =
        emp.approvalStatus === 'PENDING' || emp.approvalStatus === 'REMOVAL PENDING';
      const isInactive =
        emp.user?.status === 'INACTIVE' || emp.approvalStatus === 'REJECTED';
      const isActive = !isPending && !isInactive;

      if (activeFilter === 'ACTIVE') return isActive;
      if (activeFilter === 'PENDING') return isPending;
      if (activeFilter === 'INACTIVE') return isInactive;
      return true;
    });
  }, [employees, search, activeFilter]);

  // Quick Action: Approve/Activate or Reject/Deactivate Employee
  const handleQuickStatus = async (employee, newApprovalStatus, newStatus) => {
    const empName = employee.user?.name || employee.name || 'Employee';
    setActionInProgressId(employee.id);

    try {
      const payload = {
        approvalStatus: newApprovalStatus,
        status: newStatus,
      };
      await employeeApi.updateEmployee(employee.id, payload);

      // Instantly update state
      setEmployees((prev) =>
        prev.map((item) => {
          if (item.id === employee.id) {
            return {
              ...item,
              approvalStatus: newApprovalStatus,
              user: item.user
                ? { ...item.user, status: newStatus }
                : { id: item.userId, status: newStatus },
            };
          }
          return item;
        })
      );

      const statusLabel = newStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
      showToast(`✓ ${empName} set to ${statusLabel}`, 'success');
    } catch (error) {
      console.error('Failed to update employee status:', error);
      showToast(error.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Toggle active/inactive for any employee
  const handleToggleActiveInactive = async (employee) => {
    const currentIsActive =
      employee.user?.status === 'ACTIVE' ||
      employee.approvalStatus === 'APPROVED' ||
      (!employee.user?.status && employee.approvalStatus !== 'REJECTED');

    const nextApprovalStatus = currentIsActive ? 'REJECTED' : 'APPROVED';
    const nextStatus = currentIsActive ? 'INACTIVE' : 'ACTIVE';

    await handleQuickStatus(employee, nextApprovalStatus, nextStatus);
    setIsActionSheetVisible(false);
  };

  // Handle opening action sheet
  const handleOpenActionSheet = (employee) => {
    setSelectedEmployee(employee);
    setIsActionSheetVisible(true);
  };

  // Action: Open Details Modal
  const handleOpenDetails = (employee) => {
    const target = employee || selectedEmployee;
    setSelectedEmployee(target);
    setIsActionSheetVisible(false);
    setIsDetailsVisible(true);
    loadMonthlySummary(target.id, selectedDate);
  };

  // Load Monthly Attendance Summary
  const loadMonthlySummary = async (empId, date) => {
    if (!empId) return;
    setIsLoadingSummary(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const res = await attendanceApi.getEmployeeMonthlySummary(empId, year, month);
      setMonthlySummary(res?.data || { present: 0, absent: 0, late: 0, leave: 0 });
    } catch (error) {
      setMonthlySummary({ present: 0, absent: 0, late: 0, leave: 0 });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleChangeMonth = (delta) => {
    const nextDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + delta, 1);
    setSelectedDate(nextDate);
    if (selectedEmployee?.id) {
      loadMonthlySummary(selectedEmployee.id, nextDate);
    }
  };

  // Action: Open Edit Modal
  const handleOpenEdit = () => {
    if (!selectedEmployee) return;
    setEditName(selectedEmployee.user?.name || selectedEmployee.name || '');
    setEditDesignation(selectedEmployee.designation || '');
    setEditPhone(selectedEmployee.phone || '');
    setEditErrors({});
    setIsActionSheetVisible(false);
    setIsEditVisible(true);
  };

  // Validate & Save Edit
  const handleSaveEdit = async () => {
    const errors = {};
    if (!editName.trim() || editName.trim().length < 2) {
      errors.name = 'Full name is required (at least 2 characters)';
    }
    if (!editDesignation.trim()) {
      errors.designation = 'Role / designation is required';
    }
    if (editPhone && !/^\d{10}$/.test(editPhone.replace(/\D/g, ''))) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: editName.trim(),
        designation: editDesignation.trim(),
        phone: editPhone.trim(),
      };
      await employeeApi.updateEmployee(selectedEmployee.id, payload);

      // Update state locally for immediate snappy feedback
      setEmployees((prev) =>
        prev.map((item) => {
          if (item.id === selectedEmployee.id) {
            return {
              ...item,
              designation: payload.designation,
              phone: payload.phone,
              name: payload.name,
              user: item.user ? { ...item.user, name: payload.name } : item.user,
            };
          }
          return item;
        })
      );

      setIsEditVisible(false);
      showToast('✓ Employee updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update employee:', error);
      showToast(error.response?.data?.message || 'Failed to update employee', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Action: Open Removal Modal
  const handleOpenRemoval = () => {
    setIsActionSheetVisible(false);
    setIsRemovalVisible(true);
  };

  // Send Removal Request
  const handleSendRemovalRequest = async () => {
    if (!selectedEmployee) return;

    if (
      selectedEmployee.approvalStatus === 'PENDING' ||
      selectedEmployee.approvalStatus === 'REMOVAL PENDING'
    ) {
      showToast('A removal request is already pending for this employee', 'warning');
      setIsRemovalVisible(false);
      return;
    }

    try {
      await employeeApi.updateEmployee(selectedEmployee.id, { approvalStatus: 'PENDING' });

      // Update state locally to reflect REMOVAL PENDING
      setEmployees((prev) =>
        prev.map((item) =>
          item.id === selectedEmployee.id ? { ...item, approvalStatus: 'REMOVAL PENDING' } : item
        )
      );

      setIsRemovalVisible(false);
      showToast('✓ Removal request sent to Admin', 'success');
    } catch (error) {
      console.error('Failed to submit removal request:', error);
      showToast('Failed to submit removal request', 'error');
    }
  };

  // Render Status Badge
  const renderStatusBadge = (employee, compact = false) => {
    const isPending =
      employee.approvalStatus === 'PENDING' || employee.approvalStatus === 'REMOVAL PENDING';
    const isInactive =
      employee.user?.status === 'INACTIVE' || employee.approvalStatus === 'REJECTED';

    if (isPending) {
      return (
        <View style={[styles.badgePending, compact && styles.badgeCompact]}>
          <Text style={styles.badgePendingText}>PENDING</Text>
        </View>
      );
    }
    if (isInactive) {
      return (
        <View style={[styles.badgeInactive, compact && styles.badgeCompact]}>
          <Text style={styles.badgeInactiveText}>INACTIVE</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badgeActive, compact && styles.badgeCompact]}>
        <Text style={styles.badgeActiveText}>ACTIVE</Text>
      </View>
    );
  };

  // Render Employee Row Item - Mobile Optimized for 320px-430px
  const renderEmployeeItem = ({ item }) => {
    const name = item.user?.name || item.name || 'Employee';
    const initials = getInitials(name);
    const empId = `EMP-${item.id}`;
    const designation = item.designation;
    const teamName = item.team?.name;

    const isPending =
      item.approvalStatus === 'PENDING' || item.approvalStatus === 'REMOVAL PENDING';
    const isBusy = actionInProgressId === item.id;

    return (
      <View style={styles.employeeCard}>
        {/* Main Row Content */}
        <TouchableOpacity
          style={styles.cardHeaderRow}
          activeOpacity={0.7}
          onPress={() => handleOpenDetails(item)}
        >
          {/* Avatar (Compact 38px) */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* Center Info */}
          <View style={styles.infoContainer}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.employeeName} numberOfLines={1}>
                {name}
              </Text>
              {renderStatusBadge(item, true)}
            </View>

            <Text style={styles.employeeSubtext} numberOfLines={1}>
              {empId}
              {designation ? ` · ${designation}` : ''}
            </Text>

            {teamName ? (
              <Text style={styles.teamText} numberOfLines={1}>
                Team: {teamName}
              </Text>
            ) : null}
          </View>

          {/* Three-Dot Menu Icon */}
          <TouchableOpacity
            style={styles.menuIconButton}
            onPress={() => handleOpenActionSheet(item)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="more-vertical" size={18} color="#64748B" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Quick Action Buttons for Pending Approval */}
        {isPending && (
          <View style={styles.pendingActionRow}>
            <TouchableOpacity
              style={styles.quickApproveBtn}
              onPress={() => handleQuickStatus(item, 'APPROVED', 'ACTIVE')}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              {isBusy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="check" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.quickApproveBtnText}>Approve (Active)</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickRejectBtn}
              onPress={() => handleQuickStatus(item, 'REJECTED', 'INACTIVE')}
              disabled={isBusy}
              activeOpacity={0.8}
            >
              <Feather name="x" size={13} color="#DC2626" style={{ marginRight: 4 }} />
              <Text style={styles.quickRejectBtnText}>Reject (Inactive)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Skeletons while initial load
  const renderSkeletonRows = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5, 6].map((key) => (
        <View key={key} style={styles.skeletonRow}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonInfo}>
            <View style={styles.skeletonLineLong} />
            <View style={styles.skeletonLineShort} />
          </View>
          <View style={styles.skeletonBadge} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Local Toast Banner Fallback */}
      {localToast && (
        <View
          style={[
            styles.localToastBanner,
            { backgroundColor: localToast.type === 'error' ? '#FEF2F2' : '#F0FDF4' },
          ]}
        >
          <Text
            style={[
              styles.localToastText,
              { color: localToast.type === 'error' ? '#DC2626' : '#16A34A' },
            ]}
          >
            {localToast.message}
          </Text>
        </View>
      )}

      {/* 2. PAGE TITLE SECTION */}
      <View style={styles.titleSection}>
        <View>
          <Text style={styles.pageTitle}>Employees</Text>
          <Text style={styles.pageSubtitle}>
            {filteredEmployees.length} {filteredEmployees.length === 1 ? 'Employee' : 'Employees'}
            {search ? ` (filtered)` : ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshIconBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="refresh-cw" size={16} color="#1A365D" />
        </TouchableOpacity>
      </View>

      {/* 3. SEARCH BAR */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. FILTER ROW WITH NOTIFICATION BADGE FOR PENDING */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* All Employees */}
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveFilter('ALL')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'ALL' && styles.filterChipTextActive,
              ]}
            >
              All ({counts.total})
            </Text>
          </TouchableOpacity>

          {/* Pending Approval with Notification Badge */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'PENDING' && styles.filterChipPendingActive,
              counts.pending > 0 && activeFilter !== 'PENDING' && styles.filterChipPendingAlert,
            ]}
            onPress={() => setActiveFilter('PENDING')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'PENDING'
                  ? styles.filterChipTextActive
                  : counts.pending > 0
                  ? styles.filterChipPendingAlertText
                  : null,
              ]}
            >
              Pending
            </Text>

            {counts.pending > 0 && (
              <View style={styles.chipNotificationBadge}>
                <Text style={styles.chipNotificationBadgeText}>{counts.pending}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Active */}
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'ACTIVE' && styles.filterChipActive]}
            onPress={() => setActiveFilter('ACTIVE')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'ACTIVE' && styles.filterChipTextActive,
              ]}
            >
              Active ({counts.active})
            </Text>
          </TouchableOpacity>

          {/* Inactive */}
          {counts.inactive > 0 && (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'INACTIVE' && styles.filterChipActive]}
              onPress={() => setActiveFilter('INACTIVE')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === 'INACTIVE' && styles.filterChipTextActive,
                ]}
              >
                Inactive ({counts.inactive})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* 5. EMPLOYEE LIST */}
      {isLoading ? (
        renderSkeletonRows()
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEmployeeItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1A365D']}
              tintColor="#1A365D"
            />
          }
          ListEmptyComponent={
            search.trim() ? (
              <View style={styles.emptyContainer}>
                <Feather name="search" size={32} color="#CBD5E1" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyTitle}>No employees found</Text>
                <Text style={styles.emptySubtitle}>
                  Try another name, employee ID, role or phone number.
                </Text>
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => setSearch('')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.clearSearchBtnText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="users" size={32} color="#CBD5E1" style={{ marginBottom: 10 }} />
                <Text style={styles.emptyTitle}>No employees in this view.</Text>
                <Text style={styles.emptySubtitle}>
                  {activeFilter === 'PENDING'
                    ? 'No approval requests waiting at the moment.'
                    : 'Employees assigned by Admin will appear here.'}
                </Text>
              </View>
            )
          }
        />
      )}

      {/* 8. THREE-DOT ACTION MENU MODAL (BOTTOM SHEET) */}
      <Modal
        visible={isActionSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsActionSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsActionSheetVisible(false)}
        >
          <View style={styles.bottomSheetContent} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />

            {selectedEmployee && (
              <View style={styles.sheetHeader}>
                <View style={styles.sheetAvatar}>
                  <Text style={styles.sheetAvatarText}>
                    {getInitials(selectedEmployee.user?.name || selectedEmployee.name)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.sheetTitle} numberOfLines={1}>
                      {selectedEmployee.user?.name || selectedEmployee.name}
                    </Text>
                    {renderStatusBadge(selectedEmployee, true)}
                  </View>
                  <Text style={styles.sheetSubtitle}>
                    EMP-{selectedEmployee.id}
                    {selectedEmployee.designation ? ` · ${selectedEmployee.designation}` : ''}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.sheetDivider} />

            {/* Quick Toggle Active / Inactive Action */}
            {selectedEmployee && (
              <TouchableOpacity
                style={styles.sheetActionItem}
                onPress={() => handleToggleActiveInactive(selectedEmployee)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.sheetActionIconBox,
                    {
                      backgroundColor:
                        selectedEmployee.user?.status === 'ACTIVE' ||
                        selectedEmployee.approvalStatus === 'APPROVED'
                          ? '#FEF2F2'
                          : '#ECFDF5',
                    },
                  ]}
                >
                  <Feather
                    name={
                      selectedEmployee.user?.status === 'ACTIVE' ||
                      selectedEmployee.approvalStatus === 'APPROVED'
                        ? 'slash'
                        : 'check-circle'
                    }
                    size={16}
                    color={
                      selectedEmployee.user?.status === 'ACTIVE' ||
                      selectedEmployee.approvalStatus === 'APPROVED'
                        ? '#DC2626'
                        : '#059669'
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.sheetActionText,
                    {
                      color:
                        selectedEmployee.user?.status === 'ACTIVE' ||
                        selectedEmployee.approvalStatus === 'APPROVED'
                          ? '#DC2626'
                          : '#059669',
                    },
                  ]}
                >
                  {selectedEmployee.user?.status === 'ACTIVE' ||
                  selectedEmployee.approvalStatus === 'APPROVED'
                    ? 'Set as Inactive'
                    : 'Set as Active'}
                </Text>
                <Feather name="chevron-right" size={16} color="#CBD5E1" />
              </TouchableOpacity>
            )}

            {/* Action 1: View Details */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={() => handleOpenDetails(selectedEmployee)}
              activeOpacity={0.7}
            >
              <View style={[styles.sheetActionIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Feather name="eye" size={16} color="#1A365D" />
              </View>
              <Text style={styles.sheetActionText}>View Details</Text>
              <Feather name="chevron-right" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Action 2: Edit Employee */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={handleOpenEdit}
              activeOpacity={0.7}
            >
              <View style={[styles.sheetActionIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Feather name="edit-2" size={16} color="#1A365D" />
              </View>
              <Text style={styles.sheetActionText}>Edit Employee</Text>
              <Feather name="chevron-right" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Action 3: Request Removal */}
            <TouchableOpacity
              style={styles.sheetActionItem}
              onPress={handleOpenRemoval}
              activeOpacity={0.7}
            >
              <View style={[styles.sheetActionIconBox, { backgroundColor: '#FEF2F2' }]}>
                <Feather name="user-x" size={16} color="#DC2626" />
              </View>
              <Text style={[styles.sheetActionText, { color: '#DC2626' }]}>Request Removal</Text>
              <Feather name="chevron-right" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancelBtn}
              onPress={() => setIsActionSheetVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 9. VIEW EMPLOYEE DETAILS MODAL */}
      <Modal
        visible={isDetailsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDetailsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            {/* Header */}
            <View style={styles.detailsModalHeader}>
              <Text style={styles.modalTitle}>Employee Details</Text>
              <TouchableOpacity
                onPress={() => setIsDetailsVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedEmployee && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Profile Banner */}
                <View style={styles.detailsProfileCard}>
                  <View style={styles.detailsAvatar}>
                    <Text style={styles.detailsAvatarText}>
                      {getInitials(selectedEmployee.user?.name || selectedEmployee.name)}
                    </Text>
                  </View>
                  <Text style={styles.detailsName}>
                    {selectedEmployee.user?.name || selectedEmployee.name}
                  </Text>
                  <Text style={styles.detailsDesignation}>
                    {selectedEmployee.designation || 'Team Member'}
                  </Text>
                  <View style={{ marginTop: 8 }}>
                    {renderStatusBadge(selectedEmployee)}
                  </View>
                </View>

                {/* Account & Job Info */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionHeaderTitle}>Information</Text>
                  <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoRowLabel}>Employee ID</Text>
                      <Text style={styles.infoRowValue}>EMP-{selectedEmployee.id}</Text>
                    </View>

                    {selectedEmployee.user?.email || selectedEmployee.email ? (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoRowLabel}>Email</Text>
                        <Text style={styles.infoRowValue}>
                          {selectedEmployee.user?.email || selectedEmployee.email}
                        </Text>
                      </View>
                    ) : null}

                    {selectedEmployee.phone ? (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoRowLabel}>Phone Number</Text>
                        <Text style={styles.infoRowValue}>{selectedEmployee.phone}</Text>
                      </View>
                    ) : null}

                    {selectedEmployee.team?.name ? (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoRowLabel}>Team</Text>
                        <Text style={styles.infoRowValue}>{selectedEmployee.team.name}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* This Month Attendance */}
                <View style={styles.detailsSection}>
                  <View style={styles.monthHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>Attendance Summary</Text>
                    <View style={styles.monthSelector}>
                      <TouchableOpacity onPress={() => handleChangeMonth(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name="chevron-left" size={16} color="#1A365D" />
                      </TouchableOpacity>
                      <Text style={styles.monthLabel}>
                        {new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(selectedDate)}
                      </Text>
                      <TouchableOpacity onPress={() => handleChangeMonth(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Feather name="chevron-right" size={16} color="#1A365D" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isLoadingSummary ? (
                    <ActivityIndicator color="#1A365D" style={{ marginVertical: 16 }} />
                  ) : (
                    <View style={styles.statsGrid}>
                      <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
                        <Text style={styles.statNumber}>{monthlySummary?.present ?? 0}</Text>
                        <Text style={styles.statLabel}>Present</Text>
                      </View>
                      <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
                        <Text style={styles.statNumber}>{monthlySummary?.absent ?? 0}</Text>
                        <Text style={styles.statLabel}>Absent</Text>
                      </View>
                      <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
                        <Text style={styles.statNumber}>{monthlySummary?.late ?? 0}</Text>
                        <Text style={styles.statLabel}>Late</Text>
                      </View>
                      <View style={[styles.statCard, { borderLeftColor: '#64748B' }]}>
                        <Text style={styles.statNumber}>{monthlySummary?.leave ?? 0}</Text>
                        <Text style={styles.statLabel}>Leave</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Modal Footer Actions */}
                <View style={styles.detailsBtnRow}>
                  <TouchableOpacity
                    style={styles.detailsEditBtn}
                    onPress={() => {
                      setIsDetailsVisible(false);
                      handleOpenEdit();
                    }}
                    activeOpacity={0.8}
                  >
                    <Feather name="edit-2" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.detailsEditBtnText}>Edit Employee</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailsCloseBtn}
                    onPress={() => setIsDetailsVisible(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.detailsCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 10. EDIT EMPLOYEE MODAL */}
      <Modal
        visible={isEditVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.editModalContent}>
            <View style={styles.detailsModalHeader}>
              <Text style={styles.modalTitle}>Edit Employee</Text>
              <TouchableOpacity
                onPress={() => setIsEditVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
              {/* Field: Employee Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Employee Name *</Text>
                <TextInput
                  style={[styles.formInput, editErrors.name && styles.formInputError]}
                  value={editName}
                  onChangeText={(text) => {
                    setEditName(text);
                    if (editErrors.name) setEditErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="Enter employee full name"
                  placeholderTextColor="#94A3B8"
                />
                {editErrors.name && <Text style={styles.errorText}>{editErrors.name}</Text>}
              </View>

              {/* Field: Role / Designation */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Role / Designation *</Text>
                <TextInput
                  style={[styles.formInput, editErrors.designation && styles.formInputError]}
                  value={editDesignation}
                  onChangeText={(text) => {
                    setEditDesignation(text);
                    if (editErrors.designation) setEditErrors((prev) => ({ ...prev, designation: null }));
                  }}
                  placeholder="e.g. Software Developer"
                  placeholderTextColor="#94A3B8"
                />
                {editErrors.designation && <Text style={styles.errorText}>{editErrors.designation}</Text>}
              </View>

              {/* Field: Phone Number */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={[styles.formInput, editErrors.phone && styles.formInputError]}
                  value={editPhone}
                  onChangeText={(text) => {
                    setEditPhone(text);
                    if (editErrors.phone) setEditErrors((prev) => ({ ...prev, phone: null }));
                  }}
                  placeholder="10-digit phone number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {editErrors.phone && <Text style={styles.errorText}>{editErrors.phone}</Text>}
              </View>

              {/* Buttons */}
              <View style={styles.formActionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsEditVisible(false)}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                  onPress={handleSaveEdit}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 11. REQUEST REMOVAL CONFIRMATION MODAL */}
      <Modal
        visible={isRemovalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRemovalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.removalIconContainer}>
              <Feather name="alert-triangle" size={22} color="#DC2626" />
            </View>

            <Text style={styles.confirmTitle}>Request Employee Removal</Text>

            <Text style={styles.confirmMessage}>
              Are you sure you want to request removal of{' '}
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                {selectedEmployee?.user?.name || selectedEmployee?.name}
              </Text>{' '}
              {selectedEmployee?.team?.name ? (
                <>
                  from <Text style={{ fontWeight: '700', color: '#0F172A' }}>{selectedEmployee.team.name}</Text>
                </>
              ) : null}
              ?
            </Text>

            <Text style={styles.confirmSubnote}>
              This will notify the Admin for final approval. The employee will remain visible under 'PENDING' status.
            </Text>

            <View style={styles.confirmButtonsRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setIsRemovalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmSendBtn}
                onPress={handleSendRemovalRequest}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmSendBtnText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Fallback Local Toast
  localToastBanner: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  localToastText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Title Section
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  refreshIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: '#0F172A',
  },

  // Filter Chips
  filterSection: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 12,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#1A365D',
    borderColor: '#1A365D',
  },
  filterChipPendingActive: {
    backgroundColor: '#B45309',
    borderColor: '#B45309',
  },
  filterChipPendingAlert: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipPendingAlertText: {
    color: '#B45309',
    fontWeight: '700',
  },
  chipNotificationBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipNotificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // List Container
  listContainer: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 24,
  },

  // Employee Card
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      },
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1A365D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 6,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
  },
  employeeSubtext: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '400',
  },
  teamText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  menuIconButton: {
    padding: 4,
  },

  // Badges
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeActive: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeActiveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.2,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgePendingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.2,
  },
  badgeInactive: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeInactiveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.2,
  },

  // Quick Action Buttons for Pending Approval
  pendingActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickApproveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A365D',
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickApproveBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  quickRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickRejectBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
  },

  // Skeletons
  skeletonContainer: {
    paddingHorizontal: 12,
    gap: 8,
    paddingTop: 4,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skeletonAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  skeletonInfo: {
    flex: 1,
    gap: 6,
  },
  skeletonLineLong: {
    width: '60%',
    height: 10,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  skeletonLineShort: {
    width: '40%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
  },
  skeletonBadge: {
    width: 44,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },

  // Empty State
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  clearSearchBtn: {
    marginTop: 12,
    backgroundColor: '#1A365D',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  clearSearchBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Modals & Bottom Sheets
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A365D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sheetAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 6,
  },
  sheetActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetActionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sheetActionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  sheetCancelBtn: {
    marginTop: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },

  // Details Modal
  detailsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    maxHeight: '90%',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailsProfileCard: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1A365D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailsAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailsName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailsDesignation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  detailsSection: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoRowLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoRowValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  // Monthly stats
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A365D',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 3,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },

  detailsBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  detailsEditBtn: {
    flex: 1,
    backgroundColor: '#1A365D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  detailsEditBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  detailsCloseBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  detailsCloseBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },

  // Edit Modal
  editModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  formInput: {
    height: 40,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  formInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '500',
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 7,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#1A365D',
    paddingVertical: 10,
    borderRadius: 7,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Confirmation Removal Modal
  confirmModalContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  removalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 6,
  },
  confirmSubnote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 16,
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 7,
    alignItems: 'center',
  },
  confirmCancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmSendBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 7,
    alignItems: 'center',
  },
  confirmSendBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
