import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  RefreshControl,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { notificationApi } from '../../services/notification.api';
import { employeeApi } from '../../services/employee.api';
import { useToast } from './Toast';

const READ_STORAGE_KEY = 'workaxis_read_notification_ids';
const DISMISSED_STORAGE_KEY = 'workaxis_dismissed_notification_ids';

// Helpers to persist read & dismissed notification IDs
const getStoredIds = async (key) => {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    }
  }
  return [];
};

const saveStoredIds = async (key, ids) => {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(ids));
  } catch (e) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(ids));
    }
  }
};

/**
 * Swipeable Notification Card
 * Swipe left completely dismisses and removes the notification!
 */
function SwipeableNotificationCard({
  item,
  onPress,
  onDismiss,
  formatTime,
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [swipedOpen, setSwipedOpen] = useState(false);

  const isPending = item.isApproval;

  // PanResponder for smooth left-swipe dismissal gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 8;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          pan.setValue({ x: Math.max(gestureState.dx, -130), y: 0 });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped far left (more than 70px), auto-dismiss completely!
        if (gestureState.dx < -70) {
          handleDismissAnimation();
        } else if (gestureState.dx < -40) {
          // Snap open to reveal Dismiss button
          Animated.spring(pan, {
            toValue: { x: -85, y: 0 },
            useNativeDriver: Platform.OS !== 'web',
            bounciness: 4,
          }).start();
          setSwipedOpen(true);
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: Platform.OS !== 'web',
          }).start();
          setSwipedOpen(false);
        }
      },
    })
  ).current;

  // Animate slide completely off screen and dismiss
  const handleDismissAnimation = () => {
    Animated.timing(pan, {
      toValue: { x: -450, y: 0 },
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      onDismiss(item.id);
    });
  };

  const resetSwipe = () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: Platform.OS !== 'web',
    }).start();
    setSwipedOpen(false);
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Hidden Dismiss Action Behind Card */}
      <View style={styles.behindActionWrap}>
        <TouchableOpacity
          style={styles.behindDismissBtn}
          onPress={handleDismissAnimation}
          activeOpacity={0.85}
          accessibilityLabel="Dismiss notification"
        >
          <MaterialIcons name="delete-outline" size={20} color="#FFFFFF" />
          <Text style={styles.behindDismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground Card */}
      <Animated.View
        style={[
          styles.cardFront,
          {
            transform: [{ translateX: pan.x }],
          },
          !item.isRead && styles.unreadCard,
          isPending && styles.approvalCard,
        ]}
        {...panResponder.panHandlers}
      >
        {/* Left accent bar for unread notifications */}
        {!item.isRead && (
          <View
            style={[
              styles.leftAccentBar,
              { backgroundColor: isPending ? '#D97706' : '#1A365D' },
            ]}
          />
        )}

        <TouchableOpacity
          style={styles.cardInnerTouch}
          activeOpacity={0.85}
          onPress={() => {
            if (swipedOpen) {
              resetSwipe();
            } else {
              onPress(item);
            }
          }}
        >
          {/* Top Row: Category Badge + Timestamp + Quick Dismiss Button */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.headerLeftGroup}>
              <View
                style={[
                  styles.categoryPill,
                  isPending
                    ? styles.categoryPillApproval
                    : styles.categoryPillSystem,
                ]}
              >
                <MaterialIcons
                  name={isPending ? 'person-add' : 'notifications'}
                  size={11}
                  color={isPending ? '#B45309' : '#1A365D'}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    isPending
                      ? styles.categoryPillTextApproval
                      : styles.categoryPillTextSystem,
                  ]}
                >
                  {isPending ? 'NEW JOIN REQUEST' : 'NOTIFICATION'}
                </Text>
              </View>

              <Text style={styles.notificationTime}>
                {formatTime(item.createdAt)}
              </Text>
            </View>

            {/* Quick Dismiss Button */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDismissAnimation();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.quickDismissBtn}
              accessibilityLabel="Dismiss notification"
            >
              <MaterialIcons name="close" size={13} color="#64748B" />
              <Text style={styles.dismissBtnLabel}>Dismiss</Text>
            </TouchableOpacity>
          </View>

          {/* Body: Title & Context Message */}
          <View style={styles.bodyRow}>
            <View
              style={[
                styles.iconWrap,
                isPending ? styles.iconWrapApproval : styles.iconWrapSystem,
              ]}
            >
              <MaterialIcons
                name={isPending ? 'person-add-alt-1' : 'info-outline'}
                size={18}
                color={isPending ? '#B45309' : '#1A365D'}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.notificationTitle}>
                {isPending ? 'New Employee Join Request' : item.title}
              </Text>
              <Text style={styles.notificationMessage}>
                {isPending ? (
                  <>
                    <Text style={styles.empHighlightText}>
                      {item.employeeName}
                    </Text>{' '}
                    has requested to join{' '}
                    <Text style={styles.teamHighlightText}>
                      ({item.teamName})
                    </Text>
                  </>
                ) : (
                  item.message
                )}
              </Text>
            </View>
          </View>

          {/* Action Footer for Join Requests */}
          {isPending ? (
            <View style={styles.requestFooterRow}>
              <View style={styles.pendingStatusBadge}>
                <View style={styles.pendingStatusDot} />
                <Text style={styles.pendingStatusText}>
                  Join Request Pending
                </Text>
              </View>

              <View style={styles.reviewLinkRow}>
                <Text style={styles.reviewLinkText}>Review & Approve</Text>
                <MaterialIcons name="arrow-forward" size={12} color="#1A365D" />
              </View>
            </View>
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export function NotificationBell() {
  const router = useRouter();
  const toast = useToast();

  const [notifications, setNotifications] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'requests' | 'unread'

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, empRes, readIds, dismissedIds] = await Promise.all([
        notificationApi.getNotifications().catch(() => ({ success: false, data: [] })),
        employeeApi.getEmployees().catch(() => ({ success: false, data: [] })),
        getStoredIds(READ_STORAGE_KEY),
        getStoredIds(DISMISSED_STORAGE_KEY),
      ]);

      let items = [];
      if (notifRes?.success && Array.isArray(notifRes.data)) {
        items = notifRes.data
          .filter((b) => !dismissedIds.includes(b.id))
          .map((b) => ({
            ...b,
            isRead: b.isRead || readIds.includes(b.id),
          }));
      }

      // Add pending employee join requests (excluding dismissed ones)
      const emps = empRes?.data || (Array.isArray(empRes) ? empRes : []);
      if (emps.length > 0) {
        const pendingEmps = emps.filter(
          (e) =>
            e.approvalStatus === 'PENDING' ||
            e.approvalStatus === 'REMOVAL PENDING'
        );
        pendingEmps.forEach((pe) => {
          const notifId = `pending-${pe.id}`;
          // If dismissed, DO NOT SHOW IT!
          if (dismissedIds.includes(notifId)) return;

          const name = pe.user?.name || pe.name || 'Employee';
          const teamName = pe.team?.name || 'Unassigned';
          items.unshift({
            id: notifId,
            employeeId: pe.id,
            employeeName: name,
            teamName: teamName,
            title: 'New Employee Join Request',
            message: `${name} has requested to join (${teamName})`,
            createdAt: pe.updatedAt || pe.createdAt || new Date().toISOString(),
            isRead: readIds.includes(notifId),
            isApproval: true,
            status: pe.approvalStatus,
          });
        });
      }

      setNotifications(items);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  // Dismiss a notification: Remove from list & never show it again
  const handleDismissNotification = async (id) => {
    try {
      const currentDismissed = await getStoredIds(DISMISSED_STORAGE_KEY);
      const updatedDismissed = Array.from(new Set([...currentDismissed, id]));
      await saveStoredIds(DISMISSED_STORAGE_KEY, updatedDismissed);

      // Also persist read
      const currentRead = await getStoredIds(READ_STORAGE_KEY);
      await saveStoredIds(
        READ_STORAGE_KEY,
        Array.from(new Set([...currentRead, id]))
      );

      if (!id.startsWith('pending-')) {
        await notificationApi.markAsRead(id).catch(() => {});
      }

      // Immediately remove from UI list so it's not shown!
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.show('Notification dismissed', 'info');
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  // Dismiss all notifications: Clear entire list
  const handleDismissAll = async () => {
    try {
      const allIds = notifications.map((n) => n.id);
      const currentDismissed = await getStoredIds(DISMISSED_STORAGE_KEY);
      const updatedDismissed = Array.from(
        new Set([...currentDismissed, ...allIds])
      );
      await saveStoredIds(DISMISSED_STORAGE_KEY, updatedDismissed);

      const currentRead = await getStoredIds(READ_STORAGE_KEY);
      await saveStoredIds(
        READ_STORAGE_KEY,
        Array.from(new Set([...currentRead, ...allIds]))
      );

      await notificationApi.markAllAsRead().catch(() => {});

      setNotifications([]);
      toast.show('All notifications cleared', 'success');
    } catch (error) {
      console.error('Failed to dismiss all:', error);
    }
  };

  // Tap notification card -> Mark as read and navigate directly to Approval page
  const handleNotificationPress = async (item) => {
    // Mark as read in storage
    const currentRead = await getStoredIds(READ_STORAGE_KEY);
    await saveStoredIds(
      READ_STORAGE_KEY,
      Array.from(new Set([...currentRead, item.id]))
    );

    if (item.isApproval) {
      setIsModalVisible(false);
      // Navigate directly to Employees Pending Approval page
      router.push({
        pathname: '/(app)/admin/employees',
        params: { filter: 'PENDING' },
      });
    }
  };

  const formatNotificationTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Live counts
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const requestCount = notifications.filter((n) => n.isApproval).length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'requests') return item.isApproval;
    if (activeTab === 'unread') return !item.isRead;
    return true;
  });

  return (
    <>
      {/* Top Bar Bell Icon: Badge ONLY displays when unreadCount > 0 */}
      <TouchableOpacity
        style={styles.bellContainer}
        onPress={() => {
          setIsModalVisible(true);
          fetchNotifications();
        }}
        accessibilityLabel="Notifications"
      >
        <MaterialIcons name="notifications-none" size={22} color="#1A365D" />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Notifications Modal Screen */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header Bar */}
          <View style={styles.modalHeader}>
            <View style={styles.titleWrap}>
              <Text style={styles.modalTitle}>Notifications</Text>
              {unreadCount > 0 ? (
                <View style={styles.headerCountPill}>
                  <Text style={styles.headerCountText}>{unreadCount} New</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.closeCircleBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close Notifications"
            >
              <MaterialIcons name="close" size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Filter Bar & Quick Dismiss All */}
          <View style={styles.filterBar}>
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[
                  styles.tabPill,
                  activeTab === 'all' && styles.tabPillActive,
                ]}
                onPress={() => setActiveTab('all')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    activeTab === 'all' && styles.tabPillTextActive,
                  ]}
                >
                  All ({notifications.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabPill,
                  activeTab === 'requests' && styles.tabPillActive,
                ]}
                onPress={() => setActiveTab('requests')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    activeTab === 'requests' && styles.tabPillTextActive,
                  ]}
                >
                  Requests ({requestCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabPill,
                  activeTab === 'unread' && styles.tabPillActive,
                ]}
                onPress={() => setActiveTab('unread')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    activeTab === 'unread' && styles.tabPillTextActive,
                  ]}
                >
                  Unread ({unreadCount})
                </Text>
              </TouchableOpacity>
            </View>

            {notifications.length > 0 && (
              <TouchableOpacity
                onPress={handleDismissAll}
                style={styles.dismissAllBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="clear-all" size={14} color="#DC2626" />
                <Text style={styles.dismissAllText}>Dismiss all</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Helper hint for swipe dismissal */}
          {filteredNotifications.length > 0 && (
            <View style={styles.hintBar}>
              <MaterialIcons name="swipe" size={13} color="#94A3B8" />
              <Text style={styles.hintText}>
                Swipe left to dismiss · Tap to review in Approvals
              </Text>
            </View>
          )}

          {/* Notification List */}
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons name="done-all" size={32} color="#10B981" />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'requests'
                  ? 'No pending employee join requests require attention.'
                  : activeTab === 'unread'
                  ? 'No unread notifications at this time.'
                  : 'No notifications right now. You will be alerted for new join requests.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredNotifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <SwipeableNotificationCard
                  item={item}
                  onPress={handleNotificationPress}
                  onDismiss={handleDismissNotification}
                  formatTime={formatNotificationTime}
                />
              )}
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
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    padding: 6,
    marginRight: 6,
    position: 'relative',
    borderRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  /* Modal Screen */
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerCountPill: {
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  headerCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A365D',
  },
  closeCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Filter Bar */
  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tabPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  tabPillActive: {
    backgroundColor: '#1A365D',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dismissAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  dismissAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* List Container */
  listContainer: {
    padding: 12,
    paddingBottom: 40,
  },

  /* Swipe Container & Behind Action */
  swipeContainer: {
    marginBottom: 10,
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  behindActionWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 85,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  behindDismissBtn: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  behindDismissText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Foreground Card */
  cardFront: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 2,
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  approvalCard: {
    borderColor: '#FDE68A',
  },
  leftAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 3,
  },
  cardInnerTouch: {
    padding: 12,
    paddingLeft: 14,
  },

  /* Card Header */
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryPillApproval: {
    backgroundColor: '#FEF3C7',
  },
  categoryPillSystem: {
    backgroundColor: '#F1F5F9',
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  categoryPillTextApproval: {
    color: '#B45309',
  },
  categoryPillTextSystem: {
    color: '#1A365D',
  },
  notificationTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  quickDismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  dismissBtnLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Card Body */
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  iconWrapApproval: {
    backgroundColor: '#FEF3C7',
  },
  iconWrapSystem: {
    backgroundColor: '#F1F5F9',
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  empHighlightText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  teamHighlightText: {
    color: '#1A365D',
    fontWeight: '600',
  },

  /* Action Footer for Join Requests */
  requestFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pendingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  pendingStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  reviewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A365D',
  },

  /* Empty State */
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
