import { auth } from '../lib/firebase';

// Firebase auth operations
export const me = async () => {
  const user = auth.currentUser;
  if (user) {
    return {
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      // Add other user properties as needed
    };
  }
  return null;
};

export const isAuthenticated = () => {
  return !!auth.currentUser;
};