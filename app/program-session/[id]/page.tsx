'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  videoUrls?: string[];
  imageUrls?: string[];
  thumbnailUrl?: string;
  animationUrl?: string;
  formTips: string[];
  defaultSets: number;
  defaultReps: string;
  defaultRest: number;
  caloriesPerMinute: number;
  difficulty: string;
  equipment: string[];
  muscleGroups: string[];
  commonMistakes: string[];
}

interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  exerciseDetails?: Exercise;
  order: number;
  sets: Array<{
    reps: number;
    weight: number;
    restTime: number;
    completedAt?: Date;
    notes: string;
    isCompleted: boolean;
  }>;
  isCompleted: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

interface ProgramSession {
  _id: string;
  userId: string;
  programId: string;
  week: number;
  day: number;
  currentWorkoutIndex: number;
  sessionId: string;
  status: 'preparing' | 'active' | 'paused' | 'completed' | 'cancelled';
  startedAt: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  completedAt?: Date;
  totalDuration: number;
  pausedDuration: number;
  currentExerciseIndex: number;
  currentSetIndex: number;
  exercisesCompleted: number;
  totalExercises: number;
  caloriesBurned: number;
  totalReps: number;
  totalSets: number;
  exercises: SessionExercise[];
  notes: string;
  rating: number;
  difficulty: string;
  achievements: string[];
  personalRecords: Array<{
    exerciseId: string;
    recordType: string;
    value: number;
    previousValue: number;
  }>;
}

