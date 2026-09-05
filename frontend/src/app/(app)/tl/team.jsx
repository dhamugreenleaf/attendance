import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TextInput, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { EmployeeRow } from '../../../components/ui/EmployeeRow';
import { EmployeeDetailsModal } from '../../../components/team/EmployeeDetailsModal';
import { employeeApi } from '../../../services/employee.api';
import { colors } from '../../../styles/colors';
import { spacing, radius } from '../../../styles/spacing';
import { typography } from '../../../styles/typography';

export default function MyTeam() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [teamName, setTeamName] = useState('My Team');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Infinite Scroll State
  const [displayedCount, setDisplayedCount] = useState(10);
  const itemsPerPage = 10;

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'create'

  useEffect(() => {
    loadTeam();
  }, []);

  useEffect(() => {
    let filtered = [...teamMembers];
    
    // Search
    if (searchQuery.trim() !== '') {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter(emp => {
        const empName = (emp.user?.name || emp.name || '').toLowerCase();
        const role = (emp.designation || '').toLowerCase();
        return empName.includes(lowerQ) || role.includes(lowerQ);
      });
    }

    // Sort by pending status first, then alphabetically by name
    filtered.sort((a, b) => {
      const aPending = a.approvalStatus === 'PENDING' ? 1 : 0;
      const bPending = b.approvalStatus === 'PENDING' ? 1 : 0;
      
      if (aPending !== bPending) {
        return bPending - aPending; // Pending goes to top
      }

      const nameA = (a.user?.name || a.name || '').toLowerCase();
      const nameB = (b.user?.name || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setFilteredMembers(filtered);
    setDisplayedCount(10); // Reset infinite scroll on search or sort change
  }, [searchQuery, teamMembers]);

  useEffect(() => {
    navigation.setOptions({ headerTitle: teamName, title: 'Team' });
  }, [teamName, navigation]);

  const loadTeam = async () => {
    try {
      setIsLoading(true);
      const res = await employeeApi.getEmployees();
      const employees = res.data || [];
      const myTeam = employees.filter(e => e.team?.managerId === user?.id || e.teamId === user?.teamId);
      
      if (myTeam.length > 0 && myTeam[0].team?.name) {
        setTeamName(myTeam[0].team.name);
      }
      
      setTeamMembers(myTeam);
    } catch (error) {
      console.error('Failed to load team data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmployeePress = (emp) => {
    setSelectedEmployee(emp);
    setModalMode('view');
    setModalVisible(true);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setModalMode('create');
    setModalVisible(true);
  };

  const loadMoreData = () => {
    if (displayedCount < filteredMembers.length) {
      setDisplayedCount(prev => prev + itemsPerPage);
    }
  };

  const displayedMembers = filteredMembers.slice(0, displayedCount);
  const isWideScreen = width > 768;

  const renderEmptyComponent = () => {
    if (isLoading) {
      return <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xxl }} />;
    }
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="people-outline" size={64} color={colors.border} />
        <Text style={styles.emptyText}>
          {searchQuery ? 'No employees match your search.' : 'No employees in this team.'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (isLoading) return null;
    if (displayedCount < filteredMembers.length) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.mainWrapper, isWideScreen && styles.mainWrapperWide]}>
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>Team Members</Text>
            <Text style={styles.headerSubtitle}>{filteredMembers.length} Members</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddEmployee}>
            <MaterialIcons name="person-add" size={16} color={colors.surface} />
            <Text style={styles.addButtonText}>Add Employee</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Search employees by name or role..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={displayedMembers}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <EmployeeRow 
              employee={item} 
              onPress={() => handleEmployeePress(item)}
              onMenuPress={() => handleEmployeePress(item)}
              showAttendance={false} 
            />
          )}
          contentContainerStyle={styles.container}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
        />
      </View>

      <EmployeeDetailsModal 
        visible={modalVisible}
        employee={selectedEmployee}
        mode={modalMode}
        onClose={() => setModalVisible(false)}
        onUpdate={loadTeam}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC', // Very light modern gray
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
  },
  mainWrapperWide: {
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  header: {
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 4px 12px ${colors.primary}50`,
        cursor: 'pointer',
      }
    })
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.xs,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }
    })
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 12,
    color: colors.textPrimary,
    outlineStyle: 'none', // For Web
  },
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    marginTop: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
  },
  footerContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
