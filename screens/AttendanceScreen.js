import React, { useRef, useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Text, 
  StyleSheet,
  StatusBar,
  Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const { width, height } = Dimensions.get('window');

export default function AttendanceScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [uploading, setUploading] = useState(false);
  const [facing, setFacing] = useState('back');
  const cameraRef = useRef(null);

  if (!permission) return <View />;
  
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        
        <View style={styles.header}>
          <Text style={styles.logo}>
            <Text style={styles.logoGreen}>RR THULA</Text>
            <Text style={styles.logoBlue}>SI</Text>
          </Text>
          <Text style={styles.tagline}>Attendance Camera</Text>
        </View>

        <View style={styles.permissionContainer}>
          <View style={styles.permissionIcon}>
            <Text style={styles.permissionIconText}>📷</Text>
          </View>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to capture attendance photos
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCapture = async () => {
    if (cameraRef.current) {
      setUploading(true);
      try {
        // Take photo
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.5, 
          skipProcessing: true 
        });

        // Resize and compress image
        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 600 } }],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Prepare form data
        const data = new FormData();
        data.append('file', {
          uri: manipulated.uri,
          type: 'image/jpeg',
          name: `attendance_${Date.now()}.jpg`,
        });
        data.append('upload_preset', 'attendance_upload');

        // Upload to Cloudinary
        const res = await fetch('https://api.cloudinary.com/v1_1/dopqbv7id/image/upload', {
          method: 'POST',
          body: data,
        });

        const cloudinaryData = await res.json();
        console.log('Cloudinary response:', cloudinaryData);

        if (!cloudinaryData.secure_url) {
          throw new Error(cloudinaryData.error?.message || 'Cloudinary upload failed');
        }
        const downloadURL = cloudinaryData.secure_url;

        // Save to Firestore
        await addDoc(collection(db, 'attendance'), {
          photoUrl: downloadURL,
          status: 'Present',
          timestamp: Timestamp.now()
        });

        Alert.alert('Success', 'Attendance marked successfully!');
      } catch (e) {
        Alert.alert('Error', e.message);
      }
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>
          <Text style={styles.logoGreen}>RR THULA</Text>
          <Text style={styles.logoBlue}>SI</Text>
        </Text>
        <Text style={styles.tagline}>Attendance Camera</Text>
        <Text style={styles.subtitle}>Position yourself in the frame</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          {/* Camera Controls Overlay */}
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            >
              <Text style={styles.flipButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>

          {/* Loading Overlay */}
          {uploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}

          {/* Frame Guide */}
          <View style={styles.frameGuide}>
            <View style={styles.frameCorner} />
            <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
            <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
            <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
          </View>
        </CameraView>
      </View>

      <View style={styles.footer}>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Make sure your face is clearly visible within the frame
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.captureButton, uploading && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={uploading}
        >
          <Text style={styles.captureButtonText}>
            {uploading ? 'Processing...' : 'Mark Attendance'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionIconText: {
    fontSize: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  camera: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
  },
  flipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flipButtonText: {
    fontSize: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
  },
  frameGuide: {
    position: 'absolute',
    top: '20%',
    left: '15%',
    right: '15%',
    bottom: '20%',
  },
  frameCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#2196F3',
    borderWidth: 3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
  },
  frameCornerTopRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  frameCornerBottomLeft: {
    bottom: 0,
    left: 0,
    top: 'auto',
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  frameCornerBottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    backgroundColor: '#ffffff',
  },
  instructionContainer: {
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  captureButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  captureButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  captureButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});