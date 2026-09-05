import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { authApi } from '../../../services/auth.api';

import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useToast } from '../../../components/ui/Toast';
import { ChangePasswordModal } from '../../../components/profile/ChangePasswordModal';
import { THEME_COLORS } from '../../../styles/colors';
import { useAppTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { colors } from '../../../styles/colors';
import { spacing, radius } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { primaryColor, setPrimaryColor, currentColors, theme } = useAppTheme();
  const { language, changeLanguage, languages, t } = useLanguage();
  const toast = useToast();
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [displayUsername, setDisplayUsername] = useState(user?.username || 'user');
  const [editUsername, setEditUsername] = useState(displayUsername);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleLogout = async () => {
    await logout();
  };

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : user?.email?.substring(0, 2).toUpperCase() || 'U';

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      toast.show(t('usernameCannotBeEmpty'), 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await authApi.updateProfile({ username: editUsername });
      if (response.success && response.data) {
        setDisplayUsername(response.data.username);
        updateUser(response.data);
        setIsEditModalVisible(false);
        toast.show(t('profileUpdatedSuccessfully'), 'success');
      } else {
        toast.show(response.message || t('failedToUpdateProfile'), 'error');
      }
    } catch (error) {
      toast.show(error.response?.data?.message || t('errorUpdatingProfile'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('myProfile')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header section (Avatar) */}
        <View style={styles.profileTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.bioSection}>
          <Text style={styles.name}>{user?.name || t('administrator')}</Text>
          <Text style={styles.role}>{user?.role || t('teamLead')}</Text>
        </View>

        {/* Account Details with Inline Edit Icons */}
        <View style={styles.accountDetailsCard}>
          <View style={styles.accountRow}>
            <View style={styles.accountRowLeft}>
              <Feather name="user" size={18} color={colors.textMuted} />
              <View style={styles.accountTextGroup}>
                <Text style={styles.accountLabel}>{t('username')}</Text>
                <Text style={styles.accountValue}>{displayUsername}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsEditModalVisible(true)} style={styles.editIconBtn}>
              <Feather name="edit-2" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.dividerLight} />
          
          <View style={styles.accountRow}>
            <View style={styles.accountRowLeft}>
              <Feather name="lock" size={18} color={colors.textMuted} />
              <View style={styles.accountTextGroup}>
                <Text style={styles.accountLabel}>{t('password')}</Text>
                <Text style={styles.accountValue}>••••••••</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsPasswordModalVisible(true)} style={styles.editIconBtn}>
              <Feather name="edit-2" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* App Appearance Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>{t('appAppearance')}</Text>
          
          <View style={styles.appearanceCard}>
            <Text style={styles.settingLabel}>{t('themeColor')}</Text>
            <View style={styles.colorSwatchesContainer}>
              {THEME_COLORS.map((colorHex) => (
                <TouchableOpacity 
                  key={colorHex} 
                  style={[
                    styles.colorSwatch, 
                    { backgroundColor: colorHex },
                    primaryColor === colorHex && styles.colorSwatchSelected
                  ]}
                  onPress={() => setPrimaryColor(colorHex)}
                >
                  {primaryColor === colorHex && (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dividerLight} />
            
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={() => setIsLanguageModalVisible(true)}
            >
              <View>
                <Text style={styles.settingLabel}>{t('language')}</Text>
                <Text style={styles.settingSubtext}>
                  {languages.find(l => l.code === language)?.label || 'English'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Settings List */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>{t('settingsPrivacy')}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingItemLeft}>
              <Feather name="file-text" size={20} color={colors.textPrimary} />
              <Text style={styles.settingItemText}>{t('termsAndConditions')}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingItemLeft}>
              <Feather name="shield" size={20} color={colors.textPrimary} />
              <Text style={styles.settingItemText}>{t('privacyPolicies')}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
            <View style={styles.settingItemLeft}>
              <Feather name="help-circle" size={20} color={colors.textPrimary} />
              <Text style={styles.settingItemText}>{t('helpCenter')}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { marginTop: spacing.md }]} onPress={handleLogout}>
            <View style={styles.settingItemLeft}>
              <Feather name="log-out" size={20} color={colors.error} />
              <Text style={[styles.settingItemText, { color: colors.error }]}>{t('logOut')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.modalCancel}>{t('cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('editProfile')}</Text>
              <TouchableOpacity onPress={handleSaveProfile} disabled={isSaving}>
                <Text style={[styles.modalSave, isSaving && { opacity: 0.5 }]}>
                  {isSaving ? t('saving') : t('done')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('username')}</Text>
                <TextInput 
                  style={styles.textInput}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder={t('username')}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
              {/* Additional fields can be added here */}
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal visible={isLanguageModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { minHeight: '40%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsLanguageModalVisible(false)}>
                <Text style={styles.modalCancel}>{t('cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView style={styles.modalBody}>
              {languages.map((lang) => (
                <TouchableOpacity 
                  key={lang.code}
                  style={styles.languageItem}
                  onPress={() => {
                    changeLanguage(lang.code);
                    setIsLanguageModalVisible(false);
                  }}
                >
                  <Text style={[styles.languageItemText, language === lang.code && { color: currentColors.primary, fontWeight: 'bold' }]}>
                    {lang.label}
                  </Text>
                  {language === lang.code && (
                    <MaterialIcons name="check" size={20} color={currentColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ChangePasswordModal 
        visible={isPasswordModalVisible} 
        onClose={() => setIsPasswordModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean white background like IG
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileTop: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.surface,
  },
  bioSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  accountDetailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  accountRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  accountTextGroup: {
    justifyContent: 'center',
  },
  accountLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  accountValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  editIconBtn: {
    padding: spacing.xs,
    backgroundColor: colors.primary + '15',
    borderRadius: radius.sm,
  },
  dividerLight: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
    marginLeft: 34,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.lg,
  },
  settingsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalSave: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalBody: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  textInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
    outlineStyle: 'none',
  },
  // Appearance and Language Styles
  appearanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  settingSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  colorSwatchesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  languageItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
});
