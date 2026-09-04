import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { radius, spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

const ToastContext = createContext(null);

const TOAST_TYPES = {
  success: { icon: 'check-circle', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
  error:   { icon: 'error',        color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  info:    { icon: 'info',         color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  warning: { icon: 'warning',      color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
};

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timerRef = useRef(null);

  const show = useCallback((message, type = 'success', duration = 3000) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({ message, type });

    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, duration);
  }, []);

  const def = toast ? (TOAST_TYPES[toast.type] || TOAST_TYPES.success) : null;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && def && (
        <Animated.View
          style={[
            styles.toast,
            { opacity, transform: [{ translateY }], backgroundColor: def.bg, borderColor: def.border }
          ]}
          pointerEvents="none"
        >
          <MaterialIcons name={def.icon} size={20} color={def.color} style={{ marginRight: spacing.sm }} />
          <Text style={[styles.toastText, { color: def.color }]} numberOfLines={2}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 48,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    zIndex: 9999,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
    }),
  },
  toastText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    lineHeight: 18,
  },
});
