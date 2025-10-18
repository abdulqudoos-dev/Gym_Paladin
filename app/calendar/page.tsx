"use client";
import SimpleLoader from '@/components/SimpleLoader';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarData {
  date: string;
  workoutCount: number;
  totalCalories: number;
  totalDuration: number;
  sessions: Array<{
    id: string;
    workoutId: string;
    programId?: string;
    week?: number;
    day?: number;
    completedAt: string;
    status: string;
    caloriesBurned?: number;
    totalDuration?: number;
  }>;
  exerciseProgress: Array<{
    workoutId: string;
    workoutTitle: string;
    totalExercises: number;
    completedExercises: number;
    progressPercentage: number;
    status: 'scheduled' | 'not-started' | 'in-progress' | 'completed';
    week?: number;
    day?: number;
    caloriesBurned?: number;
    totalDuration?: number;
  }>;
}

type LogIndex = Record<string, CalendarData>;

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [calendarData, setCalendarData] = useState<CalendarData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    const load = async () => {
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!meRes.ok) { localStorage.removeItem('token'); router.push('/auth/login'); return; }
      const me = await meRes.json();
      setUser(me.user || me);
    };
    load();
  }, [router]);

  // Fetch calendar data when month changes
  const fetchCalendarData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const today = new Date();
      const activeMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
      const year = activeMonth.getFullYear();
      const month = activeMonth.getMonth() + 1;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/progress/calendar/${year}/${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Ensure calendarData is always an array
          const calendarArray = Array.isArray(data.calendarData) ? data.calendarData : [];
          setCalendarData(calendarArray);
        } else {
          // If API call fails, set empty array
          setCalendarData([]);
        }
      } else {
        // If response is not ok, set empty array
        setCalendarData([]);
      }
    } catch (error) {
      console.error('Failed to fetch calendar data:', error);
      // Ensure calendarData is always an array even on error
      setCalendarData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [user, monthOffset]);

  // Listen for workout progress updates to refresh calendar
  useEffect(() => {
    const handleWorkoutProgressUpdate = () => {
      // Refresh calendar data when workout is completed
      if (user) {
        fetchCalendarData();
      }
    };

    const handleWorkoutCompleted = () => {
      console.log('Workout completed, refreshing calendar...');
      if (user) {
        fetchCalendarData();
      }
    };

    window.addEventListener('workoutProgressUpdated', handleWorkoutProgressUpdate);
    window.addEventListener('workoutCompleted', handleWorkoutCompleted);
    return () => {
      window.removeEventListener('workoutProgressUpdated', handleWorkoutProgressUpdate);
      window.removeEventListener('workoutCompleted', handleWorkoutCompleted);
    };
  }, [user, monthOffset]);

  // Handle day selection
  const handleDayClick = (dateStr: string) => {
    setSelectedDay(dateStr);
    setShowDayDetails(true);
  };

  const today = new Date();
  const activeMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = activeMonth.getFullYear();
  const month = activeMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();

  const logsIndex: LogIndex = useMemo(() => {
    const idx: LogIndex = {};
    
    // Convert calendar data to index format
    if (calendarData && Array.isArray(calendarData)) {
      calendarData.forEach((data) => {
        // Ensure exerciseProgress is always an array
        const safeData = {
          ...data,
          exerciseProgress: data.exerciseProgress || [],
          sessions: data.sessions || [],
          workoutCount: data.workoutCount || 0
        };
        idx[data.date] = safeData;
      });
    }
    
    return idx;
  }, [calendarData]);

  const grid: Array<{ dateStr: string | null; day: number | null }> = [];
  for (let i = 0; i < startWeekday; i++) grid.push({ dateStr: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(year, month, d).toISOString().slice(0, 10);
    grid.push({ dateStr, day: d });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center">
        <SimpleLoader label="Loading calendar data" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300">

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setMonthOffset((v) => v - 1)} 
            className="px-3 py-2 rounded-lg bg-dark-300 text-white hover:bg-dark-200 transition-colors"
          >
            Prev
          </button>
          <h1 className="text-2xl font-bold text-white">
            {activeMonth.toLocaleString('default', { month: 'long' })} {year}
            {isLoading && <span className="ml-2 text-sm text-gray-400">(Loading...)</span>}
          </h1>
          <button 
            onClick={() => setMonthOffset((v) => v + 1)} 
            className="px-3 py-2 rounded-lg bg-dark-300 text-white hover:bg-dark-200 transition-colors"
          >
            Next
          </button>
        </div>

        {/* Progress Summary */}
        <div className="mb-6 p-4 bg-dark-300/30 rounded-xl border border-dark-200/50">
          <h3 className="text-white font-semibold mb-3">Current Month Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-300">Completed Workouts</span>
              <span className="text-green-400 font-semibold">
                {(calendarData || []).filter(day => 
                  day.exerciseProgress?.some(ex => ex.status === 'completed')
                ).length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-300">In Progress</span>
              <span className="text-orange-400 font-semibold">
                {(calendarData || []).filter(day => 
                  day.exerciseProgress?.some(ex => ex.status === 'in-progress')
                ).length}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-gray-300">Total Days</span>
              <span className="text-gray-400 font-semibold">
                {(calendarData || []).length}
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 p-4 bg-dark-300/30 rounded-xl border border-dark-200/50">
          <h3 className="text-white font-semibold mb-3">Status Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <span className="text-green-400 text-xs">✓</span>
              </div>
              <span className="text-gray-300">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                <span className="text-orange-400 text-xs">◐</span>
              </div>
              <span className="text-gray-300">In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <span className="text-red-400 text-xs">○</span>
              </div>
              <span className="text-gray-300">Not Started</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <span className="text-blue-400 text-xs">-</span>
              </div>
              <span className="text-gray-300">No Workouts</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-gray-400 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (<div key={d} className="py-2">{d}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {grid.map((cell, idx) => {
            const dayData = cell.dateStr ? logsIndex[cell.dateStr] : null;
            const hasWorkouts = dayData && dayData.exerciseProgress && dayData.exerciseProgress.length > 0;
            const completedWorkouts = dayData?.exerciseProgress.filter(ex => ex.status === 'completed').length || 0;
            const totalWorkouts = dayData?.exerciseProgress.length || 0;
            const isToday = cell.dateStr === new Date().toISOString().split('T')[0];
            
            return (
              <motion.div 
                key={idx} 
                className={`h-32 rounded-xl border border-dark-200/50 bg-dark-300/50 p-2 cursor-pointer transition-all duration-200 hover:bg-dark-300/70 hover:border-primary-500/50 ${
                  cell.day ? 'text-white' : 'opacity-30'
                } ${isToday ? 'ring-2 ring-primary-500/50' : ''}`}
                onClick={() => cell.dateStr && handleDayClick(cell.dateStr)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">{cell.day || ''}</div>
                  {isToday && (
                    <div className="flex items-center space-x-1">
                      {completedWorkouts > 0 && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {hasWorkouts ? (
                  <div className="space-y-1">
                    {/* Progress Summary */}
                    <div className="text-xs text-gray-400 mb-1">
                      {completedWorkouts}/{totalWorkouts} completed
                    </div>
                    
                    {/* Workout Status Indicators */}
                    <div className="flex flex-wrap gap-1">
                      {dayData.exerciseProgress.slice(0, 3).map((exercise, exerciseIdx) => {
                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'completed':
                              return 'bg-green-500';
                            case 'in-progress':
                              return 'bg-orange-500';
                            case 'not-started':
                            case 'scheduled':
                              return 'bg-red-500';
                            default:
                              return 'bg-gray-500';
                          }
                        };

                        const getStatusIcon = (status: string) => {
                          switch (status) {
                            case 'completed':
                              return '✓';
                            case 'in-progress':
                              return '◐';
                            case 'not-started':
                            case 'scheduled':
                              return '○';
                            default:
                              return '?';
                          }
                        };

                        return (
                          <div 
                            key={exerciseIdx} 
                            className={`w-6 h-6 rounded-full ${getStatusColor(exercise.status)} flex items-center justify-center text-white text-xs`}
                            title={`${exercise.workoutTitle}: ${exercise.completedExercises || 0}/${exercise.totalExercises || 0} exercises`}
                          >
                            {getStatusIcon(exercise.status)}
                          </div>
                        );
                      })}
                      {dayData.exerciseProgress.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs">
                          +{dayData.exerciseProgress.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                ) : cell.day ? (
                  <div className="text-xs text-gray-500 text-center mt-4">
                    -
                  </div>
                ) : null}
              </motion.div>
            );
          })}
        </div>

        {/* Day Details Modal */}
        <AnimatePresence>
          {showDayDetails && selectedDay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDayDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-dark-400 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {new Date(selectedDay).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <button
                    onClick={() => setShowDayDetails(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {(() => {
                  const dayData = logsIndex[selectedDay];
                  if (!dayData || !dayData.exerciseProgress || dayData.exerciseProgress.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-lg mb-2">-</div>
                        <div className="text-gray-500 text-sm">No workouts scheduled for this day</div>
                      </div>
                    );
                  }

                  const totalCalories = dayData.exerciseProgress.reduce((sum, ex) => sum + (ex.caloriesBurned || 0), 0);
                  const totalDuration = dayData.exerciseProgress.reduce((sum, ex) => sum + (ex.totalDuration || 0), 0);
                  const completedWorkouts = dayData.exerciseProgress.filter(ex => ex.status === 'completed').length;

                  return (
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-dark-300/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-green-400">{completedWorkouts}</div>
                          <div className="text-sm text-gray-400">Completed</div>
                        </div>
                        <div className="bg-dark-300/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-orange-400">{totalCalories}</div>
                          <div className="text-sm text-gray-400">Calories</div>
                        </div>
                      </div>

                      {/* Workout Details */}
                      <div className="space-y-3">
                        <h4 className="text-white font-semibold">Workout Details</h4>
                        {dayData.exerciseProgress.map((exercise, idx) => (
                          <div key={idx} className="bg-dark-300/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-white font-medium">{exercise.workoutTitle}</h5>
                              <div className={`px-2 py-1 rounded-full text-xs ${
                                exercise.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                exercise.status === 'in-progress' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {exercise.status === 'completed' ? '✓ Completed' :
                                 exercise.status === 'in-progress' ? '◐ In Progress' :
                                 '○ Not Started'}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                              <div>Exercises: {exercise.completedExercises || 0}/{exercise.totalExercises || 0}</div>
                              <div>Progress: {exercise.progressPercentage || 0}%</div>
                              {exercise.caloriesBurned && (
                                <div>Calories: {exercise.caloriesBurned}</div>
                              )}
                              {exercise.totalDuration && (
                                <div>Duration: {Math.floor(exercise.totalDuration / 60)}m {exercise.totalDuration % 60}s</div>
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-2">
                              <div className="w-full bg-dark-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    exercise.status === 'completed' ? 'bg-green-500' :
                                    exercise.status === 'in-progress' ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${exercise.progressPercentage || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}



