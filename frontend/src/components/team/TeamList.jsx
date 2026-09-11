import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TeamCard } from './TeamCard';
import { colors } from '../../styles/colors';
import { spacing, radius } from '../../styles/spacing';
import { typography } from '../../styles/typography';

// Skeleton Loader Component
const TeamCardSkeleton = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonHeaderRow}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonBadge} />
    </View>
    <View style={styles.skeletonMetaRow}>
      <View style={styles.skeletonMeta} />
      <View style={styles.skeletonMetaSmall} />
    </View>
    <View style={styles.skeletonCount} />
  </View>
);

export const TeamList = ({
  teams = [],
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onTeamPress,
  onMenuPress,
  onCreatePress,
  userRole = 'ADMIN',
}) => {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [selectedDeptFilter, setSelectedDeptFilter] = useState(null);

  const isAdmin = userRole === 'ADMIN' || userRole === 'HR';
  const isTL = userRole === 'TL' || userRole === 'TEAM_LEAD';

  // Extract unique departments from teams
  const availableDepartments = useMemo(() => {
    const depts = new Set();
    teams.forEach((t) => {
      if (t.department?.name) {
        depts.add(t.department.name);
      }
    });
    return Array.from(depts);
  }, [teams]);

  // Filter teams by search, status, and department
  const filteredTeams = useMemo(() => {
    let list = Array.isArray(teams) ? [...teams] : [];

    // Filter by status tab
    if (selectedFilter === 'ACTIVE') {
      list = list.filter((t) => t.status === 'ACTIVE');
    } else if (selectedFilter === 'INACTIVE') {
      list = list.filter((t) => t.status === 'INACTIVE');
    }

    // Filter by department if selected
    if (selectedDeptFilter) {
      list = list.filter((t) => t.department?.name === selectedDeptFilter);
    }

    // Filter by search query (team name, manager/head, department)
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        const matchName = (t.name || '').toLowerCase().includes(q);
        const matchHead = (t.manager?.name || '').toLowerCase().includes(q);
        const matchDept = (t.department?.name || '').toLowerCase().includes(q);
        return matchName || matchHead || matchDept;
      });
    }

    return list;
  }, [teams, search, selectedFilter, selectedDeptFilter]);

  const totalCount = teams.length;

  const renderEmptyComponent = () => {
    if (isLoading) return null;

    if (search.trim() || selectedFilter !== 'ALL' || selectedDeptFilter) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={48} color={colors.border} />
          <Text style={styles.emptyTitle}>No teams found.</Text>
          <Text style={styles.emptySubtitle}>
            Try another team name, department or team head.
          </Text>
          <TouchableOpacity
            style={styles.clearSearchBtn}
            onPress={() => {
              setSearch('');
              setSelectedFilter('ALL');
              setSelectedDeptFilter(null);
            }}
          >
            <Text style={styles.clearSearchBtnText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isTL) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="groups" size={54} color={colors.border} />
          <Text style={styles.emptyTitle}>No team assigned yet.</Text>
          <Text style={styles.emptySubtitle}>
            Your assigned team will appear here once an Admin assigns you.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="groups" size={54} color={colors.border} />
        <Text style={styles.emptyTitle}>No teams created yet.</Text>
        <Text style={styles.emptySubtitle}>
          Create your first team to start managing employees and attendance.
        </Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.emptyCreateBtn}
            onPress={onCreatePress}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.emptyCreateBtnText}>Create New Team</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Header with Title and Real Count */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitles}>
          <Text style={styles.screenHeading}>
            {isTL ? 'My Team' : 'Teams'}
          </Text>
          <Text style={styles.screenSubheading}>
            {isTL ? 'Your assigned workforce team' : 'Manage your company teams'}
          </Text>
        </View>

        {!isTL && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {totalCount} {totalCount === 1 ? 'Team' : 'Teams'}
            </Text>
          </View>
        )}
      </View>

      {/* 2. Create New Team CTA (Only shown for Admin / HR) */}
      {isAdmin && (
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.85}
            onPress={onCreatePress}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" style={styles.createIcon} />
            <Text style={styles.createButtonText}>Create New Team</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teams by name, head, or department..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="cancel" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. Compact Filters (All, Active, Inactive, Departments) */}
      {!isTL && (
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'ALL' && styles.filterChipSelected]}
              activeOpacity={0.7}
              onPress={() => setSelectedFilter('ALL')}
            >
              <Text style={[styles.filterText, selectedFilter === 'ALL' && styles.filterTextSelected]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'ACTIVE' && styles.filterChipSelected]}
              activeOpacity={0.7}
              onPress={() => setSelectedFilter('ACTIVE')}
            >
              <Text style={[styles.filterText, selectedFilter === 'ACTIVE' && styles.filterTextSelected]}>
                Active
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'INACTIVE' && styles.filterChipSelected]}
              activeOpacity={0.7}
              onPress={() => setSelectedFilter('INACTIVE')}
            >
              <Text style={[styles.filterText, selectedFilter === 'INACTIVE' && styles.filterTextSelected]}>
                Inactive
              </Text>
            </TouchableOpacity>

            {availableDepartments.map((dept) => {
              const isSelected = selectedDeptFilter === dept;
              return (
                <TouchableOpacity
                  key={dept}
                  style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedDeptFilter(isSelected ? null : dept)}
                >
                  <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>
                    {dept}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 5. Team List or Skeleton Loading */}
      {isLoading && !isRefreshing ? (
        <View style={styles.skeletonContainer}>
          <TeamCardSkeleton />
          <TeamCardSkeleton />
          <TeamCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={filteredTeams}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <TeamCard
              team={item}
              onPress={() => onTeamPress?.(item)}
              onMenuPress={() => onMenuPress?.(item)}
            />
          )}
          ListEmptyComponent={renderEmptyComponent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  headerTitles: {
    flex: 1,
  },
  screenHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  screenSubheading: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(26, 54, 93, 0.12)',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  ctaContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 46,
    borderRadius: radius.md,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(26, 54, 93, 0.25)',
      },
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  createIcon: {
    marginRight: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  filterSection: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextSelected: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
  clearSearchBtn: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  clearSearchBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  skeletonTitle: {
    width: '45%',
    height: 18,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 50,
    height: 18,
    backgroundColor: '#F1F5F9',
    borderRadius: 9,
  },
  skeletonMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  skeletonMeta: {
    width: '35%',
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
  },
  skeletonMetaSmall: {
    width: '30%',
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
  },
  skeletonCount: {
    width: '25%',
    height: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginTop: 4,
  },
});
