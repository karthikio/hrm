import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db } from '../firebase';
import SuperAdminSidebar from '../components/SuperAdminSidebar';

export default function EditProfile({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    userType: 'all', // all, employee, admin
    siteLocation: 'all', // all, or specific site
    sortBy: 'newest', // newest, oldest, name_asc, name_desc
  });

  // Form data for editing
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    jobRole: '',
    assignedSiteLocation: '',
    workingSchedule: '',
    type: 'employee',
    adminAccessApproved: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchQuery, filters]);

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

  const filterAndSortUsers = () => {
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

    // Apply user type filter
    if (filters.userType !== 'all') {
      filtered = filtered.filter(user => user.type === filters.userType);
    }

    // Apply site location filter
    if (filters.siteLocation !== 'all') {
      filtered = filtered.filter(user => user.assignedSiteLocation === filters.siteLocation);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateA - dateB;
        });
        break;
      case 'name_asc':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
    }

    setFilteredUsers(filtered);
  };

  const getUniqueLocations = () => {
    const locations = new Set();
    users.forEach(user => {
      if (user.assignedSiteLocation) {
        locations.add(user.assignedSiteLocation);
      }
    });
    return Array.from(locations).sort();
  };

  const getFilterCounts = () => {
    return {
      all: users.length,
      employee: users.filter(u => u.type === 'employee').length,
      admin: users.filter(u => u.type === 'admin').length,
    };
  };

  const resetFilters = () => {
    setFilters({
      userType: 'all',
      siteLocation: 'all',
      sortBy: 'newest',
    });
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      jobRole: user.jobRole || '',
      assignedSiteLocation: user.assignedSiteLocation || '',
      workingSchedule: user.workingSchedule || '',
      type: user.type || 'employee',
      adminAccessApproved: user.adminAccessApproved || false
    });
    setEditModalVisible(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteModalVisible(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { name, phoneNumber, email, jobRole, assignedSiteLocation, workingSchedule } = formData;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter employee name');
      return false;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter email address');
      return false;
    }
    if (!jobRole.trim()) {
      Alert.alert('Error', 'Please enter job role');
      return false;
    }
    if (!assignedSiteLocation.trim()) {
      Alert.alert('Error', 'Please enter assigned site location');
      return false;
    }
    if (!workingSchedule.trim()) {
      Alert.alert('Error', 'Please enter working schedule');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const updateUser = async () => {
    if (!validateForm()) return;

    setUpdating(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      
      const updateData = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        jobRole: formData.jobRole,
        assignedSiteLocation: formData.assignedSiteLocation,
        workingSchedule: formData.workingSchedule,
        type: formData.type,
        updatedAt: new Date()
      };

      if (formData.type === 'admin') {
        updateData.adminAccessApproved = formData.adminAccessApproved;
      }

      await updateDoc(userRef, updateData);

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser.id 
            ? { ...user, ...updateData }
            : user
        )
      );

      setEditModalVisible(false);
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  const deleteUser = async () => {
    setUpdating(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', selectedUser.id));

      // Update local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== selectedUser.id));

      setDeleteModalVisible(false);
      Alert.alert('Success', 'User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'Failed to delete user');
    } finally {
      setUpdating(false);
    }
  };

  const renderInputField = (label, field, placeholder, keyboardType = 'default', multiline = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
        autoCorrect={false}
      />
    </View>
  );

  const renderFilterOption = (title, options, selectedValue, filterType) => (
    <View style={styles.filterGroup}>
      <Text style={styles.filterGroupTitle}>{title}</Text>
      <View style={styles.filterOptions}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterOption,
              selectedValue === option.value && styles.activeFilterOption
            ]}
            onPress={() => handleFilterChange(filterType, option.value)}
          >
            <Text style={[
              styles.filterOptionText,
              selectedValue === option.value && styles.activeFilterOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderUserItem = ({ item }) => {
    const getStatusColor = () => {
      if (item.action === true) return '#4CAF50';
      if (item.action === false) return '#FF9800';
      return '#F44336';
    };

    const getStatusText = () => {
      if (item.action === true) return 'Approved';
      if (item.action === false) return 'Pending';
      return 'Suspended';
    };

    const formatDate = (date) => {
      if (!date) return 'N/A';
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString();
    };

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <View style={styles.userNameContainer}>
              <Text style={styles.userName}>{item.name || 'N/A'}</Text>
              <View style={styles.userBadges}>
                <View style={[
                  styles.userTypeBadge,
                  item.type === 'admin' ? styles.adminBadge : styles.employeeBadge
                ]}>
                  <Text style={styles.userTypeText}>
                    {item.type === 'admin' ? 'Admin' : 'Employee'}
                  </Text>
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                  <Text style={styles.statusText}>{getStatusText()}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.userDetails}>
            <View style={styles.userDetailRow}>
              <Ionicons name="mail" size={14} color="#666" />
              <Text style={styles.userDetailText}>{item.email || 'N/A'}</Text>
            </View>
            
            <View style={styles.userDetailRow}>
              <Ionicons name="call" size={14} color="#666" />
              <Text style={styles.userDetailText}>{item.phoneNumber || 'N/A'}</Text>
            </View>
            
            <View style={styles.userDetailRow}>
              <Ionicons name="briefcase" size={14} color="#666" />
              <Text style={styles.userDetailText}>{item.jobRole || 'N/A'}</Text>
            </View>
            
            <View style={styles.userDetailRow}>
              <Ionicons name="location" size={14} color="#666" />
              <Text style={styles.userDetailText}>{item.assignedSiteLocation || 'N/A'}</Text>
            </View>
            
            <View style={styles.userDetailRow}>
              <Ionicons name="calendar" size={14} color="#666" />
              <Text style={styles.userDetailText}>Joined: {formatDate(item.createdAt)}</Text>
            </View>

            {item.type === 'admin' && (
              <View style={styles.userDetailRow}>
                <Ionicons name="shield-checkmark" size={14} color="#666" />
                <Text style={styles.userDetailText}>
                  Admin Access: {item.adminAccessApproved ? 'Granted' : 'Pending'}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.userActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditUser(item)}
            >
              <Ionicons name="create" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteUser(item)}
            >
              <Ionicons name="trash" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const counts = getFilterCounts();
  const uniqueLocations = getUniqueLocations();

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
          <Text style={styles.headerTitle}>Edit Profiles</Text>
          <Text style={styles.headerSubtitle}>Manage User Accounts</Text>
        </View>

        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
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
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {(filters.userType !== 'all' || filters.siteLocation !== 'all') && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.activeFilters}>
              {filters.userType !== 'all' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>Type: {filters.userType}</Text>
                  <TouchableOpacity onPress={() => handleFilterChange('userType', 'all')}>
                    <Ionicons name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
              
              {filters.siteLocation !== 'all' && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>Site: {filters.siteLocation}</Text>
                  <TouchableOpacity onPress={() => handleFilterChange('siteLocation', 'all')}>
                    <Ionicons name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              )}
              
              <TouchableOpacity style={styles.clearAllButton} onPress={resetFilters}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          Showing {filteredUsers.length} of {users.length} users
        </Text>
      </View>

      {/* Users List */}
      <View style={styles.content}>
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
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubText}>
                  {searchQuery || Object.values(filters).some(f => f !== 'all' && f !== 'newest')
                    ? 'Try adjusting your search or filters'
                    : 'No users available'
                  }
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Users</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalBody} showsVerticalScrollIndicator={false}>
              {/* User Type Filter */}
              {renderFilterOption('User Type', [
                { label: `All (${counts.all})`, value: 'all' },
                { label: `Employee (${counts.employee})`, value: 'employee' },
                { label: `Admin (${counts.admin})`, value: 'admin' },
              ], filters.userType, 'userType')}

              {/* Site Location Filter */}
              {renderFilterOption('Site Location', [
                { label: 'All Sites', value: 'all' },
                ...uniqueLocations.map(location => ({ 
                  label: location, 
                  value: location 
                }))
              ], filters.siteLocation, 'siteLocation')}

              {/* Sort By Filter */}
              {renderFilterOption('Sort By', [
                { label: 'Newest First', value: 'newest' },
                { label: 'Oldest First', value: 'oldest' },
                { label: 'Name A-Z', value: 'name_asc' },
                { label: 'Name Z-A', value: 'name_desc' },
              ], filters.sortBy, 'sortBy')}
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit User</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* User Type Selection */}
                <View style={styles.typeSelectionContainer}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      formData.type === 'employee' && styles.activeTypeButton
                    ]}
                    onPress={() => handleInputChange('type', 'employee')}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.type === 'employee' && styles.activeTypeButtonText
                    ]}>
                      Employee
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      formData.type === 'admin' && styles.activeTypeButton
                    ]}
                    onPress={() => handleInputChange('type', 'admin')}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      formData.type === 'admin' && styles.activeTypeButtonText
                    ]}>
                      Admin
                    </Text>
                  </TouchableOpacity>
                </View>

                {renderInputField('Full Name', 'name', 'Enter full name')}
                {renderInputField('Phone Number', 'phoneNumber', '+1 234 567 8900', 'phone-pad')}
                {renderInputField('Email Address', 'email', 'example@email.com', 'email-address')}
                {renderInputField('Job Role', 'jobRole', 'e.g., Software Developer')}
                {renderInputField('Assigned Site Location', 'assignedSiteLocation', 'e.g., Head Office')}
                {renderInputField('Working Schedule', 'workingSchedule', 'e.g., 9 AM - 5 PM, Mon-Fri', 'default', true)}

                {/* Admin Access Approval */}
                {formData.type === 'admin' && (
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => handleInputChange('adminAccessApproved', !formData.adminAccessApproved)}
                    >
                      {formData.adminAccessApproved && (
                        <Ionicons name="checkmark" size={16} color="#2196F3" />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.checkboxLabel}>Admin access is approved</Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.saveButton, updating && styles.disabledButton]}
                  onPress={updateUser}
                  disabled={updating}
                >
                  <Text style={styles.saveButtonText}>
                    {updating ? 'Updating...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Ionicons name="warning" size={60} color="#FF6B6B" />
            <Text style={styles.deleteModalTitle}>Delete User</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </Text>
            
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmDeleteButton, updating && styles.disabledButton]}
                onPress={deleteUser}
                disabled={updating}
              >
                <Text style={styles.confirmDeleteButtonText}>
                  {updating ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  backButton: {
    padding: 8,
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  filterButton: {
    padding: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#2196F3',
    backgroundColor: '#ffffff',
  },
  activeFiltersContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
  },
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#1976D2',
    marginRight: 6,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F44336',
    marginLeft: 8,
  },
  clearAllText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    marginBottom: 15,
  },
  userNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
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
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userDetails: {
    marginBottom: 15,
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    overflow: 'hidden',
  },
  filterModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2196F3',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  filterModalBody: {
    padding: 20,
    maxHeight: 500,
  },
  filterGroup: {
    marginBottom: 25,
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  activeFilterOption: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  typeSelectionContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTypeButton: {
    backgroundColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTypeButtonText: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#ffffff',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  deleteModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    maxWidth: 300,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F44336',
    alignItems: 'center',
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});