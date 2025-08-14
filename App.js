import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import TabNavigator from './navigation/TabNavigator';
import SuperAdminTabNavigator from './navigation/SuperAdminTabNavigator';
import AdminTabNavigator from './navigation/AdminTabNavigator';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import FaceRegisterScreen from './screens/FaceRegisterScreen';
import AttendanceScreen from './screens/AttendanceScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, userRole, isApproved, isAdminApproved } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          {userRole === 'superadmin' ? (
            <Stack.Screen name="SuperAdminMain" component={SuperAdminTabNavigator} />
          ) : userRole === 'admin' && isApproved && isAdminApproved ? (
            <Stack.Screen name="AdminMain" component={AdminTabNavigator} />
          ) : userRole === 'employee' && isApproved ? (
            <Stack.Screen name="Main" component={TabNavigator} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
          {/* Add the FaceRegister screen here so it's accessible from any authenticated state */}
          <Stack.Screen name="FaceRegister" component={FaceRegisterScreen} />
          <Stack.Screen name="AttendanceScreen" component={AttendanceScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}