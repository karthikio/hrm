import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function AddEmployee({ navigation }) {
  const [selectedType, setSelectedType] = useState('employee');
  const [loading, setLoading] = useState(false);
  const [generatedEmployeeId, setGeneratedEmployeeId] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: '',
    jobRole: '',
    assignedSiteLocation: '',
    workingSchedule: '',
    adminAccessApproved: false
  });

  useEffect(() => {
    generateUniqueEmployeeId();
  }, [selectedType]);

  const generateUniqueEmployeeId = async () => {
    try {
      const prefix = selectedType === 'admin' ? 'adm' : 'emp';
      
      // Get all existing users to find the highest number
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      
      let highestNumber = 0;
      
      snapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.employeeId && userData.employeeId.startsWith(prefix)) {
          const numberPart = parseInt(userData.employeeId.substring(3));
          if (!isNaN(numberPart) && numberPart > highestNumber) {
            highestNumber = numberPart;
          }
        }
      });
      
      const nextNumber = (highestNumber + 1).toString().padStart(2, '0');
      const newEmployeeId = `${prefix}${nextNumber}`;
      
      setGeneratedEmployeeId(newEmployeeId);
    } catch (error) {
      console.error('Error generating employee ID:', error);
      // Fallback to basic generation
      const prefix = selectedType === 'admin' ? 'adm' : 'emp';
      const randomNumber = Math.floor(Math.random() * 99) + 1;
      const fallbackId = `${prefix}${randomNumber.toString().padStart(2, '0')}`;
      setGeneratedEmployeeId(fallbackId);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phoneNumber: '',
      email: '',
      password: '',
      jobRole: '',
      assignedSiteLocation: '',
      workingSchedule: '',
      adminAccessApproved: false
    });
    generateUniqueEmployeeId();
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { name, phoneNumber, email, password, jobRole, assignedSiteLocation, workingSchedule } = formData;
    
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
    if (!password || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleNextToFaceRegistration = () => {
    if (!validateForm()) return;

    // Navigate to face registration with form data and employee ID
    navigation.navigate('FaceRegister', {
      employeeData: {
        ...formData,
        employeeId: generatedEmployeeId,
        type: selectedType
      }
    });
  };

  const renderInputField = (label, field, keyboardType = 'default', secureTextEntry = false) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={field === 'email' ? 'none' : 'words'}
        autoCorrect={false}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Add Employee</Text>
          <Text style={styles.headerSubtitle}>Step 1: Basic Information</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Employee ID Display */}
          <View style={styles.employeeIdContainer}>
            <Text style={styles.employeeIdLabel}>Generated Employee ID</Text>
            <View style={styles.employeeIdCard}>
              <Ionicons name="person-circle" size={24} color="#2196F3" />
              <Text style={styles.employeeIdText}>{generatedEmployeeId}</Text>
              <TouchableOpacity onPress={generateUniqueEmployeeId} style={styles.refreshButton}>
                <Ionicons name="refresh" size={20} color="#2196F3" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Type Selection Buttons */}
          <View style={styles.typeSelectionContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'employee' && styles.activeTypeButton
              ]}
              onPress={() => setSelectedType('employee')}
            >
              <Ionicons 
                name="person" 
                size={20} 
                color={selectedType === 'employee' ? '#ffffff' : '#2196F3'} 
              />
              <Text style={[
                styles.typeButtonText,
                selectedType === 'employee' && styles.activeTypeButtonText
              ]}>
                Employee
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === 'admin' && styles.activeTypeButton
              ]}
              onPress={() => setSelectedType('admin')}
            >
              <Ionicons 
                name="shield-checkmark" 
                size={20} 
                color={selectedType === 'admin' ? '#ffffff' : '#2196F3'} 
              />
              <Text style={[
                styles.typeButtonText,
                selectedType === 'admin' && styles.activeTypeButtonText
              ]}>
                Admin
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {selectedType === 'admin' ? 'Admin' : 'Employee'} Information
            </Text>

            {renderInputField('Full Name', 'name')}
            {renderInputField('Phone Number', 'phoneNumber', 'phone-pad')}
            {renderInputField('Email Address', 'email', 'email-address')}
            {renderInputField('Password', 'password', 'default', true)}
            {renderInputField('Job Role', 'jobRole')}
            {renderInputField('Assigned Site Location', 'assignedSiteLocation')}
            {renderInputField('Working Schedule', 'workingSchedule')}

            {/* Admin Access Approval Checkbox (only for admin type) */}
            {selectedType === 'admin' && (
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

            {/* Next Button */}
            <TouchableOpacity
              style={[styles.nextButton, loading && styles.disabledButton]}
              onPress={handleNextToFaceRegistration}
              disabled={loading}
            >
              <Ionicons name="camera" size={20} color="#ffffff" />
              <Text style={styles.nextButtonText}>Next: Register Face</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Reset Button */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetForm}
            >
              <Ionicons name="refresh" size={18} color="#2196F3" />
              <Text style={styles.resetButtonText}>Reset Form</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
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
  content: {
    flex: 1,
    padding: 20,
  },
  employeeIdContainer: {
    marginBottom: 20,
  },
  employeeIdLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  employeeIdCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  employeeIdText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginLeft: 12,
  },
  refreshButton: {
    padding: 8,
  },
  typeSelectionContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeTypeButton: {
    backgroundColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginLeft: 8,
  },
  activeTypeButtonText: {
    color: '#ffffff',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
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
  nextButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  resetButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
});