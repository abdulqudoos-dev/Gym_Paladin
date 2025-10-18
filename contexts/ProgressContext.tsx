"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface ProgressState {
  [key: string]: {
    status: 'not-started' | 'in-progress' | 'completed' | 'cancelled';
    percentage: number;
    exercisesCompleted: number;
    totalExercises: number;
    lastCompleted?: Date;
    caloriesBurned?: number;
    totalDuration?: number;
    sessionId?: string;
    currentExerciseIndex?: number;
    currentSetIndex?: number;
  };
}

interface ProgressContextType {
  progress: ProgressState;
  updateProgress: (key: string, progress: Partial<ProgressState[string]>) => void;
  refreshProgress: (programId: string) => Promise<void>;
  isLoading: boolean;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateProgress = useCallback((key: string, progressUpdate: Partial<ProgressState[string]>) => {
    setProgress(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...progressUpdate
      }
    }));
  }, []);

  const refreshProgress = useCallback(async (programId: string) => {
    if (!programId) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/progress/${programId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProgress(data.progress || {});
        }
      }
    } catch (error) {
      console.error('Error refreshing progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for progress updates from other components
  useEffect(() => {
    const handleProgressUpdate = (event: CustomEvent) => {
      const { sessionId, week, day, workoutIndex, exercisesCompleted, totalExercises } = event.detail;
      const key = `${week}-${day}-${workoutIndex}`;
      
      // Calculate percentage consistently
      const percentage = totalExercises > 0 ? Math.round((exercisesCompleted / totalExercises) * 100) : 0;
      
      updateProgress(key, {
        exercisesCompleted,
        totalExercises,
        percentage,
        status: exercisesCompleted === totalExercises ? 'completed' : 'in-progress'
      });
      
      console.log(`Progress updated for ${key}: ${exercisesCompleted}/${totalExercises} (${percentage}%)`);
    };

    const handleWorkoutCompleted = (event: CustomEvent) => {
      const { week, day, workoutIndex, exercisesCompleted, totalExercises } = event.detail;
      const key = `${week}-${day}-${workoutIndex}`;
      
      updateProgress(key, {
        status: 'completed',
        percentage: 100,
        exercisesCompleted,
        totalExercises,
        lastCompleted: new Date()
      });
      
      console.log(`Workout completed for ${key}: ${exercisesCompleted}/${totalExercises} (100%)`);
    };

    window.addEventListener('workoutProgressUpdated', handleProgressUpdate as EventListener);
    window.addEventListener('workoutCompleted', handleWorkoutCompleted as EventListener);

    return () => {
      window.removeEventListener('workoutProgressUpdated', handleProgressUpdate as EventListener);
      window.removeEventListener('workoutCompleted', handleWorkoutCompleted as EventListener);
    };
  }, [updateProgress]);

  return (
    <ProgressContext.Provider value={{ progress, updateProgress, refreshProgress, isLoading }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
