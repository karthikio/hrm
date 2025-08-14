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
  Dimensions,
  StatusBar
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('employee'); // 'employee', 'admin', or 'superadmin'

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (loginType === 'superadmin') {
        // Check if user is super admin
        const superAdminEmails = ['admin@gmail.com', 'superadmin@gmail.com'];
        
        if (!superAdminEmails.includes(email.toLowerCase())) {
          Alert.alert('Access Denied', 'You do not have super admin privileges');
          await auth.signOut();
          return;
        }
        
        // Don't navigate manually - AuthProvider will handle it
      } else {
        // Employee/Admin login - check if user exists and is approved
        const usersQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
        const userSnapshot = await getDocs(usersQuery);
        
        if (userSnapshot.empty) {
          Alert.alert('Error', 'User profile not found. Please contact super admin.');
          await auth.signOut();
          return;
        }

        const userData = userSnapshot.docs[0].data();
        
        // Check if account is approved
        if (!userData.action) {
          Alert.alert('Access Denied', 'Your account is pending super admin approval. Please wait for super admin to approve your account.');
          await auth.signOut();
          return;
        }

        // Check login type matches user type
        if (loginType === 'admin') {
          if (userData.type !== 'admin') {
            Alert.alert('Access Denied', 'This account is not registered as an admin.');
            await auth.signOut();
            return;
          }
          
          // Check if admin access is approved
          if (!userData.adminAccessApproved) {
            Alert.alert('Access Denied', 'Admin access is not approved for this account. Please contact super admin.');
            await auth.signOut();
            return;
          }
        } else if (loginType === 'employee') {
          if (userData.type !== 'employee') {
            Alert.alert('Access Denied', 'This account is not registered as an employee.');
            await auth.signOut();
            return;
          }
        }
        
        // Don't navigate manually - AuthProvider will handle it
      }
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        <View style={styles.header}>
          <Text style={styles.logoText}>
            <Text style={styles.logoGreen}>RR THULA</Text>
            <Text style={styles.logoBlue}>SI</Text>
          </Text>
          <Text style={styles.tagline}>Attendance partner !</Text>
          <Text style={styles.subtitle}>Ready to continue</Text>
        </View>

        <View style={styles.loginTypeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, loginType === 'employee' && styles.activeTypeButton]}
            onPress={() => setLoginType('employee')}
          >
            <Text style={[styles.typeButtonText, loginType === 'employee' && styles.activeTypeButtonText]}>
              Employee
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.typeButton, loginType === 'admin' && styles.activeTypeButton]}
            onPress={() => setLoginType('admin')}
          >
            <Text style={[styles.typeButtonText, loginType === 'admin' && styles.activeTypeButtonText]}>
              Admin
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.typeButton, loginType === 'superadmin' && styles.activeTypeButton]}
            onPress={() => setLoginType('superadmin')}
          >
            <Text style={[styles.typeButtonText, loginType === 'superadmin' && styles.activeTypeButtonText]}>
              Super Admin
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>
              Login as {loginType === 'superadmin' ? 'Super Admin' : loginType === 'admin' ? 'Admin' : 'Employee'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with social account</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton}>
            <Text style={styles.googleButtonText}>Google</Text>
          </TouchableOpacity>
        </View>

        {loginType === 'employee' && (
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.replace('Register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        )}
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
    marginTop: height * 0.1,
    marginBottom: 40,
  },
  logoText: {
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
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  loginTypeContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTypeButton: {
    backgroundColor: '#2196F3',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeTypeButtonText: {
    color: '#ffffff',
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
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
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: '#666',
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  googleButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});