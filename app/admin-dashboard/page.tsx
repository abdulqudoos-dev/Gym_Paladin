'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface DashboardMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  totalWorkouts: number;
  totalPrograms: number;
  totalExercises: number;
  completedSessions: number;
  activeSessions: number;
  todayCompleted: number;
  thisWeekCompleted: number;
  thisMonthCompleted: number;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalWorkouts: 0,
    totalPrograms: 0,
    totalExercises: 0,
    completedSessions: 0,
    activeSessions: 0,
    todayCompleted: 0,
    thisWeekCompleted: 0,
    thisMonthCompleted: 0
  });
  const [recentCounts, setRecentCounts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentSessions();
    const id = setInterval(fetchRecentSessions, 15000);
    return () => clearInterval(id);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Fetch admin stats
      const adminStatsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch subscription stats
      const subscriptionsStatsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/subscriptions/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (adminStatsResponse.ok && subscriptionsStatsResponse.ok) {
        const adminStats = await adminStatsResponse.json();
        const subscriptionsStats = await subscriptionsStatsResponse.json();

        setMetrics({
          totalUsers: adminStats.stats.totalUsers,
          activeSubscriptions: subscriptionsStats.stats?.active || 0,
          totalWorkouts: adminStats.stats.totalWorkouts,
          totalPrograms: adminStats.stats.totalPrograms,
          totalExercises: adminStats.stats.totalExercises,
          completedSessions: adminStats.stats.completedSessions,
          activeSessions: adminStats.stats.activeSessions,
          todayCompleted: adminStats.stats.todayCompleted,
          thisWeekCompleted: adminStats.stats.thisWeekCompleted,
          thisMonthCompleted: adminStats.stats.thisMonthCompleted
        });

        // Set recent sessions data for the chart
        setRecentCounts(adminStats.stats.recentSessions);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin-stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.stats.recentSessions) {
        setRecentCounts(data.stats.recentSessions);
      }
    } catch {}
  };

  const metricsData = [
    {
      title: 'Total Users',
      value: loading ? '...' : metrics.totalUsers.toLocaleString(),
      change: '+12%',
      trend: 'up',
      icon: 'users',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active Subscriptions',
      value: loading ? '...' : metrics.activeSubscriptions.toLocaleString(),
      change: '+8%',
      trend: 'up',
      icon: 'subscriptions',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Workouts',
      value: loading ? '...' : metrics.totalWorkouts.toLocaleString(),
      change: '+5%',
      trend: 'up',
      icon: 'workouts',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Total Programs',
      value: loading ? '...' : metrics.totalPrograms.toLocaleString(),
      change: '+3%',
      trend: 'up',
      icon: 'programs',
      color: 'from-red-500 to-red-600'
    }
  ];


  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'users':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      case 'subscriptions':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'workouts':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'programs':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'exercise':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'activity':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'clock':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Admin <span className="text-red-500">Dashboard</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Loading dashboard data...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-700 rounded-xl"></div>
                <div className="w-6 h-6 bg-gray-700 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Admin <span className="text-red-500">Dashboard</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Monitor your fitness platform performance and manage all aspects of your business.
        </p>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6"
        >
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <div>
              <p className="text-red-400 font-medium">Error loading dashboard data</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="ml-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-all text-sm"
            >
              Retry
            </button>
          </div>
        </motion.div>
      )}

      {/* Core Metrics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {metricsData.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-500/20 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {getIcon(metric.icon)}
              </div>
              <div className={`flex items-center space-x-1 text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                <span>{metric.change}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">{metric.title}</h3>
              <p className="text-3xl font-bold text-white">{metric.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Subscription Tier Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300"
        >
          <h3 className="text-xl font-bold text-white mb-6">Users by Subscription Tier</h3>
          <div className="space-y-4">
            {[
              { tier: 'Free', count: metrics.totalUsers - metrics.activeSubscriptions, color: 'bg-gray-500', maxWidth: 100 },
              { tier: 'Foundations', count: Math.floor(metrics.activeSubscriptions * 0.6), color: 'bg-blue-500', maxWidth: 80 },
              { tier: 'Advanced', count: Math.floor(metrics.activeSubscriptions * 0.3), color: 'bg-yellow-500', maxWidth: 40 },
              { tier: 'Custom', count: Math.floor(metrics.activeSubscriptions * 0.1), color: 'bg-red-500', maxWidth: 20 }
            ].map((tier, index) => (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{tier.count}</span>
                  <span className="text-gray-400 text-sm">{tier.tier}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tier.maxWidth}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                    className={`h-2 rounded-full ${tier.color}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Total Exercises Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 shadow-lg hover:shadow-red-500/20 group"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              {getIcon('exercise')}
            </div>
            <h4 className="text-white font-bold text-lg">Total Exercises</h4>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{loading ? '...' : metrics.totalExercises.toLocaleString()}</p>
          <p className="text-gray-400 text-sm">Overall count</p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Link href="/workout-planner">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 text-left group w-full"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Create Workout</h3>
            <p className="text-gray-400 text-sm">Design and manage workouts, programs, and exercises</p>
          </motion.button>
        </Link>

        <Link href="/admin-dashboard/users">
          <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 text-left group w-full shadow-lg hover:shadow-red-500/20"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Manage Users</h3>
          <p className="text-gray-400 text-sm">View and manage user accounts</p>
          </motion.button>
        </Link>

        <Link href="/admin-dashboard/reports">
          <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 text-left group w-full shadow-lg hover:shadow-red-500/20"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-lg mb-2">View Reports</h3>
          <p className="text-gray-400 text-sm">Analyze platform performance</p>
          </motion.button>
        </Link>

        <Link href="/admin-dashboard/subscriptions">
          <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 hover:border-red-500/50 transition-all duration-300 text-left group w-full shadow-lg hover:shadow-red-500/20"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Subscriptions</h3>
          <p className="text-gray-400 text-sm">Manage pricing tiers and subscriptions</p>
          </motion.button>
        </Link>
      </motion.div>

    </div>
  );
}
