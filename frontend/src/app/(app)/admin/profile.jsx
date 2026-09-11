import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '../../../hooks/useAuth';
import { useAppTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useToast } from '../../../components/ui/Toast';
import { THEME_COLORS } from '../../../styles/colors';

import { employeeApi } from '../../../services/employee.api';
import { teamApi } from '../../../services/team.api';

import { ChangePasswordModal } from '../../../components/profile/ChangePasswordModal';
import { EditProfileModal } from '../../../components/profile/EditProfileModal';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser, isLoading: authLoading } = useAuth();
  const { primaryColor, setPrimaryColor, theme } = useAppTheme();
  const { language, changeLanguage, languages, t } = useLanguage();
  const toast = useToast();

  // Modals state
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [isSupportModalVisible, setIsSupportModalVisible] = useState(false);

  // Settings & Notification state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Live backend stats
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [companyStats, setCompanyStats] = useState({
    employeeCount: 0,
    teamCount: 0,
  });

  // Load push preference
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('pref_push_notifications');
        if (isMounted && stored !== null) {
          setPushEnabled(stored === '1');
          return;
        }
      } catch (e) {
        if (typeof localStorage !== 'undefined') {
          const v = localStorage.getItem('pref_push_notifications');
          if (isMounted && v !== null) {
            setPushEnabled(v === '1');
            return;
          }
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch live stats from backend
  const fetchCompanyStats = useCallback(async () => {
    try {
      setStatsError(null);
      const [empRes, teamRes] = await Promise.allSettled([
        employeeApi.getEmployees(),
        teamApi.getTeams(),
      ]);

      let empCount = 0;
      if (empRes.status === 'fulfilled') {
        const d = empRes.value;
        const list = Array.isArray(d) ? d : d?.data || [];
        empCount = list.length;
      }

      let teamCount = 0;
      if (teamRes.status === 'fulfilled') {
        const d = teamRes.value;
        const list = Array.isArray(d) ? d : d?.data || [];
        teamCount = list.length;
      }

      setCompanyStats({
        employeeCount: empCount,
        teamCount: teamCount,
      });
    } catch (err) {
      setStatsError('Unable to load some organizational metrics');
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyStats();
  }, [fetchCompanyStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCompanyStats();
  }, [fetchCompanyStats]);

  // Handle push notification toggle
  const handleTogglePush = async (val) => {
    setPushEnabled(val);
    try {
      await SecureStore.setItemAsync('pref_push_notifications', val ? '1' : '0');
    } catch (e) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pref_push_notifications', val ? '1' : '0');
      }
    }
    toast.show(
      val ? 'Push notifications enabled' : 'Push notifications disabled',
      'info'
    );
  };

  // Handle profile update success
  const handleProfileUpdated = async (updatedData) => {
    try {
      await updateUser(updatedData);
      toast.show('✓ Profile updated successfully', 'success');
    } catch (e) {
      toast.show('Failed to save profile locally', 'error');
    }
  };

  // Handle logout
  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      setIsLogoutModalVisible(false);
      await logout();
      router.replace('/(auth)/login');
    } catch (err) {
      setIsLoggingOut(false);
      toast.show('Failed to log out. Please try again.', 'error');
    }
  };

  // Initials generator
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : (user?.username || 'A').substring(0, 2).toUpperCase();

  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Administrator'
      : user?.role
      ? user.role
      : 'Administrator';

  // Subscription status
  const maxFreeEmployees = 20;
  const isLimitExceeded = companyStats.employeeCount > maxFreeEmployees;

  // Render skeleton when auth or initial stats are loading
  if (authLoading && !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A365D" />
          <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1A365D']}
            tintColor="#1A365D"
          />
        }
      >
        {/* Error retry banner */}
        {statsError && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="info-outline" size={16} color="#B91C1C" />
            <Text style={styles.errorBannerText}>{statsError}</Text>
            <TouchableOpacity
              onPress={fetchCompanyStats}
              style={styles.retryBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================================================== */}
        {/* 1. COMPACT PROFILE HEADER (RESPONSIVE 320PX-430PX) */}
        {/* ================================================== */}
        <View style={styles.profileHeaderCard}>
          {/* Row 1: Avatar + User Info + Edit Action */}
          <View style={styles.headerTopRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.headerMeta}>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {user?.name || 'Administrator'}
              </Text>
              <Text style={styles.userHandle} numberOfLines={1}>
                @{user?.username || 'admin'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.editProfilePill}
              onPress={() => setIsEditProfileVisible(true)}
              activeOpacity={0.8}
              accessibilityLabel="Edit Profile"
            >
              <MaterialIcons name="edit" size={13} color="#1A365D" />
              <Text style={styles.editProfilePillText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Clean Meta Badges Strip */}
          <View style={styles.headerBadgeRow}>
            <View style={styles.roleBadge}>
              <MaterialIcons name="shield" size={11} color="#1A365D" />
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>

            <View style={styles.companyBadge}>
              <MaterialIcons name="business" size={11} color="#64748B" />
              <Text style={styles.companyTag}>WorkAxis</Text>
            </View>

            <View style={styles.statusPillSmall}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillSmallText}>Active</Text>
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* 2. ACCOUNT INFORMATION */}
        {/* ================================================== */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="person-outline" size={16} color="#1A365D" />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>

          <View style={styles.cardBox}>
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Full Name</Text>
                <Text style={styles.rowValue}>{user?.name || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Username</Text>
                <Text style={styles.rowValue}>@{user?.username || 'user'}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{user?.email || 'N/A'}</Text>
              </View>
            </View>

            {user?.phone ? (
              <>
                <View style={styles.cardDivider} />
                <View style={styles.rowItem}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowLabel}>Phone</Text>
                    <Text style={styles.rowValue}>{user.phone}</Text>
                  </View>
                </View>
              </>
            ) : null}

            <View style={styles.cardDivider} />

            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Role</Text>
                <Text style={styles.rowValue}>{roleLabel}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Account Status</Text>
                <Text style={styles.rowValue}>Active</Text>
              </View>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusPillText}>Verified</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Admin ID</Text>
                <Text style={styles.rowValueMuted}>
                  ADM-{String(user?.id || 1).padStart(4, '0')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* 3. COMPANY INFORMATION */}
        {/* ================================================== */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="business" size={16} color="#1A365D" />
            <Text style={styles.sectionTitle}>Company</Text>
          </View>

          <View style={styles.cardBox}>
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Company Name</Text>
                <Text style={styles.rowValue}>WorkAxis Workforce</Text>
              </View>
              <Text style={styles.orgCodeBadge}>WA-IND-01</Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Active Workforce</Text>
                <Text style={styles.rowValue}>
                  {statsLoading ? '...' : `${companyStats.employeeCount} Employees`}
                </Text>
              </View>
              <View style={styles.countBadge}>
                <MaterialIcons name="people" size={13} color="#1A365D" />
                <Text style={styles.countBadgeText}>
                  {statsLoading ? '...' : companyStats.employeeCount}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowLabel}>Configured Teams</Text>
                <Text style={styles.rowValue}>
                  {statsLoading ? '...' : `${companyStats.teamCount} Teams`}
                </Text>
              </View>
              <View style={styles.countBadge}>
                <MaterialIcons name="groups" size={13} color="#1A365D" />
                <Text style={styles.countBadgeText}>
                  {statsLoading ? '...' : companyStats.teamCount}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* 4. SUBSCRIPTION */}
        {/* ================================================== */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="card-membership" size={16} color="#1A365D" />
            <Text style={styles.sectionTitle}>Subscription</Text>
          </View>

          <View style={styles.cardBox}>
            {/* Top row: Plan name on left, View plans on right */}
            <View style={styles.subTopRow}>
              <View style={styles.subTopLeft}>
                <Text style={styles.rowLabel}>Current Plan</Text>
                <View style={styles.planNameRow}>
                  <Text style={styles.planNameText}>FREE</Text>
                  <View
                    style={[
                      styles.subStatusBadge,
                      isLimitExceeded
                        ? styles.subStatusBadgeWarning
                        : styles.subStatusBadgeSuccess,
                    ]}
                  >
                    <Text
                      style={[
                        styles.subStatusBadgeText,
                        isLimitExceeded
                          ? styles.subStatusBadgeTextWarning
                          : styles.subStatusBadgeTextSuccess,
                      ]}
                    >
                      {isLimitExceeded ? 'Limit Exceeded' : 'Active Plan'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.viewPlansBtn}
                onPress={() => router.push('/(app)/admin/plans')}
                activeOpacity={0.7}
                accessibilityLabel="View Plans"
              >
                <Text style={styles.viewPlansBtnText}>View Plans</Text>
                <MaterialIcons name="arrow-forward" size={13} color="#1A365D" />
              </TouchableOpacity>
            </View>

            {/* Usage gauge */}
            <View style={styles.usageContainer}>
              <View style={styles.usageMetaRow}>
                <Text style={styles.usageLabel}>Employee Usage</Text>
                <Text style={styles.usageNumbers}>
                  {statsLoading
                    ? '...'
                    : `${companyStats.employeeCount} / ${maxFreeEmployees}`}
                </Text>
              </View>

              <View style={styles.usageBarTrack}>
                <View
                  style={[
                    styles.usageBarFill,
                    {
                      width: isLimitExceeded
                        ? '100%'
                        : `${Math.min(
                            100,
                            (companyStats.employeeCount / maxFreeEmployees) * 100
                          )}%`,
                      backgroundColor: isLimitExceeded ? '#EF4444' : '#1A365D',
                    },
                  ]}
                />
              </View>

              {isLimitExceeded && (
                <Text style={styles.usageWarningText}>
                  Workforce exceeds 20 employees. Upgrade to Starter or Business to
                  unlock expanded limits.
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* 5. SECURITY */}
        {/* ================================================== */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="lock-outline" size={16} color="#1A365D" />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>

          <View style={styles.cardBox}>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => setIsPasswordModalVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Change Password"
            >
              <View style={styles.navRowIconBox}>
                <MaterialIcons name="vpn-key" size={16} color="#1A365D" />
              </View>
              <View style={styles.navRowContent}>
                <Text style={styles.navRowTitle}>Change Password</Text>
                <Text style={styles.navRowDesc}>
                  Update your administrator account password
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            <View style={styles.navRow}>
              <View style={styles.navRowIconBox}>
                <MaterialIcons name="devices" size={16} color="#1A365D" />
              </View>
              <View style={styles.navRowContent}>
                <Text style={styles.navRowTitle}>Active Sessions</Text>
                <Text style={styles.navRowDesc}>1 active device · Current session</Text>
              </View>
              <View style={styles.activeDotBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeDotText}>Active</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.navRow}>
              <View style={styles.navRowIconBox}>
                <MaterialIcons name="verified-user" size={16} color="#1A365D" />
              </View>
              <View style={styles.navRowContent}>
                <Text style={styles.navRowTitle}>Authentication</Text>
                <Text style={styles.navRowDesc}>
                  Encrypted JWT session verification
                </Text>
              </View>
              <MaterialIcons name="check" size={16} color="#10B981" />
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* 6. NOTIFICATIONS */}
        {/* ================================================== */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="notifications-none" size={16} color="#1A365D" />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.cardBox}>
            <View style={styles.toggleRow}>
              <View style={styles.navRowIconBox}>
                <MaterialIcons name="notifications-active" size={16} color="#1A365D" />
              </View>
              <View style={styles.toggleRowContent}>
                <Text style={styles.navRowTitle}>Push Notifications</Text>
                <Text style={styles.navRowDesc}>
                  Attendance check-in and leave request alerts
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                trackColor={{ false: '#E2E8F0', true: '#1A365D' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* ================================================== */}
        {/* 7. APP PREFERENCES */}
        {/* ================================================== */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="tune" size={16} color="#1A365D" />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>

          <View style={styles.cardBox}>
            {/* Theme Accent Swatches */}
            <View style={styles.preferenceItem}>
              <Text style={styles.rowLabel}>Theme Accent</Text>
              <View style={styles.colorSwatchesRow}>
                {THEME_COLORS.map((hex) => {
                  const isSelected = primaryColor === hex;
                  return (
                    <TouchableOpacity
                      key={hex}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: hex },
                        isSelected && styles.colorSwatchActive,
                      ]}
                      onPress={() => setPrimaryColor(hex)}
                      activeOpacity={0.8}
                      accessibilityLabel={`Theme color ${hex}`}
                    >
                      {isSelected && (
                        <MaterialIcons name="check" size={14} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Language Selection */}
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => setIsLanguageModalVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Select Language"
            >
              <View style={styles.navRowIconBox}>
                <MaterialIcons name="language" size={16} color="#1A365D" />
              </View>
              <View style={styles.navRowContent}>
                <Text style={styles.navRowTitle}>Language</Text>
                <Text style={styles.navRowDesc}>
                  {languages.find((l) => l.code === language)?.label || 'English'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ================================================== */}
        {/* 8. SUPPORT */}
        {/* ================================================== */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="help-outline" size={16} color="#1A365D" />
            <Text style={styles.sectionTitle}>Support</Text>
          </View>

          <View style={styles.cardBox}>
            <TouchableOpacity
              style={styles.navRow}
              onPress={() => setIsHelpModalVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Help Center"
            >
              <View style={styles.navRowIconBox}>
                <MaterialIcons name="menu-book" size={16} color="#1A365D" />
              </View>
              <View style={styles.navRowContent}>
                <Text style={styles.navRowTitle}>Help Center</Text>
                <Text style={styles.navRowDesc}>
                  User guide, attendance FAQs and manual
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.cardDivider} />

            <TouchableOpacity
              style={styles.navRow}
              onPress={() => setIsSupportModalVisible(true)}
              activeOpacity={0.7}
              accessibilityLabel="Contact Support"
            >
              <View style={styles.navRowIconBox}>
                <MaterialIcons name="headset-mic" size={16} color="#1A365D" />
              </View>
              <View style={styles.navRowContent}>
                <Text style={styles.navRowTitle}>Contact Support</Text>
                <Text style={styles.navRowDesc}>
                  Reach our dedicated workforce support team
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ================================================== */}
        {/* 9. ABOUT WORKAXIS */}
        {/* ================================================== */}
        <View style={styles.aboutFooter}>
          <Text style={styles.aboutBrand}>WorkAxis</Text>
          <Text style={styles.aboutSub}>Workforce Management · Enterprise Edition</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0 (Production Build)</Text>
        </View>

        {/* ================================================== */}
        {/* 10. LOG OUT BUTTON */}
        {/* ================================================== */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setIsLogoutModalVisible(true)}
            activeOpacity={0.8}
            disabled={isLoggingOut}
            accessibilityLabel="Log Out"
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <MaterialIcons name="logout" size={16} color="#DC2626" />
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ================================================== */}
      {/* MODALS */}
      {/* ================================================== */}

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditProfileVisible}
        user={user}
        onClose={() => setIsEditProfileVisible(false)}
        onSuccess={handleProfileUpdated}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={isPasswordModalVisible}
        onClose={() => setIsPasswordModalVisible(false)}
      />

      {/* Language Selection Modal */}
      <Modal
        visible={isLanguageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsLanguageModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
              <TouchableOpacity
                onPress={() => setIsLanguageModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {languages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.langOption,
                      isSelected && styles.langOptionSelected,
                    ]}
                    onPress={() => {
                      changeLanguage(lang.code);
                      setIsLanguageModalVisible(false);
                      toast.show(`Language changed to ${lang.label}`, 'info');
                    }}
                  >
                    <Text
                      style={[
                        styles.langOptionText,
                        isSelected && styles.langOptionTextSelected,
                      ]}
                    >
                      {lang.label}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={18} color="#1A365D" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* In-App Logout Confirmation Modal (No Browser Alert) */}
      <Modal
        visible={isLogoutModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsLogoutModalVisible(false)}
          />
          <View style={styles.logoutDialog}>
            <View style={styles.logoutIconBox}>
              <MaterialIcons name="power-settings-new" size={26} color="#DC2626" />
            </View>
            <Text style={styles.logoutDialogTitle}>Log out?</Text>
            <Text style={styles.logoutDialogDesc}>
              Are you sure you want to log out of WorkAxis? You will need to sign in
              again to access the administrator portal.
            </Text>

            <View style={styles.logoutActionsRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setIsLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.dialogCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dialogConfirmBtn}
                onPress={handleConfirmLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.dialogConfirmBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help Center Info Modal */}
      <Modal
        visible={isHelpModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsHelpModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>WorkAxis Help Center</Text>
              <TouchableOpacity onPress={() => setIsHelpModalVisible(false)}>
                <MaterialIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.infoModalBody}>
              <View style={styles.helpCard}>
                <Text style={styles.helpTopicTitle}>Clock-in & Attendance</Text>
                <Text style={styles.helpTopicBody}>
                  Employees record daily check-in and check-out via the Attendance
                  tab. Administrators can monitor real-time headcount and history.
                </Text>
              </View>
              <View style={styles.helpCard}>
                <Text style={styles.helpTopicTitle}>Team Management</Text>
                <Text style={styles.helpTopicBody}>
                  Organize your workforce by assigning employees into specialized
                  teams with designated Team Leads.
                </Text>
              </View>
              <View style={styles.helpCard}>
                <Text style={styles.helpTopicTitle}>Subscription Plans</Text>
                <Text style={styles.helpTopicBody}>
                  WorkAxis supports tiers from Free (up to 20 members) to Growth
                  (up to 250 members). Manage tiers directly in Subscription.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Contact Support Modal */}
      <Modal
        visible={isSupportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSupportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsSupportModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact WorkAxis Support</Text>
              <TouchableOpacity onPress={() => setIsSupportModalVisible(false)}>
                <MaterialIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.infoModalBody}>
              <View style={styles.contactRow}>
                <MaterialIcons name="email" size={18} color="#1A365D" />
                <View style={styles.contactMeta}>
                  <Text style={styles.contactLabel}>Technical Support</Text>
                  <Text style={styles.contactVal}>support@workaxis.com</Text>
                </View>
              </View>
              <View style={styles.contactRow}>
                <MaterialIcons name="schedule" size={18} color="#1A365D" />
                <View style={styles.contactMeta}>
                  <Text style={styles.contactLabel}>Operational Hours</Text>
                  <Text style={styles.contactVal}>Mon – Fri: 09:00 AM – 06:00 PM IST</Text>
                </View>
              </View>
              <View style={styles.contactRow}>
                <MaterialIcons name="verified" size={18} color="#10B981" />
                <View style={styles.contactMeta}>
                  <Text style={styles.contactLabel}>SLA Guarantee</Text>
                  <Text style={styles.contactVal}>Within 24 business hours</Text>
                </View>
              </View>
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
  container: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 110, // Generous clearance for bottom navigation tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 6,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '500',
  },
  retryBtn: {
    backgroundColor: '#B91C1C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Profile Header (Multi-row design for 320px–430px) */
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1A365D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerMeta: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
  },
  userHandle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  editProfilePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A365D',
  },

  /* Row 2 badges */
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A365D',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  companyTag: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  statusPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusPillSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },

  /* Section Layout */
  sectionBlock: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },

  /* Account Rows */
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowLeft: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowValueMuted: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  orgCodeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A365D',
  },

  /* Subscription Block */
  subTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  subTopLeft: {
    flex: 1,
    marginRight: 6,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  planNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  subStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subStatusBadgeSuccess: {
    backgroundColor: '#ECFDF5',
  },
  subStatusBadgeWarning: {
    backgroundColor: '#FEF2F2',
  },
  subStatusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  subStatusBadgeTextSuccess: {
    color: '#047857',
  },
  subStatusBadgeTextWarning: {
    color: '#B91C1C',
  },
  viewPlansBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  viewPlansBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A365D',
  },
  usageContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  usageMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  usageLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  usageNumbers: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  usageBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  usageWarningText: {
    fontSize: 10,
    color: '#B91C1C',
    fontWeight: '500',
    marginTop: 5,
    lineHeight: 14,
  },

  /* Action Navigation Rows (Consistent 50-54px) */
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 50,
  },
  navRowIconBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  navRowContent: {
    flex: 1,
    marginRight: 6,
  },
  navRowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  navRowDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  activeDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },

  /* Notification toggle */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleRowContent: {
    flex: 1,
    marginRight: 8,
  },

  /* Preferences */
  preferenceItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 7,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchActive: {
    borderWidth: 2,
    borderColor: '#0F172A',
  },

  /* About Footer */
  aboutFooter: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  aboutBrand: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  aboutSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  aboutVersion: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },

  /* Logout button */
  logoutContainer: {
    marginTop: 8,
    marginBottom: 6,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    height: 44,
    borderRadius: 8,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* Modal Sheets */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    paddingVertical: 8,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  langOptionSelected: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
  },
  langOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  langOptionTextSelected: {
    fontWeight: '700',
    color: '#1A365D',
  },

  /* Logout Confirmation Modal */
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoutDialog: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  logoutIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutDialogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 5,
  },
  logoutDialogDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  logoutActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  dialogCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dialogCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  dialogConfirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogConfirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Help & Support Dialogs */
  infoModalBody: {
    paddingVertical: 10,
  },
  helpCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpTopicTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A365D',
    marginBottom: 3,
  },
  helpTopicBody: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 15,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactMeta: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contactVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 1,
  },
});
