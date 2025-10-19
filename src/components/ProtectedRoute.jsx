import { useState } from 'react';
import { useAuth } from '@o7c/shared';
import { Navigate } from 'react-router-dom';
import { getUrl } from '@o7c/shared/utils/envConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@o7c/shared';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userData, loading, userDataLoading, login } = useAuth();
  
  const [isSignup, setIsSignup] = useState(false);
  
  // Temporary signup function with simplified workflow
  const handleSignup = async (email, password, firstName, lastName, role) => {
    try {
      console.log('Starting signup process for:', email);
      
      if (!auth) {
        throw new Error('Firebase authentication is not available.');
      }
      
      // Step 1: Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (user) {
        // Step 2: Update display name
        await updateProfile(user, {
          displayName: `${firstName} ${lastName}`
        });
        
        // Step 3: Create user data
        // In a full implementation, this would check the database for existing players
        // and handle the matching workflow
        const newUserData = {
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: role,
          firebaseUid: user.uid,
          status: 'pending' // Would be 'approved' if email matches existing player
        };
        
        console.log('Created new user:', newUserData);
        console.log('🎉 Signup successful! User will be authenticated automatically.');
        
        return { user, userData: newUserData };
      }
      
      return { user: null, userData: null };
    } catch (error) {
      console.error('Signup error:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please choose a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else {
        throw new Error(error.message || 'Failed to create account. Please try again.');
      }
    }
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('player');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Production logging (minimal)
  if (process.env.NODE_ENV === 'development') {
    console.log('ProtectedRoute - Player Portal:', { 
      user: !!user, 
      userData: !!userData, 
      userRole: userData?.role,
      loading, 
      userDataLoading
    });
  }

  // Show loading spinner while checking authentication
  if (loading || userDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Player Portal...</p>
          <p className="text-sm text-gray-400 mt-2">
            Auth: {loading ? 'Loading...' : 'Ready'} | 
            Data: {userDataLoading ? 'Loading...' : 'Ready'}
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      if (isSignup) {
        const result = await handleSignup(email, password, firstName, lastName, role);
        console.log('Signup completed:', result);
        
        // Manually set user state since we're bypassing AuthContext signup
        // In a real implementation, this would be handled by the AuthContext
        if (result.user && result.userData) {
          // The user will be automatically picked up by the AuthContext onAuthStateChanged
          console.log('Signup successful - user will be authenticated automatically');
        }
      } else {
        await login(email, password);
      }
      // Success - AuthContext will handle the state update
    } catch (error) {
      console.error(isSignup ? 'Signup error:' : 'Login error:', error);
      setLoginError(error.message || (isSignup ? 'Signup failed.' : 'Invalid email or password.'));
    } finally {
      setLoginLoading(false);
    }
  };

  // Show login form if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {isSignup ? 'Create Player Portal Account' : 'Sign in to Player Portal'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              For players and parents
            </p>
          </div>
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {loginError}
                </div>
              )}
              
              {isSignup && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="First name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">I am a</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="player">Player</option>
                      <option value="parent">Parent</option>
                    </select>
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loginLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loginLoading ? (isSignup ? 'Creating Account...' : 'Signing In...') : (isSignup ? 'Create Account' : 'Sign In')}
              </button>
              
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                </button>
                
                <div>
                  <button
                    type="button"
                    onClick={() => window.location.href = getUrl('o7cHubUrl')}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Go to O7C Hub instead
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has required role for Player Portal
  const allowedPlayerPortalRoles = ['player', 'parent'];
  const hasAccess = userData && allowedPlayerPortalRoles.includes(userData.role);

  if (!hasAccess) {
    // Redirect coaches/admins to O7C Hub
    window.location.href = getUrl('o7cHubUrl');
    return null;
  }

  // Check specific role requirements if specified
  if (allowedRoles.length > 0 && userData && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;