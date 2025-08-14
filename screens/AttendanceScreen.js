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

// Replace with your actual FastAPI server URL
const FASTAPI_BASE_URL = 'http://192.168.1.15:8000'; // Change to your server IP/domain

export default function AttendanceScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [uploading, setUploading] = useState(false);
  const [facing, setFacing] = useState('front'); // Changed to front for face recognition
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
          quality: 0.8, 
          skipProcessing: true 
        });

        // Resize and compress image for face recognition
        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Prepare form data for face matching API
        const formData = new FormData();
        formData.append('file', {
          uri: manipulated.uri,
          type: 'image/jpeg',
          name: `attendance_${Date.now()}.jpg`,
        });

        console.log('Sending image for face matching...');

        // Send to your FastAPI face matching endpoint
        const faceMatchResponse = await fetch(`${FASTAPI_BASE_URL}/match`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const faceMatchData = await faceMatchResponse.json();
        console.log('Face match response:', faceMatchData);

        if (!faceMatchResponse.ok) {
          throw new Error(faceMatchData.detail || 'Face recognition failed');
        }

        if (faceMatchData.matched) {
          // Face matched successfully
          const userId = faceMatchData.user_id;
          const confidence = faceMatchData.confidence;

          console.log(`Face matched! User ID: ${userId}, Confidence: ${confidence}`);

          // Upload image to Cloudinary for record keeping
          const cloudinaryData = new FormData();
          cloudinaryData.append('file', {
            uri: manipulated.uri,
            type: 'image/jpeg',
            name: `attendance_${userId}_${Date.now()}.jpg`,
          });
          cloudinaryData.append('upload_preset', 'attendance_upload');

          const cloudinaryResponse = await fetch('https://api.cloudinary.com/v1_1/dopqbv7id/image/upload', {
            method: 'POST',
            body: cloudinaryData,
          });

          const cloudinaryResult = await cloudinaryResponse.json();
          console.log('Cloudinary response:', cloudinaryResult);

          let downloadURL = null;
          if (cloudinaryResult.secure_url) {
            downloadURL = cloudinaryResult.secure_url;
          }

          // Save attendance record to Firestore
          await addDoc(collection(db, 'attendance'), {
            userId: userId,
            photoUrl: downloadURL,
            status: 'Present',
            confidence: confidence,
            timestamp: Timestamp.now(),
            matchedAt: new Date().toISOString()
          });

          Alert.alert(
            'Attendance Marked!', 
            `Welcome! Your attendance has been marked successfully.\n\nUser ID: ${userId}\nConfidence: ${(confidence * 100).toFixed(1)}%`,
            [{ text: 'OK', style: 'default' }]
          );

        } else {
          // Face not recognized
          Alert.alert(
            'Face Not Recognized', 
            'Your face could not be matched with any registered user. Please ensure you are registered in the system or contact your administrator.',
            [
              { text: 'Try Again', style: 'default' },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }

      } catch (error) {
        console.error('Attendance marking error:', error);
        
        let errorMessage = 'An error occurred while marking attendance.';
        
        if (error.message.includes('Face processing error')) {
          errorMessage = 'No face detected in the image. Please ensure your face is clearly visible and try again.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('Face recognition failed')) {
          errorMessage = 'Face recognition service is currently unavailable. Please try again later.';
        }

        Alert.alert('Error', errorMessage);
      } finally {
        setUploading(false);
      }
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
        <Text style={styles.subtitle}>Position your face in the frame</Text>
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
              <Text style={styles.loadingText}>Recognizing face...</Text>
              <Text style={styles.loadingSubText}>Please wait</Text>
            </View>
          )}

          {/* Face Frame Guide */}
          <View style={styles.faceFrameGuide}>
            <View style={styles.faceFrame}>
              <View style={styles.frameCorner} />
              <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
              <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
              <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
            </View>
          </View>
        </CameraView>
      </View>

      <View style={styles.footer}>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Look directly at the camera and ensure your face is clearly visible within the frame
          </Text>
          <Text style={styles.instructionSubText}>
            The system will automatically recognize you from the registered faces
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.captureButton, uploading && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={uploading}
        >
          <Text style={styles.captureButtonText}>
            {uploading ? 'Recognizing Face...' : 'Mark Attendance'}
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
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSubText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.8,
  },
  faceFrameGuide: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    right: '20%',
    bottom: '25%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: '100%',
    height: '80%',
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
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
    marginBottom: 8,
  },
  instructionSubText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  captureButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#4CAF50',
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