export default function ProgramSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<ProgramSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // UI States
  const [showCountdown, setShowCountdown] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Real-time tracking
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // Media slider state
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'animation'>('image');
  
  // Completion celebration state
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);

  // User-entered max for current exercise
  const [currentMax, setCurrentMax] = useState<number | ''>('');
  // Unit mode: 'lb' | 'kg' | 'both'
  const [unitMode, setUnitMode] = useState<'lb' | 'kg' | 'both'>('both');
  // Whether to save updated max when logging workout
  const [saveMaxOnLog, setSaveMaxOnLog] = useState<boolean>(true);
  // Debounced max for performance
  const [debouncedMax, setDebouncedMax] = useState<number | ''>('');

  // Rounding helpers and conversions
  const clampNonNegative = (value: number) => Math.max(0, value);
  const roundToNearest = (value: number, increment: number) => Math.round(value / increment) * increment;
  const toKg = (lbs: number) => lbs * 0.45359237;
  const toLb = (kg: number) => kg / 0.45359237;
  const computeTargets = (maxLbs: number, percent?: number) => {
    if (typeof percent !== 'number') return { lbs: undefined, kg: undefined };
    const p = percent > 1 ? percent / 100 : percent;
    const rawLbs = maxLbs * p;
    const rawKg = toKg(maxLbs) * p;
    const lbsRounded = clampNonNegative(roundToNearest(rawLbs, 5));
    const kgRounded = clampNonNegative(roundToNearest(rawKg, 2.5));
    return { lbs: lbsRounded, kg: kgRounded };
  };

  // Load saved max whenever exercise changes
  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const ex = session?.exercises?.[session.currentExerciseIndex];
        if (!token || !ex) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/maxes?exerciseId=${ex.exerciseId}&maxType=${encodeURIComponent(((ex as any).maxType) || '1RM')}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const d = await res.json();
          setCurrentMax(d?.max?.value ?? '');
          setDebouncedMax(d?.max?.value ?? '');
        }
      } catch {}
    })();
  }, [session?.currentExerciseIndex]);

  // Debounce max input for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMax(currentMax);
    }, 150); // 150ms debounce
    return () => clearTimeout(timer);
  }, [currentMax]);

  // Memoized target calculations for performance (moved here to avoid dependency issues)
  const memoizedTargets = useMemo(() => {
    if (!session?.exercises?.[session?.currentExerciseIndex]?.sets || debouncedMax === '') return [];
    
    return session.exercises[session.currentExerciseIndex].sets.map((s) => {
      const percent = (s as any).percent;
      if (typeof percent === 'number') {
        return computeTargets(Number(debouncedMax), percent);
      } else if (typeof s.weight === 'number') {
        return {
          lbs: clampNonNegative(roundToNearest(s.weight, 5)),
          kg: clampNonNegative(roundToNearest(toKg(s.weight), 2.5))
        };
      }
      return { lbs: undefined, kg: undefined };
    });
  }, [session?.exercises, session?.currentExerciseIndex, debouncedMax]);

  // Load session data once
  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        // Check for localStorage backup first
        const backupKey = `session-backup-${sessionId}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          console.log('Found session backup in localStorage:', backupData);
          // Remove backup after using it
          localStorage.removeItem(backupKey);
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/program-sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to load session');
        }

        const data = await response.json();
        if (data.success) {
          const sessionData = data.session;
          setSession(sessionData);
          
          // Restore workout state based on session status and progress
          if (sessionData.status === 'preparing') {
            // New workout - start countdown
            setShowCountdown(true);
          } else if (sessionData.status === 'active' || sessionData.status === 'paused') {
            // Resume existing workout - restore state
            console.log(`Resuming workout: Exercise ${sessionData.currentExerciseIndex + 1}/${sessionData.totalExercises}, Set ${sessionData.currentSetIndex + 1}`);
            
            // Set start time for timer (approximate based on duration)
            if (sessionData.totalDuration > 0) {
              const estimatedStartTime = new Date(Date.now() - (sessionData.totalDuration * 1000));
              setStartTime(estimatedStartTime);
              setElapsedTime(sessionData.totalDuration);
            }
            
            // Set pause state if session was paused
            if (sessionData.status === 'paused') {
              setIsPaused(true);
            }
            
            // IMPORTANT: Restore the session state to match the current progress
            // This ensures the UI shows the correct exercise and set positions
            console.log(`Restoring session state: Exercise ${sessionData.currentExerciseIndex + 1}/${sessionData.totalExercises}, Set ${sessionData.currentSetIndex + 1}, Completed: ${sessionData.exercisesCompleted}`);
            setSession(prev => prev ? {
              ...prev,
              currentExerciseIndex: sessionData.currentExerciseIndex,
              currentSetIndex: sessionData.currentSetIndex,
              exercisesCompleted: sessionData.exercisesCompleted,
              exercises: sessionData.exercises
            } : null);
            
            // Don't show countdown for resumed workouts
            setShowCountdown(false);
          } else if (sessionData.status === 'completed') {
            // Workout already completed - redirect to summary
            router.push(`/workout-summary/${sessionId}`);
            return;
          }
        } else {
          throw new Error(data.message || 'Failed to load session');
        }
      } catch (err: any) {
        console.error('Load session error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionId, router]);

  // Real-time timer updates
  useEffect(() => {
    if (!session || session.status !== 'active' || isPaused) return;

    const timerInterval = setInterval(() => {
      if (startTime) {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
        
        // Update session duration
        setSession(prev => prev ? { ...prev, totalDuration: elapsed } : null);
      }
    }, 1000); // Update every second

    return () => clearInterval(timerInterval);
  }, [session, startTime, isPaused]);


  // Save state when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (session && session.status !== 'completed' && session.status !== 'cancelled') {
        await saveSessionState();
        await updateWorkoutProgress();
      }
    };

    const handleVisibilityChange = async () => {
      if (document.hidden && session && session.status !== 'completed' && session.status !== 'cancelled') {
        await saveSessionState();
        await updateWorkoutProgress();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session]);

  // Update workout progress on workouts page
  const updateWorkoutProgress = async () => {
    try {
      // Trigger a custom event that the workouts page can listen to
      const eventDetail = {
        sessionId: sessionId,
        week: session?.week,
        day: session?.day,
        workoutIndex: session?.currentWorkoutIndex,
        exercisesCompleted: session?.exercisesCompleted,
        totalExercises: session?.totalExercises
      };
      
      console.log('Dispatching workoutProgressUpdated event:', eventDetail);
      window.dispatchEvent(new CustomEvent('workoutProgressUpdated', {
        detail: eventDetail
      }));
    } catch (error) {
      console.error('Error updating workout progress:', error);
    }
  };

  // Save session state to backend with retry logic
  const saveSessionState = async (retryCount = 0) => {
    if (!session || isUpdating) return false;

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No auth token found');
        return false;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/progress/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: session.status,
          currentExerciseIndex: session.currentExerciseIndex,
          currentSetIndex: session.currentSetIndex,
          exercisesCompleted: session.exercisesCompleted,
          totalDuration: session.totalDuration,
          caloriesBurned: session.caloriesBurned,
          exercises: session.exercises,
          notes: session.notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLastSaved(new Date());
          console.log('Session state saved successfully');
          
          // Clear any localStorage backup since backend save succeeded
          const backupKey = `session-backup-${sessionId}`;
          localStorage.removeItem(backupKey);
          
          return true;
        } else {
          throw new Error(data.message || 'Failed to save session state');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Save session error:', err);
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying save in ${delay}ms...`);
        setTimeout(() => saveSessionState(retryCount + 1), delay);
      } else {
        console.error('Failed to save session state after 3 retries');
        // Store in localStorage as fallback
        localStorage.setItem(`session-backup-${sessionId}`, JSON.stringify({
          sessionId,
          status: session.status,
          currentExerciseIndex: session.currentExerciseIndex,
          currentSetIndex: session.currentSetIndex,
          exercisesCompleted: session.exercisesCompleted,
          timestamp: new Date().toISOString()
        }));
      }
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle countdown completion
  const handleCountdownComplete = async () => {
    setShowCountdown(false);
    setStartTime(new Date());
    await updateSessionStatus('active');
  };

  // Update session status
  const updateSessionStatus = async (status: ProgramSession['status']) => {
    if (!session) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/program-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setSession(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  // Handle pause/resume
  const handlePauseResume = async () => {
    if (!session) return;

    const newStatus = session.status === 'active' ? 'paused' : 'active';
    await updateSessionStatus(newStatus);
    setIsPaused(newStatus === 'paused');
  };

  // Handle exercise navigation
  const handlePreviousExercise = () => {
    if (!session || session.currentExerciseIndex <= 0) return;
    
    const updatedSession = { ...session };
    updatedSession.currentExerciseIndex -= 1;
    updatedSession.currentSetIndex = 0; // Reset to first set
    setSession(updatedSession);
  };

  const handleNextExercise = () => {
    if (!session || session.currentExerciseIndex >= session.totalExercises - 1) return;
    
    const updatedSession = { ...session };
    updatedSession.currentExerciseIndex += 1;
    updatedSession.currentSetIndex = 0; // Reset to first set
    setSession(updatedSession);
  };

  // Handle set completion
  const handleSetComplete = async () => {
    if (!session) return;

    const updatedSession = { ...session };
    const ex = updatedSession.exercises[updatedSession.currentExerciseIndex];
    const setIdx = updatedSession.currentSetIndex;
    const curSet = ex?.sets?.[setIdx];
    if (!ex || !curSet) return;

    // Persist target from percent * max in lbs with plate rounding; allow zero, clamp >= 0
    const targets = memoizedTargets[setIdx] || { lbs: undefined, kg: undefined };
    if (typeof targets.lbs === 'number') {
      curSet.weight = targets.lbs;
    } else if (typeof curSet.weight === 'number') {
      // Ensure non-negative and plate-rounded for any pre-set weight value
      curSet.weight = clampNonNegative(roundToNearest(curSet.weight, 5));
    }

    // Mark current set as completed
    curSet.isCompleted = true;
    curSet.completedAt = new Date();

    // Determine next state
    const lastSetIndex = (ex.sets?.length || 1) - 1;
    if (setIdx >= lastSetIndex) {
      // Last set: complete exercise using shared handler (handles end-of-workout as well)
      await handleExerciseComplete();
      return;
    } else {
      // Advance to next set
      updatedSession.currentSetIndex = setIdx + 1;
    }

    // Start rest
    const nextSet = updatedSession.exercises[updatedSession.currentExerciseIndex]?.sets[updatedSession.currentSetIndex] || curSet;
    const restToUse = typeof nextSet?.restTime === 'number' ? nextSet.restTime : (typeof curSet.restTime === 'number' ? curSet.restTime : 0);
    if (restToUse > 0) {
      setShowRestTimer(true);
      setRestTimeRemaining(restToUse);
    }

    // Persist indices and sets so progress survives navigation
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/progress/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          currentExerciseIndex: updatedSession.currentExerciseIndex,
          currentSetIndex: updatedSession.currentSetIndex,
          exercisesCompleted: updatedSession.exercisesCompleted,
          exercises: updatedSession.exercises
        })
      });
      if (!resp.ok) console.error('Failed to save set progress');
    } catch (e) {
      console.error('Save set progress error', e);
    }

    setSession(updatedSession);
    await updateWorkoutProgress();
  };

  // Handle exercise completion
  const handleExerciseComplete = async () => {
    if (!session) return;

    const updatedSession = { ...session };
    const currentEx = updatedSession.exercises[updatedSession.currentExerciseIndex];
    if (currentEx) {
      currentEx.isCompleted = true;
      currentEx.completedAt = new Date();
    }
    updatedSession.exercisesCompleted = (updatedSession.exercises || []).filter(e => e.isCompleted).length;
    // Determine if this was the last exercise
    const wasLastExercise = updatedSession.currentExerciseIndex >= updatedSession.totalExercises - 1;
    if (wasLastExercise) {
      // Move index past the end so the completion check below succeeds
      updatedSession.currentExerciseIndex = updatedSession.totalExercises;
      updatedSession.currentSetIndex = 0;
    } else {
      // Advance to next exercise
      updatedSession.currentExerciseIndex += 1;
      updatedSession.currentSetIndex = 0;
    }

    // Show completion celebration
    setShowCompletionCelebration(true);
    setTimeout(() => setShowCompletionCelebration(false), 2000);

    // Check if workout is complete (including last exercise path)
    if (updatedSession.currentExerciseIndex >= updatedSession.totalExercises) {
      // Call complete workout handler
      await handleCompleteWorkout();
      return;
    }

    setSession(updatedSession);
    
    // IMMEDIATE SAVE: Save state immediately when exercise is completed
    console.log('Exercise completed, saving state immediately...');
    console.log('Saving session with exercises:', updatedSession.exercises.map(ex => ({
      name: ex.exerciseName,
      sets: ex.sets.map(set => ({ isCompleted: set.isCompleted })),
      isCompleted: ex.isCompleted
    })));
    
    // Use the updated session data directly for saving
    const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/progress/${sessionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        currentExerciseIndex: updatedSession.currentExerciseIndex,
        currentSetIndex: updatedSession.currentSetIndex,
        exercisesCompleted: updatedSession.exercisesCompleted,
        exercises: updatedSession.exercises
      })
    });
    
    if (saveResponse.ok) {
      console.log('Exercise progress saved successfully');
    } else {
      console.error('Failed to save exercise progress');
    }
    
    await updateWorkoutProgress();
  };

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current exercise media
  const getCurrentExerciseMedia = () => {
    if (!currentExercise?.exerciseDetails) return { videos: [], images: [], animation: null };
    
    const exercise = currentExercise.exerciseDetails;
    return {
      videos: exercise.videoUrls || [],
      images: exercise.imageUrls || [],
      animation: exercise.animationUrl || null
    };
  };

  // Get all media for current exercise
  const getAllMedia = () => {
    const { videos, images, animation } = getCurrentExerciseMedia();
    const allMedia = [];
    
    // Add images
    images.forEach((url, index) => {
      allMedia.push({ type: 'image', url, index });
    });
    
    // Add videos
    videos.forEach((url, index) => {
      allMedia.push({ type: 'video', url, index });
    });
    
    // Add animation if available
    if (animation) {
      allMedia.push({ type: 'animation', url: animation, index: 0 });
    }
    
    return allMedia;
  };

  // Reset media slider when exercise changes
  useEffect(() => {
    setCurrentMediaIndex(0);
  }, [session?.currentExerciseIndex]);

  // Handle workout completion
  const handleCompleteWorkout = async () => {
    if (!session) return;

    try {
      // CRITICAL: Save current state immediately before completing
      console.log('Saving session state before completion...');
      const saveSuccess = await saveSessionState();
      
      if (!saveSuccess) {
        console.error('Failed to save session state before completion');
        // Still proceed but log the error
      }

      // Save max if enabled and current max is set
      if (saveMaxOnLog && currentMax !== '' && session.exercises[session.currentExerciseIndex]) {
        try {
          const token = localStorage.getItem('token');
          const ex = session.exercises[session.currentExerciseIndex];
          const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/maxes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName,
              maxType: (ex as any).maxType || '1RM',
              value: Number(currentMax)
            })
          });
          if (resp.ok) {
            console.log('Max saved on workout completion');
          } else {
            console.error('Failed to save max on completion:', await resp.text());
          }
        } catch (e) {
          console.error('Error saving max on completion:', e);
        }
      }

      const token = localStorage.getItem('token');
      
      // Call unified progress API to complete the workout
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/progress/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local session with completed data
          const updatedSession = { ...session, ...data.session };
          setSession(updatedSession);
          
          // Trigger calendar and workouts page updates
          await updateWorkoutProgress();
          
          // Dispatch custom event for calendar update
          window.dispatchEvent(new CustomEvent('workoutCompleted', {
            detail: {
              sessionId: sessionId,
              week: session.week,
              day: session.day,
              workoutIndex: session.currentWorkoutIndex,
              completedAt: new Date().toISOString(),
              caloriesBurned: data.session?.caloriesBurned || 0,
              duration: data.session?.totalDuration || 0
            }
          }));
          
          // Navigate to summary
          router.push(`/workout-summary/${sessionId}`);
        } else {
          console.error('Failed to complete workout:', data.message);
        }
      } else {
        console.error('Failed to complete workout');
      }
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  // Handle workout cancellation
  const handleCancelWorkout = async () => {
    if (!session) return;

    const updatedSession = { ...session };
    updatedSession.status = 'cancelled';
    
    setSession(updatedSession);
    await saveSessionState();
    
    router.push('/workouts');
  };

  // Start rest timer
  const startRestTimer = (duration: number) => {
    setRestTimeRemaining(duration);
    setShowRestTimer(true);
  };

  // Skip rest timer
  const skipRestTimer = () => {
    setShowRestTimer(false);
    setRestTimeRemaining(0);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading workout session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-gray-400 mb-6">{error || 'Session not found'}</p>
          <button
            onClick={() => router.push('/workouts')}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Back to Workouts
          </button>
        </div>
      </div>
    );
  }

  const currentExercise = session.exercises[session.currentExerciseIndex];
  const nextExercise = session.exercises[session.currentExerciseIndex + 1];
  
  // Calculate progress percentage consistently with workouts page
  const progressPercentage = session.totalExercises > 0 
    ? Math.round((session.exercisesCompleted / session.totalExercises) * 100)
    : 0;
  
  // Ensure percentage is within valid range
  const clampedProgressPercentage = Math.max(0, Math.min(100, progressPercentage));
  
  console.log(`Workout session progress: ${session.exercisesCompleted}/${session.totalExercises} (${clampedProgressPercentage}%)`);

  const allMedia = getAllMedia();
  const currentMedia = allMedia[currentMediaIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-black">
      
      <AnimatePresence>
        {showCountdown && (
          <CountdownTimer onComplete={handleCountdownComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRestTimer && (
          <RestTimer
            duration={restTimeRemaining}
            onComplete={skipRestTimer}
            onSkip={skipRestTimer}
          />
        )}
      </AnimatePresence>

      {/* Completion Celebration */}
      <AnimatePresence>
        {showCompletionCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-green-500/90 backdrop-blur-sm text-white px-8 py-4 rounded-2xl text-2xl font-bold shadow-2xl">
              🎉 Exercise Completed! 🎉
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        {/* Sticky Max Input Bar */}
        <div className="sticky top-16 z-20 mb-4">
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
                  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                  const ex = session?.exercises?.[session.currentExerciseIndex];
                  if (!token || !ex || currentMax === '') {
                    alert('Enter a valid max first');
                    return;
                  }
                  const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user-stats/maxes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                      exerciseId: ex.exerciseId,
                      exerciseName: ex.exerciseName,
                      maxType: (ex as any).maxType || '1RM',
                      value: Number(currentMax)
                    })
                  });
                  if (!resp.ok) {
                    console.error('Save max error:', await resp.text());
                    alert('Failed to save max');
                  }
                } catch (e) {
                  console.error('Save max error:', e);
                  alert('Failed to save max');
                }
              }}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg h-10"
            >
              Save Max
            </button>
          </div>
        </div>
        {/* Simplified Workout Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Week {session.week}, Day {session.day} Workout
          </h1>
          
          {/* Week/Day Session Picker */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-4 py-2">
              <span className="text-gray-300 text-sm">Week:</span>
              <select
                value={session.week}
                onChange={(e) => {
                  // In a real app, this would load a different session
                  console.log('Week changed to:', e.target.value);
                }}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-4 py-2">
              <span className="text-gray-300 text-sm">Day:</span>
              <select
                value={session.day}
                onChange={(e) => {
                  // In a real app, this would load a different session
                  console.log('Day changed to:', e.target.value);
                }}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              >
                {Array.from({ length: 7 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Exercise {session.currentExerciseIndex + 1} of {session.totalExercises}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{session.exercisesCompleted} completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </motion.div>

        {/* Main Exercise Card - Modern Workout App Style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-gray-900/95 to-black/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-red-500/20 shadow-2xl mb-6 relative overflow-hidden"
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-500/10 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          </div>
          {/* Exercise Header - Modern Design */}
          <div className="text-center mb-8 relative z-10">
            {/* Exercise Number Badge */}
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-4">
              <span className="text-red-400 font-bold text-lg">{session.currentExerciseIndex + 1}</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              {currentExercise?.exerciseDetails?.name || currentExercise?.exerciseName || 'Exercise'}
            </h2>
            
            {/* Set and Rep Info - Card Style */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-gray-700/50">
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{session.currentSetIndex + 1}</div>
                  <div className="text-gray-400 text-xs">SET</div>
                </div>
                <div className="w-px h-8 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{currentExercise?.sets?.length || 0}</div>
                  <div className="text-gray-400 text-xs">TOTAL</div>
                </div>
                <div className="w-px h-8 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{currentExercise?.sets?.[session.currentSetIndex]?.reps || 0}</div>
                  <div className="text-gray-400 text-xs">REPS</div>
                </div>
                <div className="w-px h-8 bg-gray-600"></div>
                <div className="text-center">
                  {(() => {
                    const targets = memoizedTargets[session.currentSetIndex] || { lbs: undefined, kg: undefined };
                    const { lbs, kg } = targets;
                    
                    const display = () => {
                      if (typeof lbs !== 'number' && typeof kg !== 'number') return '-';
                      if (unitMode === 'lb') return typeof lbs === 'number' ? `${lbs} lb` : '-';
                      if (unitMode === 'kg') return typeof kg === 'number' ? `${kg} kg` : '-';
                      return `${typeof lbs === 'number' ? lbs : '-'} lb / ${typeof kg === 'number' ? kg : '-'} kg`;
                    };
                    return (
                      <>
                        <div className="text-2xl font-bold text-blue-400">{display()}</div>
                        <div className="text-gray-400 text-xs">TARGET</div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            {/* Exercise Details - Modern Tags */}
            {currentExercise?.exerciseDetails && (
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {currentExercise.exerciseDetails.difficulty && (
                  <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-400 text-sm font-medium">{currentExercise.exerciseDetails.difficulty}</span>
                  </div>
                )}
                {currentExercise.exerciseDetails.equipment && currentExercise.exerciseDetails.equipment.length > 0 && (
                  <div className="flex items-center space-x-2 bg-gray-700/30 border border-gray-600/50 px-4 py-2 rounded-full">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span className="text-gray-300 text-sm">{currentExercise.exerciseDetails.equipment.join(', ')}</span>
                  </div>
                )}
                {currentExercise.exerciseDetails.muscleGroups && currentExercise.exerciseDetails.muscleGroups.length > 0 && (
                  <div className="flex items-center space-x-2 bg-gray-700/30 border border-gray-600/50 px-4 py-2 rounded-full">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-gray-300 text-sm">{currentExercise.exerciseDetails.muscleGroups.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Per-set Targets Preview */}
          <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-gray-700/50">
            <h3 className="text-white font-semibold mb-3">Set Targets</h3>
            <div className={`grid text-sm text-gray-300 mb-2 ${unitMode === 'both' ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <div className="font-medium">Set</div>
              <div className="font-medium">Reps</div>
              {unitMode !== 'kg' && <div className="font-medium">Target (lb)</div>}
              {unitMode !== 'lb' && <div className="font-medium">Target (kg)</div>}
            </div>
            <div className="space-y-1">
              {currentExercise?.sets?.map((s, idx) => {
                const targets = memoizedTargets[idx] || { lbs: undefined, kg: undefined };
                const { lbs, kg } = targets;
                
                // Display based on unit mode
                const displayLbs = () => {
                  if (unitMode === 'kg') return '-';
                  return typeof lbs === 'number' ? `${lbs}` : '-';
                };
                const displayKg = () => {
                  if (unitMode === 'lb') return '-';
                  return typeof kg === 'number' ? `${kg}` : '-';
                };
                
                return (
                  <div key={idx} className={`grid text-sm text-gray-300 ${unitMode === 'both' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    <div>Set {idx + 1}</div>
                    <div>{s.reps || '-'}</div>
                    {unitMode !== 'kg' && <div>{displayLbs()}</div>}
                    {unitMode !== 'lb' && <div>{displayKg()}</div>}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-400">Loads are based on your max and hidden percentages. Rounding: 5 lb / 2.5 kg.</p>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span>Units:</span>
                <select
                  value={unitMode}
                  onChange={(e) => setUnitMode(e.target.value as any)}
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                >
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                  <option value="both">lb / kg</option>
                </select>
              </div>
            </div>
          </div>

          {/* Media Slider */}
          {allMedia.length > 0 && (
            <div className="mb-8">
              <div className="relative bg-black/50 rounded-2xl overflow-hidden aspect-video mb-4">
                {currentMedia ? (
                  <>
                    {currentMedia.type === 'video' ? (
                      <video
                        key={currentMedia.url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        onError={(e) => {
                          console.error('Video load error:', e);
                          // Fallback to next media
                          if (currentMediaIndex < allMedia.length - 1) {
                            setCurrentMediaIndex(currentMediaIndex + 1);
                          }
                        }}
                      >
                        <source src={currentMedia.url} type="video/mp4" />
                        <source src={currentMedia.url} type="video/webm" />
                        Your browser does not support the video tag.
                      </video>
                    ) : currentMedia.type === 'image' ? (
                      <img
                        key={currentMedia.url}
                        src={currentMedia.url}
                        alt={`Exercise ${currentExercise?.exerciseDetails?.name || 'demonstration'}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image load error:', e);
                          // Fallback to next media
                          if (currentMediaIndex < allMedia.length - 1) {
                            setCurrentMediaIndex(currentMediaIndex + 1);
                          }
                        }}
                      />
                    ) : currentMedia.type === 'animation' ? (
                      <img
                        key={currentMedia.url}
                        src={currentMedia.url}
                        alt={`Exercise ${currentExercise?.exerciseDetails?.name || 'animation'}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Animation load error:', e);
                          // Fallback to next media
                          if (currentMediaIndex < allMedia.length - 1) {
                            setCurrentMediaIndex(currentMediaIndex + 1);
                          }
                        }}
                      />
                    ) : null}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-800">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">No media available</p>
                    </div>
                  </div>
                )}
                
                {/* Media Navigation */}
                {allMedia.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentMediaIndex(Math.max(0, currentMediaIndex - 1))}
                      disabled={currentMediaIndex === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentMediaIndex(Math.min(allMedia.length - 1, currentMediaIndex + 1))}
                      disabled={currentMediaIndex === allMedia.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Media Indicators */}
              {allMedia.length > 1 && (
                <div className="flex justify-center space-x-2">
                  {allMedia.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMediaIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentMediaIndex 
                          ? 'bg-red-500 w-6' 
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fallback when no media */}
          {allMedia.length === 0 && (
            <div className="w-full h-64 bg-gray-800/50 rounded-2xl mb-8 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-4xl">🏋️</span>
                </div>
                <p className="text-gray-400">Exercise Demonstration</p>
              </div>
            </div>
          )}

          {/* Set Progress - Modern Design */}
          <div className="mb-8 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Set Progress</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-400">
                  {(() => {
                    const total = currentExercise?.sets?.length || 1;
                    const idx = session.currentSetIndex;
                    // If on last set, show 100%
                    const percent = Math.min(100, Math.round((idx / total) * 100));
                    return idx >= total - 1 ? 100 : percent;
                  })()}%
                </div>
                <div className="text-xs text-gray-400">
                  {session.currentSetIndex} of {currentExercise?.sets?.length || 1} sets
                </div>
              </div>
            </div>
            
            {/* Progress Bar Container */}
            <div className="relative">
              <div className="w-full bg-gray-800/50 rounded-full h-4 overflow-hidden border border-gray-700/50">
                <motion.div 
                  className="bg-gradient-to-r from-red-500 via-red-400 to-red-500 h-full rounded-full relative"
                  style={{ width: `${(() => { const total = currentExercise?.sets?.length || 1; const idx = session.currentSetIndex; return idx >= total - 1 ? 100 : Math.max(0, Math.min(100, (idx / total) * 100)); })()}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(() => { const total = currentExercise?.sets?.length || 1; const idx = session.currentSetIndex; return idx >= total - 1 ? 100 : Math.max(0, Math.min(100, (idx / total) * 100)); })()}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </motion.div>
              </div>
              
              {/* Set Markers */}
              <div className="flex justify-between mt-2">
                {Array.from({ length: currentExercise?.sets?.length || 1 }, (_, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${
                      index < session.currentSetIndex 
                        ? 'bg-red-500' 
                        : index === session.currentSetIndex 
                        ? 'bg-red-400 animate-pulse' 
                        : 'bg-gray-600'
                    }`}></div>
                    <span className="text-xs text-gray-400 mt-1">{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exercise Instructions */}
          {currentExercise?.exerciseDetails?.instructions && (
            <div className="mb-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Instructions
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {currentExercise.exerciseDetails.instructions}
              </p>
            </div>
          )}

          {/* Form Tips */}
          {currentExercise?.exerciseDetails?.formTips && currentExercise.exerciseDetails.formTips.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Form Tips
              </h3>
              <div className="space-y-3">
                {currentExercise.exerciseDetails.formTips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3 bg-gray-800/30 p-3 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300 text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {currentExercise?.exerciseDetails?.commonMistakes && currentExercise.exerciseDetails.commonMistakes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Common Mistakes
              </h3>
              <div className="space-y-3">
                {currentExercise.exerciseDetails.commonMistakes.map((mistake, index) => (
                  <div key={index} className="flex items-start space-x-3 bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-300 text-sm">{mistake}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Modern Workout Controls */}
        <div className="space-y-6">
          {/* Main Action Button - Large and Prominent */}
          <div className="flex justify-center">
            <motion.button
              onClick={handleSetComplete}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-6 px-12 rounded-2xl font-bold text-xl transition-all shadow-2xl shadow-red-500/30 relative overflow-hidden group"
            >
              {/* Button Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-3">
                {session.currentSetIndex >= (currentExercise?.sets?.length || 1) - 1 ? (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Complete Exercise</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Complete Set</span>
                  </>
                )}
              </div>
            </motion.button>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center">
            {/* Previous Exercise */}
            {session.currentExerciseIndex > 0 ? (
              <motion.button
                onClick={handlePreviousExercise}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 py-3 px-6 rounded-xl font-medium transition-all border border-gray-700/50 group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </motion.button>
            ) : (
              <div className="w-32"></div>
            )}

            {/* Exercise Counter */}
            <div className="text-center">
              <div className="text-sm text-gray-400">Exercise</div>
              <div className="text-2xl font-bold text-white">
                {session.currentExerciseIndex + 1} / {session.totalExercises}
              </div>
            </div>

            {/* Next Exercise */}
            {session.currentExerciseIndex < session.totalExercises - 1 ? (
              <motion.button
                onClick={handleNextExercise}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 py-3 px-6 rounded-xl font-medium transition-all border border-gray-700/50 group"
              >
                <span>Next</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            ) : (
              <div className="w-32"></div>
            )}
          </div>
        </div>

        {/* Save Max on Log Option */}
        <div className="flex items-center justify-center gap-3 text-sm text-gray-300 mb-6">
          <input
            id="saveMaxOnLog"
            type="checkbox"
            checked={saveMaxOnLog}
            onChange={(e) => setSaveMaxOnLog(e.target.checked)}
            className="accent-red-500"
          />
          <label htmlFor="saveMaxOnLog">Save updated max on Log Workout</label>
        </div>

        {/* Bottom Controls - Modern Design */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <motion.button
            onClick={handlePauseResume}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 py-3 px-6 rounded-xl font-medium transition-all border border-gray-700/50 group"
          >
            {isPaused ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Resume</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pause</span>
              </>
            )}
          </motion.button>
          
          <motion.button
            onClick={handleCompleteWorkout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-3 px-6 rounded-xl font-medium transition-all border border-green-500/30 group"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Complete Workout</span>
          </motion.button>
          
          <motion.button
            onClick={handleCancelWorkout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 px-6 rounded-xl font-medium transition-all border border-red-500/30 group"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Cancel</span>
          </motion.button>
        </div>

        {/* Auto-save indicator */}
        <div className="fixed bottom-4 right-4">
          {isUpdating ? (
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="text-sm">Saving progress...</span>
              </div>
            </div>
          ) : lastSaved ? (
            <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg shadow-lg border border-green-500/30">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Progress saved</span>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}