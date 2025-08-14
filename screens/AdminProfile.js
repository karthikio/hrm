import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  StatusBar,
  ScrollView,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthProvider';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

export default function AdminProfile({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // User profile data
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    jobRole: '',
    assignedSiteLocation: '',
    workingSchedule: '',
    type: '',
    action: false,
    adminAccessApproved: false,
    createdAt: null
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const userDoc = querySnapshot.docs[0];
        
        const profile = {
          id: userDoc.id,
          ...userData
        };
        
        setProfileData(profile);
      } else {
        Alert.alert('Error', 'Admin profile not found');
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return 'Not available';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Profile</Text>
          <Text style={styles.headerSubtitle}>View your account details</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(profileData.name)}
            </Text>
          </View>
          
          {/* Status Badges */}
          <View style={styles.badgesContainer}>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#ffffff" />
              <Text style={styles.badgeText}>Admin</Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              profileData.adminAccessApproved ? styles.approvedBadge : styles.pendingBadge
            ]}>
              <Text style={styles.statusText}>
                {profileData.adminAccessApproved ? 'Approved' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.form}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.displayField}>
              <Text style={styles.displayText}>{profileData.name || 'Not provided'}</Text>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.displayField}>
              <Text style={styles.displayText}>{profileData.email || 'Not provided'}</Text>
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.displayField}>
              <Text style={styles.displayText}>{profileData.phoneNumber || 'Not provided'}</Text>
            </View>
          </View>

          {/* Job Role */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Role</Text>
            <View style={styles.displayField}>
              <Text style={styles.displayText}>{profileData.jobRole || 'Not provided'}</Text>
            </View>
          </View>

          {/* Assigned Site Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assigned Site Location</Text>
            <View style={styles.displayField}>
              <Text style={styles.displayText}>{profileData.assignedSiteLocation || 'Not provided'}</Text>
            </View>
          </View>

          {/* Working Schedule */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Working Schedule</Text>
            <View style={[styles.displayField, styles.multilineField]}>
              <Text style={styles.displayText}>{profileData.workingSchedule || 'Not provided'}</Text>
            </View>
          </View>

          {/* Admin Access Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Admin Access Status</Text>
            <View style={styles.displayField}>
              <Text style={[
                styles.displayText,
                { color: profileData.adminAccessApproved ? '#4CAF50' : '#FF9800' }
              ]}>
                {profileData.adminAccessApproved ? 'Access Granted' : 'Pending Approval'}
              </Text>
            </View>
          </View>

          {/* Account Created Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Created</Text>
            <View style={styles.displayField}>
              <Text style={styles.displayText}>{formatDate(profileData.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out" size={20} color="#ffffff" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  backButton: {
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  approvedBadge: {
    backgroundColor: '#4CAF50',
  },
  pendingBadge: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  form: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  displayField: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f5f5f5',
  },
  multilineField: {
    minHeight: 60,
  },
  displayText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  signOutButton: {
    backgroundColor: '#F44336',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});