import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useAuth } from '../../../hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { MaterialIcons } from '@expo/vector-icons';
import { ChangePasswordModal } from '../../../components/profile/ChangePasswordModal';
import { THEME_COLORS, colors } from '../../../styles/colors';
import { useAppTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { spacing, radius } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { primaryColor, setPrimaryColor, currentColors, theme } = useAppTheme();
  const { language, changeLanguage, languages, t } = useLanguage();
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('myProfile')}</Text>
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{user?.name || t('administrator')}</Text>
              <Text style={styles.role}>{user?.role || 'Admin'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color={colors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('username')}</Text>
                <Text style={styles.infoValue}>{user?.username || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={20} color={colors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>{t('appAppearance')}</Text>
            
            <View style={styles.appearanceCard}>
              <Text style={styles.infoLabel}>{t('themeColor')}</Text>
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

              <View style={styles.divider} />
              
              <TouchableOpacity 
                style={styles.infoRow} 
                onPress={() => setIsLanguageModalVisible(true)}
              >
                <View>
                  <Text style={styles.infoLabel}>{t('language')}</Text>
                  <Text style={styles.infoValue}>
                    {languages.find(l => l.code === language)?.label || 'English'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Security</Text>
            <Button 
              title={t('changePassword')} 
              variant="outline" 
              icon="lock"
              onPress={() => setIsPasswordModalVisible(true)} 
              style={styles.changePasswordBtn}
            />
          </View>
        </Card>

        <View style={styles.actionsContainer}>
          <Button 
            title={t('logOut')} 
            variant="danger" 
            icon="logout"
            onPress={handleLogout} 
          />
        </View>
      </ScrollView>

      <ChangePasswordModal 
        visible={isPasswordModalVisible} 
        onClose={() => setIsPasswordModalVisible(false)} 
      />

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
            <View style={styles.modalBody}>
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
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  profileCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  avatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  role: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.lg,
  },
  infoSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: spacing.md,
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  actionsContainer: {
    marginTop: spacing.md,
  },
  appearanceCard: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  colorSwatchesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
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
  modalBody: {
    padding: spacing.lg,
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
