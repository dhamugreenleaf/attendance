import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { spacing, radius, shadows } from '../../styles/spacing';

export const Card = ({ children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  }
});
