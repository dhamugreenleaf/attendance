import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, SafeAreaView } from 'react-native';
import { employeeApi } from '../../../services/employee.api';
import { Card } from '../../../components/ui/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';
import { spacing, radius } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await employeeApi.getEmployees();
      setEmployees(res.data || []);
    } catch (error) {
      console.error('Failed to load employees', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.designation?.toLowerCase().includes(search.toLowerCase()) ||
    emp.email?.toLowerCase().includes(search.toLowerCase())
  );

  const renderEmployee = ({ item }) => {
    const initials = item.name 
      ? item.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
      : 'U';
      
    return (
      <Card style={styles.employeeCard}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.designation}>{item.designation || 'Employee'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACTIVE' ? colors.successLight : colors.errorLight }]}>
            <Text style={[styles.statusText, { color: item.status === 'ACTIVE' ? colors.success : colors.error }]}>
              {item.status || 'ACTIVE'}
            </Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailsRow}>
          <MaterialIcons name="email" size={16} color={colors.textMuted} />
          <Text style={styles.detailText}>{item.email}</Text>
        </View>
        
        <View style={styles.detailsRow}>
          <MaterialIcons name="phone" size={16} color={colors.textMuted} />
          <Text style={styles.detailText}>{item.phone || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailsRow}>
          <MaterialIcons name="groups" size={16} color={colors.textMuted} />
          <Text style={styles.detailText}>Team: {item.team?.name || 'Unassigned'}</Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Directory</Text>
        <Text style={styles.subtitle}>{employees.length} Employees</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, role or email..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={filteredEmployees}
          keyExtractor={item => item.id.toString()}
          renderItem={renderEmployee}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No employees found matching your search.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    height: 52,
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
    height: '100%',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  employeeCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.surface,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  designation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: spacing.xl,
    fontSize: typography.fontSize.md,
  }
});
