'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import CountUpAnimation from '@/components/CountUpAnimation';

interface WorkoutSummary {
  _id: string;
  sessionId: string;
  workoutId: {
    _id: string;
    title: string;
    description: string;
    difficulty: string;
  };
  totalDuration: number;
  caloriesBurned: number;
  exercisesCompleted: number;
  totalExercises: number;
  totalReps: number;
  totalSets: number;
  completedAt: string;
  achievements: string[];
  personalRecords: Array<{
    exerciseId: string;
    recordType: string;
    value: number;
    previousValue: number;
  }>;
}

interface UserStats {
  currentStreak: number;
  totalXP: number;
  level: number;
  xpEarned: number;
}

export default function WorkoutSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;
  
  const [session, setSession] = useState<WorkoutSummary | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (!sessionId) {
      router.push('/workouts');
      return;
    }

    fetchSummary();
  }, [sessionId, router]);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Try to fetch as program session first
      let sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/program-sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let sessionData;
      if (sessionResponse.ok) {
        sessionData = await sessionResponse.json();
        if (sessionData.success) {
          // Convert program session to workout summary format
          const programSession = sessionData.session;
          const workoutSummary = {
            _id: programSession._id,
            sessionId: programSession.sessionId,
            workoutId: {
              _id: programSession.programId?._id || programSession._id,
              title: `Week ${programSession.week}, Day ${programSession.day} Workout`,
              description: programSession.programId?.title || 'Program Workout',
              difficulty: 'Intermediate'
            },
            totalDuration: programSession.totalDuration || 0,
            caloriesBurned: programSession.caloriesBurned || 0,
            exercisesCompleted: programSession.exercisesCompleted || 0,
            totalExercises: programSession.totalExercises || 0,
            totalReps: 0, // Calculate from exercises if needed
            totalSets: programSession.exercises?.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0) || 0,
            completedAt: programSession.completedAt || new Date().toISOString(),
            achievements: [],
            personalRecords: []
          };
          setSession(workoutSummary);
        }
      } else {
        // If not a program session, try workout session
        sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workout-sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch session');
        }

        sessionData = await sessionResponse.json();
        if (sessionData.success) {
          setSession(sessionData.session);
        }
      }

      // Fetch user stats
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setUserStats(statsData.stats);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-gray-400 mb-6">{error || 'Session not found'}</p>
          <button
            onClick={() => router.push('/workouts')}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Back to Workouts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300">
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {/* Celebration Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">Workout Complete!</h1>
          <p className="text-xl text-gray-400">Great job on finishing "{session.workoutId.title}"</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Duration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {formatTime(session.totalDuration)}
              </div>
              <div className="text-sm text-gray-400">Total Duration</div>
            </div>
          </motion.div>

          {/* Calories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-6 border border-orange-500/30"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                <CountUpAnimation end={session.caloriesBurned} duration={2000} />
              </div>
              <div className="text-sm text-gray-400">Calories Burned</div>
            </div>
          </motion.div>

          {/* Exercises */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-500/30"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                <CountUpAnimation end={session.exercisesCompleted} duration={1500} />
              </div>
              <div className="text-sm text-gray-400">Exercises Completed</div>
            </div>
          </motion.div>

          {/* Sets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                <CountUpAnimation end={session.totalSets} duration={1800} />
              </div>
              <div className="text-sm text-gray-400">Total Sets</div>
            </div>
          </motion.div>
        </div>

        {/* XP and Streak */}
        {userStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-br from-dark-300/80 to-dark-400/80 backdrop-blur-md rounded-2xl p-6 border border-dark-200/50 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-2">
                  +<CountUpAnimation end={userStats.xpEarned || 50} duration={2000} /> XP
                </div>
                <div className="text-sm text-gray-400">Experience Earned</div>
                <div className="text-xs text-gray-500 mt-1">
                  Level {userStats.level} • {userStats.totalXP} total XP
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  <CountUpAnimation end={userStats.currentStreak} duration={1500} />
                </div>
                <div className="text-sm text-gray-400">Day Streak</div>
                <div className="text-xs text-gray-500 mt-1">Keep it up!</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Achievements */}
        {session.achievements && session.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30 mb-8"
          >
            <h3 className="text-xl font-bold text-yellow-400 mb-4">🏆 Achievements Unlocked!</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <span className="text-yellow-400">🏅</span>
                  </div>
                  <span className="text-white">{achievement}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Personal Records */}
        {session.personalRecords && session.personalRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-2xl p-6 border border-red-500/30 mb-8"
          >
            <h3 className="text-xl font-bold text-red-400 mb-4">🔥 Personal Records!</h3>
            <div className="space-y-3">
              {session.personalRecords.map((record, index) => (
                <div key={index} className="flex items-center justify-between bg-dark-400/30 rounded-lg p-3">
                  <span className="text-white">{record.recordType}</span>
                  <div className="text-right">
                    <div className="text-red-400 font-bold">{record.value}</div>
                    <div className="text-xs text-gray-500">Previous: {record.previousValue}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/workouts"
            className="bg-gradient-to-r from-primary-500 to-accent-orange text-white font-bold py-4 px-8 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all text-center"
          >
            Start Another Workout
          </Link>
          <Link
            href="/dashboard"
            className="bg-dark-400/50 hover:bg-dark-300/50 text-white font-medium py-4 px-8 rounded-xl transition-all text-center"
          >
            Back to Dashboard
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
