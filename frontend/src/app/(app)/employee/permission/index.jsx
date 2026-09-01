import React from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useMyPermissions } from '../../../../hooks/usePermission';
import { PermissionCard } from '../../../../components/permission/PermissionCard';
import { Button } from '../../../../components/ui/Button';
import { Loading } from '../../../../components/ui/Loading';
import { colors } from '../../../../styles/colors';
import { spacing } from '../../../../styles/spacing';
import { typography } from '../../../../styles/typography';
import { MaterialIcons } from '@expo/vector-icons';

export default function PermissionsIndex() {
  const router = useRouter();
  const { data: response, isLoading, refetch, isRefetching } = useMyPermissions();

  const handleRequestPress = () => {
    router.push('/(app)/employee/permission/request');
  };

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="schedule" size={48} color={colors.border} />
      <Text style={styles.emptyText}>You have no permission requests.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button 
          title="Request Permission" 
          onPress={handleRequestPress} 
          icon="add"
        />
      </View>
      
      {isLoading && !isRefetching ? (
        <Loading message="Loading permissions..." />
      ) : (
        <FlatList
          data={response?.data || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PermissionCard permission={item} />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={ListEmptyComponent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
