import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Keyboard, 
  TouchableWithoutFeedback,
  StatusBar,
  Image,
  ScrollView
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState('Michael Mitchell');
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState('Male');
  const [phoneNumber, setPhoneNumber] = useState('+1 234 567 8900');
  const [isEditing, setIsEditing] = useState(false);

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

  const handleSave = () => {
    if (!name || !age || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Here you would typically save to your database
    Alert.alert('Success', 'Profile updated successfully');
    setIsEditing(false);
  };

  const handleEditAvatar = () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Camera',
          onPress: () => {
            // Handle camera selection
            Alert.alert('Info', 'Camera functionality would be implemented here');
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            // Handle gallery selection
            Alert.alert('Info', 'Gallery functionality would be implemented here');
          },
        },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.logo}>
              <Text style={styles.logoGreen}>RR THULA</Text>
              <Text style={styles.logoBlue}>SI</Text>
            </Text>
            <Text style={styles.tagline}>My Profile</Text>
          </View>

          {/* Profile Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: 'https://via.placeholder.com/120x120/2196F3/ffffff?text=MM'
                }}
                style={styles.avatar}
              />
              <TouchableOpacity 
                style={styles.editAvatarButton}
                onPress={handleEditAvatar}
              >
                <Text style={styles.editAvatarText}>✏️</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={name}
                onChangeText={setName}
                editable={isEditing}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Age Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={age}
                onChangeText={setAge}
                editable={isEditing}
                placeholder="Enter your age"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            {/* Gender Radio Buttons */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.radioContainer}>
                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => isEditing && setGender('Male')}
                  disabled={!isEditing}
                >
                  <View style={[
                    styles.radioCircle,
                    gender === 'Male' && styles.radioCircleSelected
                  ]}>
                    {gender === 'Male' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[
                    styles.radioText,
                    !isEditing && styles.radioTextDisabled
                  ]}>Male</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => isEditing && setGender('Female')}
                  disabled={!isEditing}
                >
                  <View style={[
                    styles.radioCircle,
                    gender === 'Female' && styles.radioCircleSelected
                  ]}>
                    {gender === 'Female' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[
                    styles.radioText,
                    !isEditing && styles.radioTextDisabled
                  ]}>Female</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioButton}
                  onPress={() => isEditing && setGender('Other')}
                  disabled={!isEditing}
                >
                  <View style={[
                    styles.radioCircle,
                    gender === 'Other' && styles.radioCircleSelected
                  ]}>
                    {gender === 'Other' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[
                    styles.radioText,
                    !isEditing && styles.radioTextDisabled
                  ]}>Other</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.inputDisabled]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={isEditing}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {!isEditing ? (
                <TouchableOpacity 
                  style={styles.editButton} 
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.editingButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Sign Out Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logoGreen: {
    color: '#4CAF50',
  },
  logoBlue: {
    color: '#2196F3',
  },
  tagline: {
    fontSize: 18,
    color: '#2196F3',
    marginBottom: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  editAvatarText: {
    fontSize: 16,
    color: '#ffffff',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#2196F3',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  radioTextDisabled: {
    color: '#666',
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  editingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 30,
  },
  signOutButton: {
    backgroundColor: '#f44336',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});