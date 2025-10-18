'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  subscription: {
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
    payhipSubscriptionId: string;
  };
  profile: {
    age?: number;
    height?: number;
    weight?: number;
    fitnessLevel?: string;
    goals?: string[];
  };
  stats: {
    totalWorkouts: number;
    currentStreak: number;
    longestStreak: number;
    lastWorkoutDate: string;
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setError('Failed to load user data');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsUpdating(true);
    setPasswordError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      if (response.ok) {
        setPasswordSuccess('Password updated successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        const data = await response.json();
        setPasswordError(data.message || 'Failed to update password');
      }
    } catch (error) {
      setPasswordError('Network error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubscriptionAction = async (action: string) => {
    if (action === 'cancel') {
      try {
    const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          alert('Subscription cancellation initiated. It will be cancelled at the end of the current billing period.');
          fetchUserData(); // Refresh user data
        } else {
          alert('Failed to cancel subscription');
        }
      } catch (error) {
        alert('Network error');
      }
    } else if (action === 'upgrade' || action === 'downgrade') {
      router.push('/pricing');
    }
  };

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'free': return 'Free Plan';
      case 'foundations': return 'Foundations';
      case 'advanced': return 'Advanced Accelerator';
      case 'custom': return 'Custom Coaching';
      default: return plan;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'inactive': return 'text-gray-500';
      case 'cancelled': return 'text-red-500';
      case 'past_due': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-orange/10 rounded-full blur-3xl"
        />
        </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="flex items-center space-x-2 text-white hover:text-primary-500 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <div></div>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-300/50 backdrop-blur-md rounded-xl p-4 border border-dark-200/50 shadow-xl"
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Info
            </h2>
            
            <div className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Name</label>
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                  {user?.name}
            </div>
          </div>
              
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                  {user?.email}
                </div>
            </div>
              
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm capitalize">
                  {user?.role}
            </div>
              </div>
            </div>
          </motion.div>

          {/* Subscription Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-300/50 backdrop-blur-md rounded-xl p-4 border border-dark-200/50 shadow-xl"
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Subscription
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Current Plan</label>
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                  {getPlanDisplayName(user?.subscription?.plan || 'free')}
          </div>
        </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                <div className={`border rounded-lg px-3 py-2 font-medium text-sm ${getStatusColor(user?.subscription?.status || 'inactive')}`}>
                  {user?.subscription?.status?.toUpperCase() || 'INACTIVE'}
          </div>
        </div>

              {user?.subscription?.endDate && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Next Billing</label>
                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm">
                    {new Date(user.subscription.endDate).toLocaleDateString()}
                  </div>
                </div>
              )}
        </div>

            {/* Subscription Actions */}
            <div className="mt-4 space-y-2">
              {user?.subscription?.status === 'active' && (
                <button
                  onClick={() => handleSubscriptionAction('cancel')}
                  className="w-full bg-red-500/20 border border-red-500/50 text-red-400 py-2 px-3 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                >
                  Cancel Subscription
                </button>
              )}
              
              <button
                onClick={() => handleSubscriptionAction('upgrade')}
                className="w-full bg-gradient-to-r from-primary-500 to-accent-orange text-white font-bold py-2 px-3 rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 text-sm"
              >
                {user?.subscription?.plan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
              </button>
    </div>
          </motion.div>

          {/* Password Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-dark-300/50 backdrop-blur-md rounded-xl p-4 border border-dark-200/50 shadow-xl"
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password
            </h2>
            
            {passwordSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/20 border border-green-500/50 text-green-400 px-3 py-2 rounded-lg mb-3 text-sm"
              >
                {passwordSuccess}
              </motion.div>
            )}

            {!showPasswordForm ? (
              <div className="space-y-3">
                <p className="text-gray-300 text-sm">Keep your account secure with a strong password.</p>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full bg-primary-500/20 border border-primary-500/50 text-primary-400 py-2 px-3 rounded-lg hover:bg-primary-500/30 transition-colors text-sm"
                >
                  Change Password
                </button>
                <Link
                  href="/auth/forgot-password"
                  className="block w-full text-center text-gray-400 hover:text-primary-500 transition-colors text-sm"
                >
                  Forgot Password?
                </Link>
              </div>
            ) : (
              <form onSubmit={handlePasswordUpdate} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 text-sm"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 text-sm"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 text-sm"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>

                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-sm"
                  >
                    {passwordError}
                  </motion.div>
                )}

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 bg-gradient-to-r from-primary-500 to-accent-orange text-white font-bold py-2 px-3 rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 disabled:opacity-50 text-sm"
                  >
                    {isUpdating ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError('');
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </motion.div>

          {/* Account Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-dark-300/50 backdrop-blur-md rounded-xl p-4 border border-dark-200/50 shadow-xl"
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Statistics
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center bg-gray-700/30 rounded-lg p-3">
                <div className="text-xl font-bold text-primary-500">{user?.stats?.totalWorkouts || 0}</div>
                <div className="text-xs text-gray-300">Total Workouts</div>
              </div>
              <div className="text-center bg-gray-700/30 rounded-lg p-3">
                <div className="text-xl font-bold text-accent-orange">{user?.stats?.currentStreak || 0}</div>
                <div className="text-xs text-gray-300">Current Streak</div>
              </div>
              <div className="text-center bg-gray-700/30 rounded-lg p-3">
                <div className="text-xl font-bold text-green-500">{user?.stats?.longestStreak || 0}</div>
                <div className="text-xs text-gray-300">Longest Streak</div>
              </div>
              <div className="text-center bg-gray-700/30 rounded-lg p-3">
                <div className="text-lg font-bold text-blue-500">
                  {user?.stats?.lastWorkoutDate ? new Date(user.stats.lastWorkoutDate).toLocaleDateString() : 'Never'}
                </div>
                <div className="text-xs text-gray-300">Last Workout</div>
              </div>
            </div>
          </motion.div>
        </div>
        </div>
    </div>
  );
}
