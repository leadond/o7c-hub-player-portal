import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { filter as filterUsers, update as updateUser } from '../api/entities/AppUser';
import { shouldRedirectUser, getRedirectUrl } from '../utils/routing';
import type { AuthContextType, User, UserData } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(false);

  const fetchUserData = async (firebaseUid: string) => {
    try {
      setUserDataLoading(true);
      
      // Skip API calls if Firebase client is not available
      if (!firebaseUid) {
        console.warn('No Firebase UID provided for user data fetch');
        setUserData(null);
        return null;
      }

      const users = await filterUsers({ firebaseUid });

      if (users && users.length > 0) {
        setUserData(users[0]);
        return users[0];
      } else {
        // Check if this is an admin email that needs userData created
        const adminEmails = ['leadond@gmail.com', 'kleadon11@gmail.com'];
        if (user && adminEmails.includes(user.email)) {
          const emailUsers = await filterUsers({ email: user.email });

          if (emailUsers && emailUsers.length > 0) {
            const adminUser = emailUsers[0];
            // Update the user record with firebaseUid
            await updateUser(adminUser.id, { firebaseUid });
            setUserData({ ...adminUser, firebaseUid });
            return { ...adminUser, firebaseUid };
          } else {
            setUserData(null);
            return null;
          }
        } else {
          setUserData(null);
          return null;
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Set mock user data for development if API fails
      if (process.env.NODE_ENV === 'development') {
        const port = window.location.port;
        const role = port === '3001' ? 'player' : 'admin';
        const mockUserData = {
          id: firebaseUid,
          role,
          status: 'approved',
          email: user?.email || (port === '3001' ? 'player@example.com' : 'admin@example.com'),
          name: port === '3001' ? 'Development Player' : 'Development Admin'
        };
        setUserData(mockUserData as any);
        return mockUserData;
      }
      setUserData(null);
      return null;
    } finally {
      setUserDataLoading(false);
    }
  };

  useEffect(() => {
    // If Firebase auth is not available, show error and set loading to false
    if (!auth) {
      console.error('Firebase auth not available. Please check your Firebase configuration.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserData(user.uid);
        // Check if user should be redirected to appropriate app
        const userData = await fetchUserData(user.uid);
        // Disable redirects in development mode to allow testing both apps
        if (process.env.NODE_ENV !== 'development' && userData && shouldRedirectUser(userData.role)) {
          const redirectUrl = getRedirectUrl(userData.role);
          // Only redirect if we're not already on the correct app
          if (window.location.href !== redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    // Fallback: set loading to false after 5 seconds if onAuthStateChanged doesn't fire
    const timeout = setTimeout(() => {
      console.warn('Auth initialization timeout. Check Firebase configuration.');
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase authentication is not available. Please check your Firebase configuration.');
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        const refreshedUserData = await fetchUserData(user.uid);
        return { user, userData: refreshedUserData };
      }
      return { user: null, userData: null };
    } catch (error) {
      console.error('Firebase login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      console.warn('Firebase auth not available. Clearing mock session.');
      setUser(null);
      setUserData(null);
      return;
    }
    await signOut(auth);
  };

  const adminEmails = ['leadond@gmail.com', 'kleadon11@gmail.com'];
  const isAdminEmail = user ? adminEmails.includes(user.email) : false;

  const isAuthorized = userData
    ? (userData.status === 'approved' && !!userData.role) || (userData.status !== 'pending' && !!userData.role)
    : isAdminEmail; // Allow admin emails even without userData

  const value = {
    user,
    loading,
    userData,
    userDataLoading,
    isAuthorized,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && !userDataLoading && children}
    </AuthContext.Provider>
  );
};