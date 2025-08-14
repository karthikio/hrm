import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const { width } = Dimensions.get('window');
const BACKEND_URL = 'http://192.168.1.15:8000';

function ResponseCard({ title, data, error }) {
  if (!data && !error) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {error ? (
        <Text style={styles.cardError}>{String(error)}</Text>
      ) : (
        <View style={{ gap: 6 }}>
          <Text style={styles.cardLine}>status: {data?.status}</Text>
          <Text style={styles.cardLine}>user_id: {data?.user_id}</Text>
        </View>
      )}
    </View>
  );
}

export default function FaceRegisterScreen({ navigation, route }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [uploading, setUploading] = useState(false);
  const [facing, setFacing] = useState('front');
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);

  useEffect(() => {
    if (route.params?.employeeData) {
      setEmployeeData(route.params.employeeData);
    }
  }, [route.params]);

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionWrap}>
        <Ionicons name="camera" size={48} color="#2196F3" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to capture face for registration.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const captureAndRegister = async () => {
    setErr(null);
    setResult(null);

    if (!employeeData) {
      Alert.alert('Error', 'Employee data not found. Please go back and fill the form.');
      return;
    }

    if (!cameraRef.current) return;
    setUploading(true);
    try {
      // Step 1: Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 700 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Step 2: Register face with backend
      const form = new FormData();
      form.append('user_id', employeeData.employeeId);
      form.append('file', {
        uri: manipulated.uri,
        name: `register_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      const res = await fetch(`${BACKEND_URL}/register`, {
        method: 'POST',
        body: form,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.detail || json?.message || 'Face registration failed');
      }

      // Step 3: Create Firebase user account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        employeeData.email, 
        employeeData.password
      );
      const newUser = userCredential.user;

      // Step 4: Store employee data in Firestore
      const firestoreData = {
        uid: newUser.uid,
        employeeId: employeeData.employeeId,
        name: employeeData.name,
        email: employeeData.email,
        phoneNumber: employeeData.phoneNumber,
        jobRole: employeeData.jobRole,
        assignedSiteLocation: employeeData.assignedSiteLocation,
        workingSchedule: employeeData.workingSchedule,
        type: employeeData.type,
        action: employeeData.type === 'admin' ? employeeData.adminAccessApproved : true,
        adminAccessApproved: employeeData.type === 'admin' ? employeeData.adminAccessApproved : false,
        faceRegistered: true,
        faceUserId: json.user_id,
        createdAt: new Date(),
        createdBy: 'superadmin'
      };

      await addDoc(collection(db, 'users'), firestoreData);

      // Step 5: Sign out the newly created user
      await signOut(auth);

      setResult(json);
      
      Alert.alert(
        'Success!', 
        `${employeeData.type === 'admin' ? 'Admin' : 'Employee'} ${employeeData.name} has been registered successfully with ID: ${employeeData.employeeId}`,
        [
          {
            text: 'Add Another',
            onPress: () => {
              navigation.navigate('AddEmployee');
            }
          },
          {
            text: 'Done',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );

    } catch (e) {
      setErr(e.message || 'Registration failed');
      Alert.alert('Error', e.message || 'Registration failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2196F3" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.brand}>
              <Text style={styles.brandGreen}>RR THULA</Text>
              <Text style={styles.brandBlue}>SI</Text>
            </Text>
            <Text style={styles.headerTitle}>Register Face</Text>
            <Text style={styles.subTitle}>Step 2: Face Recognition Setup</Text>
          </View>
        </View>

        {/* Employee Info Card */}
        {employeeData && (
          <View style={styles.employeeInfoCard}>
            <View style={styles.employeeInfoHeader}>
              <View style={styles.employeeAvatar}>
                <Text style={styles.employeeAvatarText}>
                  {employeeData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.employeeDetails}>
                <Text style={styles.employeeName}>{employeeData.name}</Text>
                <Text style={styles.employeeId}>ID: {employeeData.employeeId}</Text>
                <Text style={styles.employeeType}>
                  {employeeData.type === 'admin' ? 'Administrator' : 'Employee'}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <View style={styles.instructionText}>
            <Text style={styles.instructionTitle}>Face Registration Instructions</Text>
            <Text style={styles.instructionSubtext}>
              • Position your face within the frame{'\n'}
              • Ensure good lighting{'\n'}
              • Look directly at the camera{'\n'}
              • Remove glasses if possible
            </Text>
          </View>
        </View>

        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.overlay}>
              <TouchableOpacity
                style={styles.flipBtn}
                onPress={() => setFacing((p) => (p === 'front' ? 'back' : 'front'))}
              >
                <Ionicons name="camera-reverse" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            {uploading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.loadingText}>Processing Registration...</Text>
              </View>
            )}

            <View style={styles.frameGuide}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </CameraView>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, uploading && styles.disabledBtn]}
            onPress={captureAndRegister}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Registering...</Text>
              </>
            ) : (
              <>
                <Ionicons name="person-add" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Complete Registration</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={16} color="#2196F3" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryBtnText}>Back to Form</Text>
          </TouchableOpacity>
        </View>

        <ResponseCard title="Registration Response" data={result} error={err} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  permissionWrap: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  permissionTitle: { fontSize: 20, fontWeight: '600', color: '#111' },
  permissionText: { fontSize: 14, color: '#555', textAlign: 'center' },

  header: { 
    flexDirection: 'row',
    alignItems: 'center', 
    paddingTop: 40, 
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  brand: { fontSize: 28, fontWeight: '800' },
  brandGreen: { color: '#4CAF50' },
  brandBlue: { color: '#2196F3' },
  headerTitle: { marginTop: 6, fontSize: 18, color: '#2196F3', fontWeight: '600' },
  subTitle: { fontSize: 13, color: '#666' },

  employeeInfoCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  employeeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  employeeAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  employeeId: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
    marginBottom: 2,
  },
  employeeType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },

  instructionCard: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionText: {
    flex: 1,
    marginLeft: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },

  cameraWrap: { height: width * 1.2, paddingHorizontal: 20, paddingBottom: 12 },
  camera: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  overlay: { position: 'absolute', right: 16, top: 16, zIndex: 10 },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { color: '#fff', marginTop: 10, fontSize: 16, fontWeight: '600' },

  frameGuide: {
    position: 'absolute',
    top: '18%',
    left: '12%',
    right: '12%',
    bottom: '18%',
  },
  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: '#2196F3',
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderRadius: 4,
  },
  cornerTR: { right: 0, transform: [{ rotateY: '180deg' }] },
  cornerBL: { bottom: 0, transform: [{ rotateX: '180deg' }] },
  cornerBR: { right: 0, bottom: 0, transform: [{ rotateX: '180deg' }, { rotateY: '180deg' }] },

  actions: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  primaryBtn: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
  secondaryBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryBtnText: { color: '#2196F3', fontSize: 15, fontWeight: '700' },

  card: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#111' },
  cardLine: { fontSize: 14, color: '#333' },
  cardError: { fontSize: 14, color: '#b91c1c' },
});