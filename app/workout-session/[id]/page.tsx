'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import WorkoutOverviewCard from '@/components/WorkoutOverviewCard';
import ExerciseDetails from '@/components/ExerciseDetails';
import NextExercisePreview from '@/components/NextExercisePreview';
import WorkoutControls from '@/components/WorkoutControls';
import RestTimer from '@/components/RestTimer';
import CountdownTimer from '@/components/CountdownTimer';

interface Exercise {
  _id: string;
  name: string;
  description: string;
  instructions: string;
  animationUrl?: string;
  formTips: string[];
  defaultSets: number;
  defaultReps: string;
  defaultRest: number;
  caloriesPerMinute: number;
}

interface WorkoutSession {
  _id: string;
  sessionId: string;
  status: 'preparing' | 'active' | 'paused' | 'completed' | 'cancelled';
  workoutId: {
    _id: string;
    title: string;
    description: string;
    difficulty: string;
    duration: number;
  };
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    exerciseDetails?: Exercise;
    order: number;
    maxType?: '1RM' | '3RM' | '5RM' | '10RM' | 'RM';
    sets: Array<{
      reps: number;
      weight: number;
      restTime: number;
      percent?: number; // hidden prescription
      completedAt?: Date;
      notes: string;
      isCompleted: boolean;
    }>;
    isCompleted: boolean;
    startedAt?: Date;
    completedAt?: Date;
  }>;
  currentExerciseIndex: number;
  currentSetIndex: number;
  exercisesCompleted: number;
  totalExercises: number;
  caloriesBurned: number;
  totalDuration: number;
  startedAt: string;
  pausedAt?: string;
  resumedAt?: string;
}

