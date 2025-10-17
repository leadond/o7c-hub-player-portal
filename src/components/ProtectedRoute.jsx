import { useState } from 'react';
import { useAuth } from '@o7c/shared';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userData, loading, userDataLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Debug logging
  console.log('ProtectedRoute - Player Portal:', { 
    user: !!user, 
    userData: !!userData, 
    userRole: userData?.role,
    loading, 
    userDataLoading,
    port: window.location.port
  });

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      await login(email, password);
      // Login successful - AuthContext will handle the state update
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Invalid email or password.');
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
              Sign in to Player Portal
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              For players and parents
            </p>
          </div>
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {loginError}
                </div>
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
                {loginLoading ? 'Signing In...' : 'Sign In'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => window.location.href = 'http://localhost:3000'}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Go to O7C Hub instead
                </button>
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
    window.location.href = 'http://localhost:3000';
    return null;
  }

  // Check specific role requirements if specified
  if (allowedRoles.length > 0 && userData && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;