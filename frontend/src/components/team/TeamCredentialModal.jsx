import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Platform,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';
import { typography } from '../../styles/typography';

export const TeamCredentialModal = ({
  visible,
  credentials, // { username, password, teamName }
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!credentials) return null;

  const copyToClipboard = async (text, key) => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error('Clipboard copy failed:', e);
    }
  };

  const handleCopyAll = () => {
    const text = `WorkAxis Team Head Account\nTeam: ${credentials.teamName || 'Team'}\nUsername: ${credentials.username}\nTemporary Password: ${credentials.password}\n\nPlease log in to WorkAxis and change your temporary password on first login.`;
    copyToClipboard(text, 'all');
  };

  const handleShare = async () => {
    const message = `WorkAxis Team Head Account\n\nTeam: ${credentials.teamName || 'Team'}\nUsername: ${credentials.username}\nTemporary Password: ${credentials.password}\n\nPlease log in to WorkAxis and change your temporary password on first login.`;
    
    try {
      if (Platform.OS === 'web') {
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        if (typeof window !== 'undefined') {
          window.open(url, '_blank');
        }
      } else {
        await Share.share({
          title: 'WorkAxis Team Head Credentials',
          message: message,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerIconContainer}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="vpn-key" size={26} color={colors.primary} />
            </View>
          </View>

          <Text style={styles.title}>Team Head Account Created</Text>
          <Text style={styles.subtitle}>
            Credentials generated for team lead login.
          </Text>

          <View style={styles.banner}>
            <MaterialIcons name="security" size={16} color="#B45309" />
            <Text style={styles.bannerText}>TEMPORARY PASSWORD</Text>
          </View>

          <View style={styles.credBox}>
            {/* Username */}
            <View style={styles.credRow}>
              <View style={styles.credTextWrap}>
                <Text style={styles.credLabel}>Username</Text>
                <Text style={styles.credValue}>{credentials.username}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyBtn}
                activeOpacity={0.7}
                onPress={() => copyToClipboard(credentials.username, 'username')}
              >
                <MaterialIcons
                  name={copiedKey === 'username' ? 'check' : 'content-copy'}
                  size={16}
                  color={copiedKey === 'username' ? colors.success : colors.primary}
                />
                <Text
                  style={[
                    styles.copyBtnText,
                    copiedKey === 'username' && styles.copyBtnSuccess,
                  ]}
                >
                  {copiedKey === 'username' ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Password */}
            <View style={styles.credRow}>
              <View style={styles.credTextWrap}>
                <Text style={styles.credLabel}>Temporary Password</Text>
                <Text style={styles.credValueMonospace}>{credentials.password}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyBtn}
                activeOpacity={0.7}
                onPress={() => copyToClipboard(credentials.password, 'password')}
              >
                <MaterialIcons
                  name={copiedKey === 'password' ? 'check' : 'content-copy'}
                  size={16}
                  color={copiedKey === 'password' ? colors.success : colors.primary}
                />
                <Text
                  style={[
                    styles.copyBtnText,
                    copiedKey === 'password' && styles.copyBtnSuccess,
                  ]}
                >
                  {copiedKey === 'password' ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.warningNote}>
            Please securely share these credentials. The user must change their temporary password on first login.
          </Text>

          {/* Action buttons */}
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.copyAllBtn}
              activeOpacity={0.8}
              onPress={handleCopyAll}
            >
              <MaterialIcons
                name={copiedKey === 'all' ? 'check' : 'copy-all'}
                size={18}
                color={colors.primary}
              />
              <Text style={styles.copyAllBtnText}>
                {copiedKey === 'all' ? 'All Copied!' : 'Copy All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              activeOpacity={0.8}
              onPress={handleShare}
            >
              <MaterialIcons name="share" size={18} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.doneBtn}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerIconContainer: {
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  bannerText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: '#B45309',
    letterSpacing: 0.5,
  },
  credBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  credTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  credLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  credValue: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  credValueMonospace: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  copyBtnSuccess: {
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  warningNote: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  actionGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: spacing.md,
  },
  copyAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  copyAllBtnText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  doneBtn: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
});