export default function WorkoutSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id as string;
  
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [currentMax, setCurrentMax] = useState<number | ''>('');
  const [maxSaveMsg, setMaxSaveMsg] = useState<string>('');

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

    fetchSession();
  }, [sessionId, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (session?.status === 'active' && !isResting) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session?.status, isResting]);

  // Update/show saved max when switching exercises
  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const ex = session?.exercises?.[session.currentExerciseIndex];
        if (!token || !ex) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/maxes?exerciseId=${ex.exerciseId}&maxType=${encodeURIComponent(ex.maxType || '1RM')}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const d = await res.json();
          setCurrentMax(d?.max?.value ?? '');
        }
      } catch {}
    })();
  }, [session?.currentExerciseIndex]);

  const fetchSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workout-sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        setElapsedTime(data.session.totalDuration || 0);
        // Load a saved max for the first exercise for convenience
        try {
          const firstEx = data.session.exercises?.[0];
          const token2 = localStorage.getItem('token');
          if (firstEx && token2) {
            const res2 = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/maxes?exerciseId=${firstEx.exerciseId}&maxType=${encodeURIComponent(firstEx.maxType || '1RM')}`, {
              headers: { 'Authorization': `Bearer ${token2}` }
            });
            if (res2.ok) {
              const d2 = await res2.json();
              if (d2?.max?.value) setCurrentMax(d2.max.value);
            }
          }
        } catch {}
      } else {
        throw new Error(data.message || 'Failed to load session');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSession = async (updates: Partial<WorkoutSession>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workout-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      const data = await response.json();
      if (data.success) {
        setSession(data.session);
      }
    } catch (err: any) {
      console.error('Update session error:', err);
    }
  };

  const startWorkout = async () => {
    setShowCountdown(true);
    // Countdown will handle the actual start
  };

  const handleCountdownComplete = async () => {
    setShowCountdown(false);
    await updateSession({ 
      status: 'active',
      startedAt: new Date().toISOString()
    });
  };

  const pauseWorkout = async () => {
    await updateSession({ status: 'paused' });
  };

  const resumeWorkout = async () => {
    await updateSession({ status: 'active' });
  };

  const completeSet = async () => {
    if (!session) return;

    const currentExercise = session.exercises[session.currentExerciseIndex];
    const currentSet = currentExercise.sets[session.currentSetIndex];

    // Apply auto-calculated weight from percent/max if available
    if (currentMax !== '' && typeof currentSet.percent === 'number') {
      const decimal = currentSet.percent > 1 ? currentSet.percent / 100 : currentSet.percent;
      const raw = decimal * Number(currentMax);
      const rounded = Math.round(raw / 5) * 5;
      const updatedExercisesCalc = [...session.exercises];
      updatedExercisesCalc[session.currentExerciseIndex].sets[session.currentSetIndex].weight = rounded;
      await updateSession({ exercises: updatedExercisesCalc });
    }

    // Mark set as completed
    const updatedExercises = [...session.exercises];
    updatedExercises[session.currentExerciseIndex].sets[session.currentSetIndex].isCompleted = true;
    updatedExercises[session.currentExerciseIndex].sets[session.currentSetIndex].completedAt = new Date();

    // Check if exercise is completed
    const allSetsCompleted = updatedExercises[session.currentExerciseIndex].sets.every(set => set.isCompleted);
    if (allSetsCompleted) {
      updatedExercises[session.currentExerciseIndex].isCompleted = true;
      updatedExercises[session.currentExerciseIndex].completedAt = new Date();
    }

    await updateSession({
      exercises: updatedExercises,
      exercisesCompleted: updatedExercises.filter(ex => ex.isCompleted).length
    });

    // Start rest timer if not the last set
    if (session.currentSetIndex < currentExercise.sets.length - 1) {
      setIsResting(true);
      setRestTimeRemaining(currentSet.restTime);
      setShowRestTimer(true);
    } else if (session.currentExerciseIndex < session.exercises.length - 1) {
      // Move to next exercise
      await updateSession({
        currentExerciseIndex: session.currentExerciseIndex + 1,
        currentSetIndex: 0
      });
    } else {
      // Workout completed
      await completeWorkout();
    }
  };

  const handleRestComplete = async () => {
    setShowRestTimer(false);
    setIsResting(false);
    
    if (!session) return;

    // Move to next set
    await updateSession({
      currentSetIndex: session.currentSetIndex + 1
    });
  };

  const skipRest = async () => {
    setShowRestTimer(false);
    setIsResting(false);
    
    if (!session) return;

    // Move to next set
    await updateSession({
      currentSetIndex: session.currentSetIndex + 1
    });
  };

  const completeWorkout = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workout-sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to complete workout');
      }

      const data = await response.json();
      if (data.success) {
        router.push(`/workout-summary/${sessionId}`);
      }
    } catch (err: any) {
      console.error('Complete workout error:', err);
    }
  };

  const cancelWorkout = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/workout-sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        router.push('/workouts');
      }
    } catch (err: any) {
      console.error('Cancel workout error:', err);
    }
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

  const currentExercise = session.exercises[session.currentExerciseIndex];
  const nextExercise = session.exercises[session.currentExerciseIndex + 1];
  const progressPercentage = (session.exercisesCompleted / session.totalExercises) * 100;

  // When exercise changes, fetch saved max for the new exercise
  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const ex = session?.exercises?.[session.currentExerciseIndex];
        if (!token || !ex) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/maxes?exerciseId=${ex.exerciseId}&maxType=${encodeURIComponent(ex.maxType || '1RM')}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const d = await res.json();
          setCurrentMax(d?.max?.value ?? '');
        }
      } catch {}
    })();
  }, [session?.currentExerciseIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300">
      
      <AnimatePresence>
        {showCountdown && (
          <CountdownTimer onComplete={handleCountdownComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRestTimer && (
          <RestTimer
            duration={restTimeRemaining}
            onComplete={handleRestComplete}
            onSkip={skipRest}
          />
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        {/* Sticky Max Input Bar */}
        <div className="sticky top-20 z-20 mb-4">
          <div className="bg-dark-300/70 backdrop-blur border border-dark-200/50 rounded-xl p-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-gray-300 text-sm mb-1">Enter Max for this Exercise</label>
              <input
                type="number"
                value={currentMax}
                onChange={(e) => setCurrentMax(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-40 px-3 py-2 bg-dark-400 border border-dark-200 rounded-lg text-white focus:border-primary-500"
                placeholder="e.g., 200"
              />
            </div>
            <button
              onClick={async () => {
                try {
                  setMaxSaveMsg('');
                  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                  const ex = session?.exercises?.[session.currentExerciseIndex];
                  if (!token || !ex || currentMax === '') {
                    setMaxSaveMsg('Enter a valid max first');
                    return;
                  }
                  const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/maxes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                      exerciseId: ex.exerciseId,
                      exerciseName: ex.exerciseName,
                      maxType: ex.maxType || '1RM',
                      value: Number(currentMax)
                    })
                  });
                  if (!resp.ok) {
                    const t = await resp.text();
                    setMaxSaveMsg('Failed to save max');
                    console.error('Save max error:', t);
                  } else {
                    setMaxSaveMsg('Max saved');
                    setTimeout(() => setMaxSaveMsg(''), 2000);
                  }
                } catch (e) {
                  console.error('Save max error:', e);
                  setMaxSaveMsg('Failed to save max');
                }
              }}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg h-10"
            >
              Save Max
            </button>
          </div>
          {maxSaveMsg && <div className="text-xs text-gray-400 mt-1">{maxSaveMsg}</div>}
        </div>
        {/* Workout Overview Card */}
        <WorkoutOverviewCard
          title={session.workoutId.title}
          progress={progressPercentage}
          elapsedTime={elapsedTime}
          totalTime={session.workoutId.duration * 60}
          caloriesBurned={session.caloriesBurned}
          exercisesCompleted={session.exercisesCompleted}
          totalExercises={session.totalExercises}
        />

        {/* Exercise Details Section */}
        <div className="mb-4">
          <label className="block text-gray-300 text-sm mb-1">Enter Max for this Exercise</label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={currentMax}
              onChange={(e) => setCurrentMax(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-40 px-3 py-2 bg-dark-300 border border-dark-200 rounded-lg text-white focus:border-primary-500"
              placeholder="e.g., 200"
            />
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const ex = session?.exercises?.[session.currentExerciseIndex];
                  if (!token || !ex || currentMax === '') return;
                  await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/maxes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                      exerciseId: ex.exerciseId,
                      exerciseName: ex.exerciseName,
                      maxType: ex.maxType || '1RM',
                      value: Number(currentMax)
                    })
                  });
                } catch {}
              }}
              className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
            >
              Save Max
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Weights auto-calc from hidden percentages, rounded to nearest 5.</p>
        </div>
        <ExerciseDetails
          exercise={currentExercise}
          currentSet={session.currentSetIndex}
          totalSets={currentExercise.sets.length}
          onSetComplete={completeSet}
          onExerciseComplete={() => {}}
          onPreviousExercise={() => {}}
          onNextExercise={() => {}}
          onStartRest={(duration) => {
            setIsResting(true);
            setRestTimeRemaining(duration);
            setShowRestTimer(true);
          }}
          isPaused={session.status === 'paused'}
          canGoPrevious={session.currentExerciseIndex > 0}
          canGoNext={session.currentExerciseIndex < session.exercises.length - 1}
          currentMax={currentMax}
        />

        {/* Next Exercise Preview */}
        {nextExercise && (
          <NextExercisePreview
            nextExercise={nextExercise}
            isLast={session.currentExerciseIndex === session.exercises.length - 1}
          />
        )}

        {/* Workout Controls */}
        <WorkoutControls
          status={session.status}
          isPaused={session.status === 'paused'}
          onPauseResume={session.status === 'paused' ? resumeWorkout : pauseWorkout}
          onComplete={completeWorkout}
          onCancel={cancelWorkout}
          onSkip={() => {}}
          onRestart={() => {}}
          onAddNote={() => {}}
        />
      </main>
    </div>
  );
}
