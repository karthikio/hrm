import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdminApproved, setIsAdminApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Check if it's super admin
        const superAdminEmails = ['admin@gmail.com', 'superadmin@gmail.com'];
        if (superAdminEmails.includes(firebaseUser.email.toLowerCase())) {
          setUserRole('superadmin');
          setIsApproved(true);
          setIsAdminApproved(false);
        } else {
          // Check user role in Firestore
          try {
            const usersQuery = query(
              collection(db, 'users'),
              where('uid', '==', firebaseUser.uid)
            );
            const querySnapshot = await getDocs(usersQuery);
            
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              setUserRole(userData.type || 'employee');
              setIsApproved(userData.action || false);
              setIsAdminApproved(userData.adminAccessApproved || false);
            } else {
              setUserRole('employee');
              setIsApproved(false);
              setIsAdminApproved(false);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setUserRole('employee');
            setIsApproved(false);
            setIsAdminApproved(false);
          }
        }
      } else {
        setUser(null);
        setUserRole(null);
        setIsApproved(false);
        setIsAdminApproved(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userRole,
    isApproved,
    isAdminApproved,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
