import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import SuperAdminDashboard from '../screens/SuperAdminDashboard';
import AddEmployee from '../screens/AddEmployee';
import FaceRegisterScreen from '../screens/FaceRegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Create a stack navigator for the Dashboard tab that includes AddEmployee and FaceRegister
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboard} />
      <Stack.Screen name="AddEmployee" component={AddEmployee} />
      <Stack.Screen name="FaceRegister" component={FaceRegisterScreen} />
    </Stack.Navigator>
  );
}

// Your main SuperAdmin Tab Navigator
export default function SuperAdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          }
          // Add other tab icons as needed

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      {/* Add other tabs as needed */}
    </Tab.Navigator>
  );
}