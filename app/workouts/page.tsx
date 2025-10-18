'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useProgress } from '@/contexts/ProgressContext';

interface WorkoutItem {
  _id: string;
  title: string;
  description?: string;
  difficulty?: string;
  exercises?: Array<any>;
  assignedTo?: {
    tiers?: string[];
    users?: string[];
  };
  createdAt?: string;
}

interface Program {
  _id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  days: Array<{
    week: number;
    day: number;
    workouts: Array<{
      workoutId: WorkoutItem;
      order: number;
    }>;
  }>;
}

export default function WorkoutsPage() {
  const router = useRouter();
  const { progress, refreshProgress, isLoading: progressLoading } = useProgress();
  const [user, setUser] = useState<any>(null);
  const [assignedProgram, setAssignedProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Get user with assigned program
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) throw new Error('Unauthorized');
        const meData = await meRes.json();
        const currentUser = meData.user || meData; // support both shapes
        setUser(currentUser);

        // Get assigned program using the new endpoint
        try {
          const userId = currentUser._id || currentUser.id; // support _id or id
          const programRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}/program`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (programRes.ok) {
            const programData = await programRes.json();
            if (programData.success && programData.program) {
              setAssignedProgram(programData.program);
              // Load completion status after program is loaded
              await refreshProgress(programData.program._id);
            } else {
              console.log('No program assigned to user');
            }
          }
        } catch (err) {
          console.error('Failed to fetch assigned program:', err);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Refresh progress when page becomes visible (user returns from workout)
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (!document.hidden && assignedProgram?._id) {
        // Debounce the refresh to avoid too many API calls
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          console.log('Page became visible, refreshing progress...');
          if (assignedProgram?._id) {
            refreshProgress(assignedProgram._id);
          }
        }, 1000); // Wait 1 second before refreshing
      }
    };

    // Listen for workout progress updates from workout session page
    const handleWorkoutProgressUpdate = (event: CustomEvent) => {
      console.log('Workout progress updated:', event.detail);
      // Refresh progress when workout is updated
      if (assignedProgram?._id) {
        refreshProgress(assignedProgram._id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('workoutProgressUpdated', handleWorkoutProgressUpdate as EventListener);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('workoutProgressUpdated', handleWorkoutProgressUpdate as EventListener);
      clearTimeout(refreshTimeout);
    };
  }, [assignedProgram?._id, refreshProgress]);

  // Refresh completion status when currentWeek changes
  useEffect(() => {
    if (assignedProgram?._id) {
      // Debounce week changes to avoid too many API calls
      const timeoutId = setTimeout(() => {
        refreshProgress(assignedProgram._id);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentWeek, assignedProgram?._id, refreshProgress]);

  const startProgram = async (week: number, day: number, workoutIndex: number = 0) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!assignedProgram?._id) {
        setError('No program assigned to your account. Please contact admin.');
        return;
      }

      // Start program session
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/program-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          programId: assignedProgram._id,
          week: week,
          day: day,
          workoutIndex: workoutIndex
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start program session');
      }

      const data = await response.json();
      if (data.success) {
        // Refresh completion status after starting workout
        await refreshProgress(assignedProgram._id);
        router.push(`/program-session/${data.session._id}`);
      }
    } catch (err: any) {
      console.error('Start program error:', err);
      setError(err.message);
    }
  };

  const getCurrentDayWorkouts = () => {
    if (!assignedProgram?.days) return [];
    
    const dayData = assignedProgram.days.find(d => d.week === currentWeek && d.day === currentDay);
    return dayData?.workouts || [];
  };

  const getProgramWorkouts = () => {
    if (!assignedProgram?.days) return [];
    
    // Get all workouts from all days
    const allWorkouts = [];
    assignedProgram.days.forEach(day => {
      day.workouts.forEach(workout => {
        allWorkouts.push({
          ...workout.workoutId,
          week: day.week,
          day: day.day,
          order: workout.order
        });
      });
    });
    
    return allWorkouts;
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Program</h1>
          <p className="text-gray-400">Your assigned workout program</p>
        </motion.div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
        )}

        {!assignedProgram ? (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-6 py-4 rounded-lg text-center">
            <h3 className="text-lg font-semibold mb-2">No Program Assigned</h3>
            <p>Please contact an administrator to assign a workout program to your account.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Program Overview */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-dark-300/80 to-dark-400/80 backdrop-blur-md rounded-3xl p-8 border border-dark-200/50"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{assignedProgram.title}</h2>
                  <p className="text-gray-400">{assignedProgram.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Duration</div>
                  <div className="text-xl font-bold text-primary-400">{assignedProgram.duration} weeks</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{assignedProgram.days?.length || 0}</div>
                    <div className="text-sm text-gray-400">Total Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{getProgramWorkouts().length}</div>
                    <div className="text-sm text-gray-400">Total Workouts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white capitalize">{assignedProgram.difficulty}</div>
                    <div className="text-sm text-gray-400">Difficulty</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => startProgram(currentWeek, currentDay)}
                  className="bg-gradient-to-r from-primary-500 to-accent-orange text-white font-bold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all text-lg"
                >
                  Start Today&apos;s Workout
                </button>
              </div>
            </motion.div>

            {/* Workout Program - Organized by Days */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-2xl font-bold text-white">Workout Program</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (user?.assignedProgram) {
                        refreshProgress(user.assignedProgram);
                      }
                    }}
                    disabled={progressLoading}
                    className="px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-xl text-primary-400 hover:text-primary-300 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <span className={progressLoading ? 'animate-spin' : ''}>🔄</span>
                    <span>{progressLoading ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Week</label>
                    <select
                      value={currentWeek}
                      onChange={(e) => setCurrentWeek(parseInt(e.target.value))}
                      className="px-4 py-2 bg-dark-400/50 border border-dark-200 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {Array.from({ length: assignedProgram.duration }, (_, i) => i + 1).map(week => (
                        <option key={week} value={week}>Week {week}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Program Progress Summary */}
              <div className="bg-gradient-to-br from-primary-500/20 to-accent-orange/20 rounded-2xl p-6 border border-primary-500/30 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-white">Week {currentWeek} Progress</h4>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-400">
                      {(() => {
                        const weekDays = assignedProgram.days.filter(day => day.week === currentWeek);
                        const weekCompletionStatus = weekDays.flatMap(day => 
                          day.workouts.map((_, workoutIndex) => {
                            const statusKey = `${day.week}-${day.day}-${workoutIndex}`;
                            return progress[statusKey] || { status: 'not-started', percentage: 0 };
                          })
                        );
                        return weekCompletionStatus.length > 0 
                          ? Math.round(weekCompletionStatus.reduce((sum, status) => {
                              // If completed, count as 100%, otherwise use actual percentage
                              const workoutProgress = status.status === 'completed' ? 100 : status.percentage;
                              return sum + workoutProgress;
                            }, 0) / weekCompletionStatus.length)
                          : 0;
                      })()}%
                    </div>
                    <div className="text-sm text-gray-400">Overall Progress</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {(() => {
                        const weekDays = assignedProgram.days.filter(day => day.week === currentWeek);
                        const completedWorkouts = weekDays.flatMap(day => 
                          day.workouts.map((_, workoutIndex) => {
                            const statusKey = `${day.week}-${day.day}-${workoutIndex}`;
                            return progress[statusKey]?.status === 'completed' ? 1 : 0;
                          })
                        ).reduce((sum, count) => sum + count, 0);
                        return completedWorkouts;
                      })()}
                    </div>
                    <div className="text-sm text-gray-400">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {(() => {
                        const weekDays = assignedProgram.days.filter(day => day.week === currentWeek);
                        return weekDays.reduce((sum, day) => sum + day.workouts.length, 0);
                      })()}
                    </div>
                    <div className="text-sm text-gray-400">Total Workouts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {assignedProgram.days.filter(day => day.week === currentWeek).length}
                    </div>
                    <div className="text-sm text-gray-400">Days</div>
                  </div>
                </div>
              </div>

              {/* Horizontal Scrollable Days */}
              <div className="space-y-6">
                {assignedProgram.days
                  .filter(day => day.week === currentWeek)
                  .map((day) => {
                    const dayWorkouts = day.workouts;
                    const dayCompletionStatus = dayWorkouts.map((_, workoutIndex) => {
                      const statusKey = `${day.week}-${day.day}-${workoutIndex}`;
                      return progress[statusKey] || { status: 'not-started', percentage: 0 };
                    });
                    
                    // Calculate day progress - if any workout is completed, count it as 100%
                    const dayProgress = dayCompletionStatus.length > 0 
                      ? Math.round(dayCompletionStatus.reduce((sum, status) => {
                          // If completed, count as 100%, otherwise use actual percentage
                          const workoutProgress = status.status === 'completed' ? 100 : status.percentage;
                          return sum + workoutProgress;
                        }, 0) / dayCompletionStatus.length)
                      : 0;
                    
                    const completedWorkouts = dayCompletionStatus.filter(status => status.status === 'completed').length;
                    const totalWorkouts = dayWorkouts.length;
                    
                    return (
                      <motion.div
                        key={`${day.week}-${day.day}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-br from-dark-300/80 to-dark-400/80 backdrop-blur-md rounded-2xl p-6 border border-dark-200/50 hover:border-primary-500/30 transition-all"
                      >
                        {/* Day Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-orange rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-lg font-bold text-white">D{day.day}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xl font-bold text-white">Day {day.day}</h4>
                              <p className="text-sm text-gray-400">
                                {completedWorkouts} of {totalWorkouts} workouts completed
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-center sm:text-right">
                            <div className="text-2xl font-bold text-primary-400">{dayProgress}%</div>
                            <div className="text-sm text-gray-400">Progress</div>
                          </div>
                        </div>

                        {/* Day Progress Bar */}
                        <div className="w-full bg-dark-400/30 rounded-full h-3 mb-6">
                          <motion.div
                            className="bg-gradient-to-r from-primary-500 to-accent-orange h-3 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${dayProgress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>

                        {/* Horizontal Workout Cards */}
                        <div className="relative">
                          <div className="overflow-x-auto pb-4 -mx-2 px-2 scrollbar-hide">
                            <div className="flex space-x-4 min-w-max">
                            {dayWorkouts.map((workout, workoutIndex) => {
                              const statusKey = `${day.week}-${day.day}-${workoutIndex}`;
                              const rawStatus = progress[statusKey] || { status: 'not-started', percentage: 0 };
                              
                              // Fix progress calculation - ensure consistency
                              const status = {
                                ...rawStatus,
                                percentage: rawStatus.status === 'completed' ? 100 : 
                                          rawStatus.status === 'cancelled' ? rawStatus.percentage :
                                          Math.max(0, Math.min(100, rawStatus.percentage || 0))
                              };
                              
                              // Debug logging for progress tracking
                              console.log(`Workout ${statusKey}: ${rawStatus.status} -> ${status.percentage}% (${(rawStatus as any).exercisesCompleted || 0}/${(rawStatus as any).totalExercises || 0})`);
                              
                              return (
                                <motion.div
                                  key={`${day.week}-${day.day}-${workoutIndex}`}
                                  whileHover={{ scale: 1.05, y: -5 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="bg-gradient-to-br from-dark-400/50 to-dark-500/50 backdrop-blur-md rounded-xl p-4 sm:p-5 min-w-[260px] sm:min-w-[280px] max-w-[300px] sm:max-w-[320px] cursor-pointer hover:shadow-lg hover:shadow-primary-500/20 transition-all border border-dark-300/30 hover:border-primary-500/50 active:scale-95 touch-manipulation"
                                  onClick={() => startProgram(day.week, day.day, workoutIndex)}
                                >
                                  {/* Workout Header */}
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                      <h5 className="text-lg font-bold text-white mb-1 line-clamp-1">
                                        {workout.workoutId?.title}
                                      </h5>
                                      <p className="text-sm text-gray-400 line-clamp-2">
                                        {workout.workoutId?.description || 'Complete your workout session'}
                                      </p>
                                    </div>
                                    <div className="ml-3">
                                      <div className={`w-3 h-3 rounded-full ${
                                        status.status === 'completed' 
                                          ? 'bg-green-500' 
                                          : status.status === 'in-progress'
                                          ? 'bg-blue-500'
                                          : status.status === 'cancelled'
                                          ? 'bg-red-500'
                                          : 'bg-gray-500'
                                      }`} />
                                    </div>
                                  </div>

                                  {/* Workout Stats */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                                    <div className="flex items-center space-x-4">
                                      <div className="flex items-center space-x-1 text-sm text-gray-400">
                                        <span className="text-primary-400">🏋️</span>
                                        <span>{workout.workoutId?.exercises?.length || 0} exercises</span>
                                      </div>
                                      <div className="flex items-center space-x-1 text-sm text-gray-400">
                                        <span className="text-orange-400">⏱️</span>
                                        <span>{(workout.workoutId as any)?.duration || 30} min</span>
                                      </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
                                      workout.workoutId?.difficulty === 'Beginner' 
                                        ? 'bg-green-500/20 text-green-400'
                                        : workout.workoutId?.difficulty === 'Intermediate'
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}>
                                      {workout.workoutId?.difficulty || 'Beginner'}
                                    </div>
                                  </div>

                                  {/* Progress Section */}
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-400">Progress</span>
                                      <span className="font-semibold text-white">{status.percentage}%</span>
                                    </div>
                                    
                                    <div className="w-full bg-dark-500/30 rounded-full h-2">
                                      <motion.div
                                        className={`h-2 rounded-full ${
                                          status.status === 'completed' 
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                            : status.status === 'in-progress'
                                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                                            : status.status === 'cancelled'
                                            ? 'bg-gradient-to-r from-red-500 to-pink-500'
                                            : 'bg-gradient-to-r from-gray-500 to-gray-600'
                                        }`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${status.percentage}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                      />
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>
                                        {status.status === 'completed' 
                                          ? '✅ Completed' 
                                          : status.status === 'in-progress'
                                          ? '🔄 In Progress'
                                          : status.status === 'cancelled'
                                          ? '❌ Cancelled'
                                          : '⏳ Not Started'
                                        }
                                      </span>
                                      <span>Click to {status.status === 'completed' ? 'restart' : 'start'}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                            </div>
                          </div>
                          
                          {/* Scroll indicator */}
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-dark-300/80 to-transparent w-8 h-12 flex items-center justify-center pointer-events-none">
                            <div className="text-gray-400 text-xs">→</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
              
              {/* Current Day Workouts - Keep for backward compatibility */}
              <div className="mt-8">
                <h4 className="text-lg font-semibold text-white mb-4">Today&apos;s Workout (Week {currentWeek}, Day {currentDay})</h4>
                <div className="space-y-4">
                  {getCurrentDayWorkouts().map((workout, index) => (
                    <div key={index} className="bg-dark-400/30 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-white mb-2">{workout.workoutId?.title}</h4>
                          <p className="text-gray-400 mb-3">{workout.workoutId?.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{workout.workoutId?.exercises?.length || 0} exercises</span>
                            <span className="px-2 py-1 rounded-full bg-primary-500/20 text-primary-400 capitalize">
                              {workout.workoutId?.difficulty || 'Beginner'}
                            </span>
                            <span>{(workout.workoutId as any)?.duration || 30} min</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => startProgram(currentWeek, currentDay, index)}
                          className="bg-gradient-to-r from-primary-500 to-accent-orange text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                        >
                          Start Workout
                        </button>
                      </div>
                    </div>
                  ))}
                  {getCurrentDayWorkouts().length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-6xl mb-4">🏋️‍♂️</div>
                      <h4 className="text-xl font-semibold mb-2">Rest Day</h4>
                      <p>No workouts scheduled for Week {currentWeek}, Day {currentDay}</p>
                      <p className="text-sm mt-2">Take this time to recover and prepare for your next workout!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}



