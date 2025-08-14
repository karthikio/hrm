import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import AddEmployee from '../screens/AddEmployee';

const { width, height } = Dimensions.get('window');

export default function SuperAdminSidebar({ visible, onClose, navigation }) {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: 'grid-outline',
      onPress: () => {
        navigation.navigate('SuperAdminDashboard');
        onClose();
      }
    },
    {
      title: 'Add Employees',
      icon: 'person-add-outline',
      onPress: () => {
        navigation.navigate('AddEmployee');
        onClose();
      }
    },
    {
      title: 'Edit profiles',
      icon: 'create-outline',
      onPress: () => {
        // This will be implemented later
        navigation.navigate('EditProfile');
        onClose();
      }
    }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sidebar}>
          <SafeAreaView style={styles.sidebarContent}>
            {/* Header with Logo */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>
                  <Text style={styles.logoIcon}>📊</Text>
                  <Text style={styles.logoGreen}>RR THULA</Text>
                  <Text style={styles.logoBlue}>SI</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Welcome Message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome</Text>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <View style={styles.menuIconContainer}>
                    <Ionicons 
                      name={item.icon} 
                      size={18} 
                      color="#666"
                    />
                  </View>
                  <Text style={styles.menuText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="log-out-outline" size={18} color="#666" />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            {/* User Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.profileImageContainer}>
                <View style={styles.profileImage}>
                  <Ionicons name="person" size={24} color="#ffffff" />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Super Admin</Text>
                <Text style={styles.profileEmail}>superadmin@gmail.com</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
        <TouchableOpacity style={styles.overlayTouch} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  overlayTouch: {
    flex: 1,
  },
  sidebar: {
    width: width * 0.8,
    backgroundColor: '#E8F4FD',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  sidebarContent: {
    flex: 1,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoIcon: {
    marginRight: 5,
  },
  logoGreen: {
    color: '#4CAF50',
  },
  logoBlue: {
    color: '#2196F3',
  },
  closeButton: {
    padding: 5,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  menuContainer: {
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginVertical: 3,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuIconContainer: {
    width: 30,
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    fontWeight: '400',
  },
  spacer: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginVertical: 3,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoutText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    fontWeight: '400',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  profileImageContainer: {
    marginRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: '#666',
  },
});