"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Fetch user data and stats
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
          router.push('/auth/login');
          return;
        }

        // Fetch user stats
        const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        localStorage.removeItem('token');
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
        setStatsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Track your fitness journey, manage your workouts, and achieve your goals with personalized programs.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-dark-300/50 backdrop-blur-md rounded-2xl p-6 border border-dark-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Workouts</p>
                <p className="text-3xl font-bold text-white">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-600 h-8 w-16 rounded"></div>
                  ) : (
                    stats?.totalWorkouts || 0
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-dark-300/50 backdrop-blur-md rounded-2xl p-6 border border-dark-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Current Streak</p>
                <p className="text-3xl font-bold text-white">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-600 h-8 w-16 rounded"></div>
                  ) : (
                    `${stats?.currentStreak || 0} days`
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent-orange/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-dark-300/50 backdrop-blur-md rounded-2xl p-6 border border-dark-200/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Duration</p>
                <p className="text-3xl font-bold text-white">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-600 h-8 w-16 rounded"></div>
                  ) : (
                    `${Math.floor((stats?.totalDuration || 0) / 60)}h`
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overview widgets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Subscription status */}
          <div className="bg-dark-300/50 backdrop-blur-md rounded-2xl p-6 border border-dark-200/50 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Subscription</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-primary-500/20 text-primary-400 capitalize">{user?.subscription?.plan || 'free'}</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">Manage your plan and billing.</p>
            <div className="flex gap-3">
              <Link href="/pricing" className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-orange text-white font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all">Upgrade</Link>
              <Link href="/profile" className="px-4 py-2 rounded-lg bg-dark-400/50 text-gray-200 border border-dark-200 hover:border-primary-500/40 transition-colors">Manage</Link>
            </div>
          </div>

          {/* Next workout suggestion */}
          <div className="bg-dark-300/50 backdrop-blur-md rounded-2xl p-6 border border-dark-200/50 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Next Workout</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-accent-orange/20 text-accent-orange">
                {user?.assignedProgram ? 'Assigned' : 'Recommended'}
              </span>
            </div>
            {user?.assignedProgram ? (
              <>
                <p className="text-white font-medium mb-1">{user.assignedProgram.title || 'Your Program'}</p>
                <p className="text-gray-400 text-sm mb-4">
                  {user.assignedProgram.duration ? `${user.assignedProgram.duration} weeks` : 'Ongoing'} • 
                  {user.assignedProgram.difficulty || 'All Levels'}
                </p>
                <Link href="/workouts" className="inline-flex items-center text-primary-400 hover:text-primary-300 text-sm">Start Workout →</Link>
              </>
            ) : (
              <>
                <p className="text-white font-medium mb-1">No Program Assigned</p>
                <p className="text-gray-400 text-sm mb-4">Contact admin to get started</p>
                <Link href="/pricing" className="inline-flex items-center text-primary-400 hover:text-primary-300 text-sm">View Plans →</Link>
              </>
            )}
          </div>

          {/* Weekly activity mini-chart */}
          <div className="bg-dark-300/50 backdrop-blur-md rounded-2xl p-6 border border-dark-200/50 lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">This Week</h3>
              <span className="text-gray-400 text-sm">Activity</span>
            </div>
            <div className="h-24 flex items-end gap-2">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => {
                // Get workout count for each day of the week
                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay() + i);
                const dayStr = startOfWeek.toISOString().split('T')[0];
                
                // This would ideally come from stats, but for now we'll show a simple pattern
                const workoutCount = stats?.weeklyActivity?.[dayStr] || 0;
                const height = Math.min(100, Math.max(10, workoutCount * 20));
                
                return (
                  <div key={d} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full rounded-t transition-all duration-300 ${
                        workoutCount > 0 ? 'bg-primary-500' : 'bg-gray-600'
                      }`} 
                      style={{ height: `${height}%` }} 
                    />
                    <span className="text-[10px] text-gray-500 mt-1">{d}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-3">
              <Link href="/calendar" className="inline-flex items-center text-primary-400 hover:text-primary-300 text-sm">View Calendar →</Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
