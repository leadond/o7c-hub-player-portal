import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@o7c/shared';
import { AppUser } from '@o7c/shared';
import { Button } from '@o7c/shared';
import { Lock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { sendAdminSignupNotificationEmail, createAdminSignupNotifications } from '@o7c/shared';

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [invitationUser, setInvitationUser] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    setValidating(true);
    try {
      const users = await AppUser.filter({
        invitationCode: token,
        invitationStatus: 'pending'
      });

      if (users && users.length > 0) {
        console.log("Token validated successfully:", {
          token: token,
          user: users[0]
        });
        setInvitationUser(users[0]);
      } else {
        console.log("Token validation failed:", {
          token: token,
          foundUsers: users?.length || 0
        });
        setError('Invalid or expired invitation token.');
      }
    } catch (err) {
      console.error('Error validating token:', err);
      setError('Failed to validate invitation. Please try again.');
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!invitationUser) {
      setError('No valid invitation found.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setRegistering(true);
    try {
      // Create Firebase user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invitationUser.email,
        formData.password
      );

      // Update User record with Firebase UID and status
      const updatedUser = await AppUser.update(invitationUser.id, {
        firebaseUid: userCredential.user.uid,
        status: 'active',
        invitationStatus: 'accepted',
        registeredAt: new Date().toISOString()
      });

      // Send notifications to admins
      try {
        // Get all admin users
        const adminUsers = await AppUser.filter({ role: 'admin', status: 'active' });

        if (adminUsers && adminUsers.length > 0) {
          // Send email notifications to all admins
          const emailPromises = adminUsers.map(admin =>
            sendAdminSignupNotificationEmail({
              newUserEmail: invitationUser.email,
              newUserRole: invitationUser.role,
              adminEmail: admin.email
            })
          );

          // Send in-app notifications to all admins
          const adminIds = adminUsers.map(admin => admin.id);
          await createAdminSignupNotifications({
            newUserEmail: invitationUser.email,
            newUserRole: invitationUser.role,
            newUserId: invitationUser.id,
            adminIds: adminIds
          });

          // Execute email sending (don't wait for completion to avoid blocking)
          Promise.allSettled(emailPromises).then(results => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            console.log(`Admin notification emails: ${successful} sent, ${failed} failed`);
          });
        }
      } catch (notificationError) {
        console.error('Failed to send admin notifications:', notificationError);
        // Don't fail registration if notifications fail
      }

      // Firebase auth state will automatically update, logging the user in
      // Navigation will happen via AuthContext redirect

    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading || validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4" />
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitationUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8"
      >
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Registration</h1>
          <p className="text-gray-600">
            Welcome! You've been invited to join O7C Hub as a <strong>{invitationUser.role}</strong>.
          </p>
          <p className="text-sm text-gray-500 mt-2">Email: {invitationUser.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Enter your password"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Confirm your password"
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={registering}
          >
            {registering ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating Account...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Registration
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By registering, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}