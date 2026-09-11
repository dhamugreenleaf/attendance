import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';
import { typography } from '../../styles/typography';

export const SearchableSelectorModal = ({
  visible,
  title = 'Select Option',
  items = [], // Array of { id, title, subtitle, badge, extra }
  selectedValue,
  selectedValues = [],
  isMulti = false,
  onSelect,
  onClose,
  placeholder = 'Search...',
}) => {
  const [query, setQuery] = useState('');
  const [tempSelectedValues, setTempSelectedValues] = useState([]);

  // Sync temp values when opened in multi mode
  React.useEffect(() => {
    if (visible && isMulti) {
      setTempSelectedValues([...(selectedValues || [])]);
    }
  }, [visible, isMulti, selectedValues]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter((item) => {
      const matchTitle = (item.title || '').toLowerCase().includes(lower);
      const matchSubtitle = (item.subtitle || '').toLowerCase().includes(lower);
      const matchBadge = (item.badge || '').toLowerCase().includes(lower);
      return matchTitle || matchSubtitle || matchBadge;
    });
  }, [items, query]);

  const handleSingleSelect = (item) => {
    onSelect?.(item);
    onClose?.();
  };

  const handleMultiToggle = (itemId) => {
    setTempSelectedValues((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleMultiDone = () => {
    onSelect?.(tempSelectedValues);
    onClose?.();
  };

  const isItemSelected = (item) => {
    if (isMulti) {
      return tempSelectedValues.includes(item.id);
    }
    return selectedValue === item.id;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <SafeAreaView style={styles.sheetContainer}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
              {isMulti && (
                <Text style={styles.subtitle}>
                  {tempSelectedValues.length} Selected
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchBox}>
              <MaterialIcons
                name="search"
                size={20}
                color={colors.textMuted}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => setQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="cancel" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id.toString()}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const selected = isItemSelected(item);
              return (
                <TouchableOpacity
                  style={[styles.itemRow, selected && styles.itemRowSelected]}
                  activeOpacity={0.7}
                  onPress={() =>
                    isMulti ? handleMultiToggle(item.id) : handleSingleSelect(item)
                  }
                >
                  <View style={styles.itemInfo}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.itemTitle,
                          selected && styles.itemTitleSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {item.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{item.badge}</Text>
                        </View>
                      )}
                    </View>
                    {item.subtitle ? (
                      <Text style={styles.itemSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.checkboxCircle,
                      selected && styles.checkboxCircleSelected,
                    ]}
                  >
                    {selected && (
                      <MaterialIcons name="check" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="search-off" size={40} color={colors.border} />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            )}
          />

          {isMulti && (
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.doneButton}
                activeOpacity={0.8}
                onPress={handleMultiDone}
              >
                <Text style={styles.doneButtonText}>
                  Confirm Selection ({tempSelectedValues.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    maxHeight: '85%',
    minHeight: '45%',
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.12)',
        maxWidth: 520,
        alignSelf: 'center',
        width: '100%',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemRowSelected: {
    backgroundColor: 'rgba(26, 54, 93, 0.05)',
    borderColor: 'rgba(26, 54, 93, 0.15)',
  },
  itemInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  itemTitleSelected: {
    color: colors.primary,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  checkboxCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textMuted,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  doneButton: {
    backgroundColor: colors.primary,
    height: 46,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: typography.fontWeight.semibold,
  },
});
