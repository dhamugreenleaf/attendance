import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TeamCard } from './TeamCard';
import { Loading } from '../ui/Loading';
import { colors } from '../../styles/colors';
import { spacing } from '../../styles/spacing';
import { typography } from '../../styles/typography';

export const TeamList = ({ teams, isLoading, onRefresh, isRefreshing, onTeamPress }) => {
  const [search, setSearch] = useState('');

  const filteredTeams = teams?.filter(team => 
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading && !isRefreshing) {
    return <Loading message="Loading teams..." />;
  }

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="groups" size={48} color={colors.border} />
      <Text style={styles.emptyText}>No teams found.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search teams..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <FlatList
        data={filteredTeams}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TeamCard team={item} onPress={() => onTeamPress?.(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={ListEmptyComponent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  }
});
