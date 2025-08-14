import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import SuperAdminSidebar from '../components/SuperAdminSidebar';

export default function SuperAdminDashboard({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [siteData, setSiteData] = useState([]); // Admin-employee relationships by site
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState('users'); // 'users' or 'sites'
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEmployees: 0,
    totalAdmins: 0,
    approvedUsers: 0,
    pendingUsers: 0,
    totalSites: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedFilter]);

  useEffect(() => {
    calculateStats();
    organizeSiteData();
  }, [users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users data');
    } finally {
      setLoading(false);
    }
  };

  const organizeSiteData = () => {
    // Group users by site location
    const siteMap = {};
    
    users.forEach(user => {
      const siteLocation = user.assignedSiteLocation || 'Unassigned';
      
      if (!siteMap[siteLocation]) {
        siteMap[siteLocation] = {
          siteName: siteLocation,
          admins: [],
          employees: [],
          totalUsers: 0
        };
      }
      
      if (user.type === 'admin') {
        siteMap[siteLocation].admins.push(user);
      } else if (user.type === 'employee') {
        siteMap[siteLocation].employees.push(user);
      }
      
      siteMap[siteLocation].totalUsers++;
    });

    // Convert to array and sort by total users
    const siteArray = Object.values(siteMap).sort((a, b) => b.totalUsers - a.totalUsers);
    setSiteData(siteArray);
  };

  const calculateStats = () => {
    const total = users.length;
    const employees = users.filter(user => user.type === 'employee').length;
    const admins = users.filter(user => user.type === 'admin').length;
    const approved = users.filter(user => user.action === true).length;
    const pending = users.filter(user => user.action === false).length;
    
    // Count unique site locations
    const uniqueSites = new Set(
      users
        .filter(user => user.assignedSiteLocation)
        .map(user => user.assignedSiteLocation)
    ).size;

    setStats({
      totalUsers: total,
      totalEmployees: employees,
      totalAdmins: admins,
      approvedUsers: approved,
      pendingUsers: pending,
      totalSites: uniqueSites
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.jobRole?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.assignedSiteLocation?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'employee':
        filtered = filtered.filter(user => user.type === 'employee');
        break;
      case 'admin':
        filtered = filtered.filter(user => user.type === 'admin');
        break;
      case 'approved':
        filtered = filtered.filter(user => user.action === true);
        break;
      case 'pending':
        filtered = filtered.filter(user => user.action === false);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        action: !currentStatus
      });

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, action: !currentStatus } : user
        )
      );

      Alert.alert(
        'Success',
        `User ${!currentStatus ? 'approved' : 'suspended'} successfully`
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const toggleAdminAccess = async (userId, currentAdminAccess) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        adminAccessApproved: !currentAdminAccess
      });

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, adminAccessApproved: !currentAdminAccess } : user
        )
      );

      Alert.alert(
        'Success',
        `Admin access ${!currentAdminAccess ? 'granted' : 'revoked'} successfully`
      );
    } catch (error) {
      console.error('Error updating admin access:', error);
      Alert.alert('Error', 'Failed to update admin access');
    }
  };

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statTextContainer}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>
    </View>
  );

  const renderTabButton = (tab, label, icon) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === tab && styles.activeTabButton
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <Ionicons 
        name={icon} 
        size={18} 
        color={selectedTab === tab ? '#ffffff' : '#2196F3'} 
      />
      <Text style={[
        styles.tabButtonText,
        selectedTab === tab && styles.activeTabButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderFilterButton = (filter, label, icon) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.activeFilterButton
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Ionicons 
        name={icon} 
        size={16} 
        color={selectedFilter === filter ? '#ffffff' : '#2196F3'} 
      />
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderUserItem = ({ item }) => {
    const getRandomStatus = () => {
      const statuses = ['Online', 'Offline', 'Away'];
      const statusColors = {
        'Online': '#4CAF50',
        'Offline': '#666',
        'Away': '#FF9800'
      };
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      return { status: randomStatus, color: statusColors[randomStatus] };
    };

    const { status, color } = getRandomStatus();
    const formatDate = (date) => {
      if (!date) return 'N/A';
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString();
    };

    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userAvatarContainer}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {item.name ? item.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'N/A'}
              </Text>
            </View>
            <View style={[styles.onlineIndicator, { backgroundColor: color }]} />
          </View>
          
          <View style={styles.userMainInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{item.name || 'N/A'}</Text>
              <View style={styles.badgesContainer}>
                <View style={[
                  styles.userTypeBadge,
                  item.type === 'admin' ? styles.adminBadge : styles.employeeBadge
                ]}>
                  <Text style={styles.userTypeText}>
                    {item.type === 'admin' ? 'Admin' : 'Employee'}
                  </Text>
                </View>
                
                <View style={[
                  styles.statusBadge,
                  item.action ? styles.approvedBadge : styles.pendingBadge
                ]}>
                  <Text style={styles.statusText}>
                    {item.action ? 'Approved' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.userDetailsGrid}>
              <View style={styles.userDetailItem}>
                <Ionicons name="mail" size={14} color="#666" />
                <Text style={styles.userDetailText}>{item.email || 'N/A'}</Text>
              </View>
              
              <View style={styles.userDetailItem}>
                <Ionicons name="call" size={14} color="#666" />
                <Text style={styles.userDetailText}>{item.phoneNumber || 'N/A'}</Text>
              </View>
              
              <View style={styles.userDetailItem}>
                <Ionicons name="briefcase" size={14} color="#666" />
                <Text style={styles.userDetailText}>{item.jobRole || 'N/A'}</Text>
              </View>
              
              <View style={styles.userDetailItem}>
                <Ionicons name="location" size={14} color="#666" />
                <Text style={styles.userDetailText}>{item.assignedSiteLocation || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.userActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.action ? styles.suspendButton : styles.approveButton
            ]}
            onPress={() => toggleUserStatus(item.id, item.action)}
          >
            <Ionicons 
              name={item.action ? 'close-circle' : 'checkmark-circle'} 
              size={16} 
              color="#ffffff" 
            />
            <Text style={styles.actionButtonText}>
              {item.action ? 'Suspend' : 'Approve'}
            </Text>
          </TouchableOpacity>

          {item.type === 'admin' && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                item.adminAccessApproved ? styles.revokeButton : styles.grantButton
              ]}
              onPress={() => toggleAdminAccess(item.id, item.adminAccessApproved)}
            >
              <Ionicons 
                name={item.adminAccessApproved ? 'remove-circle' : 'add-circle'} 
                size={16} 
                color="#ffffff" 
              />
              <Text style={styles.actionButtonText}>
                {item.adminAccessApproved ? 'Revoke Admin' : 'Grant Admin'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSiteItem = ({ item }) => {
    return (
      <View style={styles.siteCard}>
        <View style={styles.siteHeader}>
          <View style={styles.siteIconContainer}>
            <Ionicons name="business" size={24} color="#2196F3" />
          </View>
          
          <View style={styles.siteMainInfo}>
            <Text style={styles.siteName}>{item.siteName}</Text>
            <Text style={styles.siteStats}>
              {item.admins.length} Admin{item.admins.length !== 1 ? 's' : ''} • {item.employees.length} Employee{item.employees.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <View style={styles.siteTotalBadge}>
            <Text style={styles.siteTotalText}>{item.totalUsers}</Text>
          </View>
        </View>

        {/* Admins Section */}
        {item.admins.length > 0 && (
          <View style={styles.siteSection}>
            <Text style={styles.siteSectionTitle}>
              <Ionicons name="shield-checkmark" size={14} color="#FF6B6B" /> 
              {' '}Admins ({item.admins.length})
            </Text>
            {item.admins.map(admin => (
              <View key={admin.id} style={styles.siteUserItem}>
                <View style={styles.siteUserAvatar}>
                  <Text style={styles.siteUserAvatarText}>
                    {admin.name ? admin.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'A'}
                  </Text>
                </View>
                <View style={styles.siteUserInfo}>
                  <Text style={styles.siteUserName}>{admin.name || 'N/A'}</Text>
                  <Text style={styles.siteUserRole}>{admin.jobRole || 'Admin'}</Text>
                </View>
                <View style={[
                  styles.siteUserStatus,
                  admin.action ? styles.siteUserApproved : styles.siteUserPending
                ]}>
                  <Text style={styles.siteUserStatusText}>
                    {admin.action ? 'Active' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Employees Section */}
        {item.employees.length > 0 && (
          <View style={styles.siteSection}>
            <Text style={styles.siteSectionTitle}>
              <Ionicons name="people" size={14} color="#4CAF50" /> 
              {' '}Employees ({item.employees.length})
            </Text>
            {item.employees.slice(0, 5).map(employee => (
              <View key={employee.id} style={styles.siteUserItem}>
                <View style={[styles.siteUserAvatar, styles.employeeAvatar]}>
                  <Text style={styles.siteUserAvatarText}>
                    {employee.name ? employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'E'}
                  </Text>
                </View>
                <View style={styles.siteUserInfo}>
                  <Text style={styles.siteUserName}>{employee.name || 'N/A'}</Text>
                  <Text style={styles.siteUserRole}>{employee.jobRole || 'Employee'}</Text>
                </View>
                <View style={[
                  styles.siteUserStatus,
                  employee.action ? styles.siteUserApproved : styles.siteUserPending
                ]}>
                  <Text style={styles.siteUserStatusText}>
                    {employee.action ? 'Active' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))}
            
            {item.employees.length > 5 && (
              <Text style={styles.siteMoreText}>
                +{item.employees.length - 5} more employees
              </Text>
            )}
          </View>
        )}

        {item.admins.length === 0 && item.employees.length === 0 && (
          <View style={styles.siteEmptySection}>
            <Ionicons name="people-outline" size={32} color="#ccc" />
            <Text style={styles.siteEmptyText}>No users assigned to this site</Text>
          </View>
        )}
      </View>
    );
  };

  const getFilterCount = (filter) => {
    switch (filter) {
      case 'employee':
        return users.filter(user => user.type === 'employee').length;
      case 'admin':
        return users.filter(user => user.type === 'admin').length;
      case 'approved':
        return users.filter(user => user.action === true).length;
      case 'pending':
        return users.filter(user => user.action === false).length;
      default:
        return users.length;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setSidebarVisible(true)}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Super Admin</Text>
          <Text style={styles.headerSubtitle}>System Management</Text>
        </View>

        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome back, Super Admin!</Text>
          <Text style={styles.welcomeText}>
            System overview and user management dashboard
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Total Users', stats.totalUsers, 'people', '#2196F3')}
            {renderStatCard('Employees', stats.totalEmployees, 'person', '#4CAF50')}
            {renderStatCard('Admins', stats.totalAdmins, 'shield-checkmark', '#FF6B6B')}
            {renderStatCard('Approved', stats.approvedUsers, 'checkmark-circle', '#4CAF50')}
            {renderStatCard('Pending', stats.pendingUsers, 'time', '#FF9800')}
            {renderStatCard('Total Sites', stats.totalSites, 'business', '#9C27B0')}
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          {renderTabButton('users', 'All Users', 'people')}
          {renderTabButton('sites', 'Site Management', 'business')}
        </View>

        {selectedTab === 'users' && (
          <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by name, email, job role, or location..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#666" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Filter Buttons */}
            <View style={styles.filtersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {renderFilterButton('all', `All (${getFilterCount('all')})`, 'people')}
                {renderFilterButton('employee', `Employee (${getFilterCount('employee')})`, 'person')}
                {renderFilterButton('admin', `Admin (${getFilterCount('admin')})`, 'shield-checkmark')}
                {renderFilterButton('approved', `Approved (${getFilterCount('approved')})`, 'checkmark-circle')}
                {renderFilterButton('pending', `Pending (${getFilterCount('pending')})`, 'time')}
              </ScrollView>
            </View>

            {/* Users List */}
            <View style={styles.usersSection}>
              <Text style={styles.sectionTitle}>
                User Management ({filteredUsers.length} users)
              </Text>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2196F3" />
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredUsers}
                  keyExtractor={(item) => item.id}
                  renderItem={renderUserItem}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="people-outline" size={60} color="#ccc" />
                      <Text style={styles.emptyText}>No users found</Text>
                      <Text style={styles.emptySubText}>
                        {searchQuery || selectedFilter !== 'all' 
                          ? 'Try adjusting your search or filter'
                          : 'Add some employees or admins to get started'
                        }
                      </Text>
                    </View>
                  )}
                />
              )}
            </View>
          </>
        )}

        {selectedTab === 'sites' && (
          <View style={styles.sitesSection}>
            <Text style={styles.sectionTitle}>
              Site Management ({siteData.length} locations)
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Loading site data...</Text>
              </View>
            ) : (
              <FlatList
                data={siteData}
                keyExtractor={(item) => item.siteName}
                renderItem={renderSiteItem}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="business-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>No sites found</Text>
                    <Text style={styles.emptySubText}>
                      Users need to be assigned to site locations
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Sidebar */}
      <SuperAdminSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  menuButton: {
    padding: 8,
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  notificationButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#2196F3',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 6,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  activeFilterButton: {
    backgroundColor: '#2196F3',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  usersSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sitesSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  userAvatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  userMainInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  userTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#FF6B6B',
  },
  employeeBadge: {
    backgroundColor: '#4ECDC4',
  },
  userTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedBadge: {
    backgroundColor: '#4CAF50',
  },
  pendingBadge: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  userDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    width: '48%',
  },
  userDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  suspendButton: {
    backgroundColor: '#F44336',
  },
  grantButton: {
    backgroundColor: '#2196F3',
  },
  revokeButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 4,
  },
  // Site-specific styles
  siteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  siteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  siteIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  siteMainInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  siteStats: {
    fontSize: 14,
    color: '#666',
  },
  siteTotalBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  siteTotalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  siteSection: {
    marginBottom: 15,
  },
  siteSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  siteUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 6,
  },
  siteUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeAvatar: {
    backgroundColor: '#4CAF50',
  },
  siteUserAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  siteUserInfo: {
    flex: 1,
  },
  siteUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  siteUserRole: {
    fontSize: 12,
    color: '#666',
  },
  siteUserStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  siteUserApproved: {
    backgroundColor: '#E8F5E8',
  },
  siteUserPending: {
    backgroundColor: '#FFF3E0',
  },
  siteUserStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  siteMoreText: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  siteEmptySection: {
    alignItems: 'center',
    padding: 20,
  },
  siteEmptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  separator: {
    height: 15,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});