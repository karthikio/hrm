import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AdminDashboard from '../screens/AdminDashboard';
import AdminProfile from '../screens/AdminProfile';
import AttendanceScreen from '../screens/AttendanceScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
    </Stack.Navigator>
  );
}

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'grid-outline';
          else if (route.name === 'AdminProfile') iconName = 'person-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
          paddingTop: 5,
          paddingBottom: 5,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminStackNavigator}
        options={{ title: 'Dashboard' }}
      />

      <Tab.Screen 
        name="AdminProfile" 
        component={AdminProfile}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}