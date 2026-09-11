import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';
import { typography } from '../../styles/typography';

export const TeamActionMenu = ({
  visible,
  team,
  userRole,
  onClose,
  onViewTeam,
  onEditTeam,
  onManageEmployees,
  onChangeTeamHead,
  onToggleStatus,
  onDeleteTeam,
}) => {
  if (!team) return null;

  const isAdmin = userRole === 'ADMIN' || userRole === 'HR';
  const isActive = team.status === 'ACTIVE';

  const menuItems = [
    {
      id: 'view',
      title: 'View Team',
      icon: 'visibility',
      color: colors.textPrimary,
      show: true,
      onPress: () => {
        onClose();
        onViewTeam?.(team);
      },
    },
    {
      id: 'edit',
      title: 'Edit Team',
      icon: 'edit',
      color: colors.textPrimary,
      show: isAdmin,
      onPress: () => {
        onClose();
        onEditTeam?.(team);
      },
    },
    {
      id: 'manage_employees',
      title: 'Manage Employees',
      icon: 'group-add',
      color: colors.textPrimary,
      show: isAdmin,
      onPress: () => {
        onClose();
        onManageEmployees?.(team);
      },
    },
    {
      id: 'change_head',
      title: 'Change Team Head',
      icon: 'swap-horiz',
      color: colors.textPrimary,
      show: isAdmin,
      onPress: () => {
        onClose();
        onChangeTeamHead?.(team);
      },
    },
    {
      id: 'toggle_status',
      title: isActive ? 'Deactivate Team' : 'Activate Team',
      icon: isActive ? 'block' : 'check-circle-outline',
      color: isActive ? '#D97706' : colors.success,
      show: isAdmin,
      onPress: () => {
        onClose();
        onToggleStatus?.(team);
      },
    },
    {
      id: 'delete',
      title: 'Delete Team',
      icon: 'delete-outline',
      color: colors.error,
      show: isAdmin,
      onPress: () => {
        onClose();
        onDeleteTeam?.(team);
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <SafeAreaView style={styles.sheetContainer}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Team title in action sheet */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="groups" size={20} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.teamName} numberOfLines={1}>
                {team.name}
              </Text>
              <Text style={styles.teamMeta} numberOfLines={1}>
                {team.department?.name || 'General'} · {team.employeeCount || 0} Employees
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Action options */}
          <View style={styles.menuList}>
            {menuItems
              .filter((item) => item.show)
              .map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  activeOpacity={0.6}
                  onPress={item.onPress}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}10` }]}>
                    <MaterialIcons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.menuItemText, { color: item.color }]}>
                    {item.title}
                  </Text>
                  <MaterialIcons name="chevron-right" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
          </View>

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? spacing.md : spacing.lg,
    ...Platform.select({
      web: {
        maxWidth: 480,
        alignSelf: 'center',
        width: '100%',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  teamMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  menuList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
  },
  cancelButton: {
    marginTop: spacing.xs,
    marginHorizontal: spacing.lg,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
  },
});
