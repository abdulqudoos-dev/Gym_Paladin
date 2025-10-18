"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserStats {
  totalWorkouts: number;
  totalDuration: number;
  totalCalories: number;
  totalReps: number;
  totalSets: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  lastWorkoutDate: string;
}

interface RecentSession {
  _id: string;
  week: number;
  day: number;
  status: string;
  completedAt: string;
  caloriesBurned: number;
  totalDuration: number;
  exercisesCompleted: number;
  totalExercises: number;
  programId: {
    _id: string;
    title: string;
  };
}

export default function ProgressPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { 
      router.push('/auth/login'); 
      return; 
    }
    
    const loadData = async () => {
      try {
        // Get user info
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (!meRes.ok) { 
          localStorage.removeItem('token'); 
          router.push('/auth/login'); 
          return; 
        }
        const me = await meRes.json();
        setUser(me.user || me);

        // Get user stats
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.success) {
            setUserStats(statsData.stats);
          }
        }

        // Get recent sessions
        const sessionsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/recent-sessions?limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          if (sessionsData.success) {
            setRecentSessions(sessionsData.sessions);
          }
        }
      } catch (error) {
        console.error('Error loading progress data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [router]);

  const stats = useMemo(() => {
    if (!userStats) {
      return { 
        completed: 0, 
        totalSets: 0, 
        totalCalories: 0, 
        totalDuration: 0,
        currentStreak: 0,
        longestStreak: 0,
        level: 1,
        xp: 0
      };
    }
    
    return {
      completed: userStats.totalWorkouts,
      totalSets: userStats.totalSets,
      totalCalories: userStats.totalCalories,
      totalDuration: userStats.totalDuration,
      currentStreak: userStats.currentStreak,
      longestStreak: userStats.longestStreak,
      level: userStats.level,
      xp: userStats.totalXP
    };
  }, [userStats]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Progress</h1>
          <p className="text-gray-400">Track your fitness journey and achievements</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-300/50 border border-dark-200/50 rounded-2xl p-6">
            <div className="text-primary-400 text-3xl font-bold">{stats.completed}</div>
            <div className="text-white font-semibold">Workouts Completed</div>
            <div className="text-gray-400 text-sm">Total sessions</div>
          </div>
          
          <div className="bg-dark-300/50 border border-dark-200/50 rounded-2xl p-6">
            <div className="text-accent-orange text-3xl font-bold">{stats.totalSets}</div>
            <div className="text-white font-semibold">Total Sets</div>
            <div className="text-gray-400 text-sm">All exercises</div>
          </div>
          
          <div className="bg-dark-300/50 border border-dark-200/50 rounded-2xl p-6">
            <div className="text-green-400 text-3xl font-bold">{stats.totalCalories}</div>
            <div className="text-white font-semibold">Calories Burned</div>
            <div className="text-gray-400 text-sm">Total energy</div>
          </div>
          
          <div className="bg-dark-300/50 border border-dark-200/50 rounded-2xl p-6">
            <div className="text-blue-400 text-3xl font-bold">{Math.floor(stats.totalDuration / 60)}</div>
            <div className="text-white font-semibold">Minutes Trained</div>
            <div className="text-gray-400 text-sm">Total time</div>
          </div>
        </div>

        {/* Streak and Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-dark-300/50 border border-dark-200/50 rounded-2xl p-6">
            <div className="text-white font-semibold mb-4">Streak</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary-400">{stats.currentStreak}</div>
                <div className="text-gray-400 text-sm">Current Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-orange">{stats.longestStreak}</div>
                <div className="text-gray-400 text-sm">Longest Streak</div>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-300/50 border border-dark-200/50 rounded-2xl p-6">
            <div className="text-white font-semibold mb-4">Level & XP</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-400">Level {stats.level}</div>
                <div className="text-gray-400 text-sm">Current Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{stats.xp}</div>
                <div className="text-gray-400 text-sm">Total XP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-dark-300/50 border border-dark-200/50 rounded-2xl p-6">
            <div className="text-white font-semibold mb-4">Recent Workouts</div>
            <div className="space-y-3">
              {recentSessions.length > 0 ? (
                recentSessions.map((session, index) => (
                  <div key={session._id} className="flex items-center justify-between p-3 bg-dark-400/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">{session.programId?.title || `Week ${session.week}, Day ${session.day}`}</div>
                      <div className="text-gray-400 text-sm">
                        {session.exercisesCompleted}/{session.totalExercises} exercises
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-primary-400 text-sm">{session.caloriesBurned} cal</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(session.completedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-4">No recent workouts</div>
              )}
            </div>
          </div>
          
          <div className="bg-dark-300/50 border border-dark-200/50 rounded-2xl p-6">
            <div className="text-white font-semibold mb-4">Quick Actions</div>
            <div className="space-y-3">
              <Link 
                href="/workouts" 
                className="block w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
              >
                Start Workout
              </Link>
              <Link 
                href="/calendar" 
                className="block w-full bg-dark-400 hover:bg-dark-300 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
              >
                View Calendar
              </Link>
              <Link 
                href="/profile" 
                className="block w-full bg-dark-400 hover:bg-dark-300 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}