import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';
import { typography } from '../../styles/typography';
import { notificationApi } from '../../services/notification.api';

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications();
      if (response.success) {
        const todayStr = new Date().toLocaleDateString();
        const filtered = response.data.filter(n => new Date(n.createdAt).toLocaleDateString() === todayStr);
        setNotifications(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => !item.isRead && handleMarkAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity 
        style={styles.bellContainer} 
        onPress={() => setIsModalVisible(true)}
      >
        <MaterialIcons name="notifications" size={24} color={colors.surface} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllBtn}>
                  <Text style={styles.markAllText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-none" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No notifications right now</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={item => item.id}
              renderItem={renderNotification}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  markAllText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  listContainer: {
    padding: spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unreadCard: {
    backgroundColor: '#F0F7FF', // Slight blue tint for unread
    borderColor: colors.primary + '30',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing.md,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
  },
});
