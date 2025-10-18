'use client';

import { motion } from 'framer-motion';

interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  exerciseDetails?: any;
  order: number;
  sets: Array<{
    reps: number;
    weight: number;
    restTime: number;
    percent?: number;
    completedAt?: Date;
    notes: string;
    isCompleted: boolean;
  }>;
  isCompleted: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

interface ExerciseDetailsProps {
  exercise: SessionExercise;
  currentSet: number;
  totalSets: number;
  onSetComplete: () => void;
  onExerciseComplete: () => void;
  onPreviousExercise: () => void;
  onNextExercise: () => void;
  onStartRest: (duration: number) => void;
  isPaused: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentMax?: number | '';
}

export default function ExerciseDetails({
  exercise,
  currentSet,
  totalSets,
  onSetComplete,
  onExerciseComplete,
  onPreviousExercise,
  onNextExercise,
  onStartRest,
  isPaused,
  canGoPrevious,
  canGoNext,
  currentMax
}: ExerciseDetailsProps) {
  const currentSetData = exercise.sets[currentSet];
  const isLastSet = currentSet >= totalSets - 1;
  const isLastExercise = exercise.order === totalSets; // Assuming this is passed correctly

  const roundToNearest5 = (value: number) => Math.round(value / 5) * 5;
  const computedWeight = (() => {
    if (currentMax === '' || !currentSetData) return undefined;
    if (typeof currentSetData.percent === 'number') {
      const decimal = currentSetData.percent > 1 ? currentSetData.percent / 100 : currentSetData.percent;
      return roundToNearest5(decimal * Number(currentMax));
    }
    if (typeof currentSetData.weight === 'number' && currentSetData.weight > 0) {
      return roundToNearest5(currentSetData.weight);
    }
    return undefined;
  })();

  const handleSetComplete = () => {
    onSetComplete();
    
    // Start rest timer if not the last set
    if (!isLastSet && currentSetData?.restTime) {
      onStartRest(currentSetData.restTime);
    }
  };

  const handleExerciseComplete = () => {
    onExerciseComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-dark-300/80 to-dark-400/80 backdrop-blur-md rounded-3xl p-8 border border-dark-200/50 shadow-2xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Exercise Info */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {exercise.exerciseDetails?.name || exercise.exerciseName || 'Exercise'}
            </h2>
            <div className="flex items-center space-x-3">
              <div className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-sm font-medium">
                Set {currentSet + 1} of {totalSets}
              </div>
              <div className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-sm font-medium">
                Exercise {exercise.order}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Set Progress</span>
              <span>{Math.round(((currentSet + 1) / totalSets) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-dark-400/50 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-primary-500 to-accent-orange h-3 rounded-full transition-all duration-500"
                style={{ width: `${((currentSet + 1) / totalSets) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Reps/Weight Display */}
            <div className="bg-dark-400/50 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {currentSetData?.reps || 10} reps
              </div>
              <div className="text-gray-400">Target Reps</div>
            {typeof computedWeight === 'number' && (
                <div className="text-lg text-gray-300 mt-2">
                  {computedWeight} lbs
                </div>
              )}
            </div>

            {/* Exercise Instructions */}
            <div className="bg-dark-400/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Instructions</h3>
              <p className="text-gray-300 leading-relaxed">
                {exercise.exerciseDetails?.instructions || 
                 `Complete ${currentSetData?.reps || 10} reps with proper form. Focus on controlled movement and full range of motion.`}
              </p>
            </div>

          {/* Per-set targets preview */}
          <div className="bg-dark-400/30 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Set Targets</h3>
            <div className="grid grid-cols-3 text-sm text-gray-300 mb-2">
              <div className="font-medium">Set</div>
              <div className="font-medium">Reps</div>
              <div className="font-medium">Target Weight</div>
            </div>
            <div className="space-y-1">
              {exercise.sets.map((s, idx) => {
                let target: number | undefined = undefined;
                if (typeof currentMax === 'number' && typeof s.percent === 'number') {
                  const dec = s.percent > 1 ? s.percent / 100 : s.percent;
                  target = Math.round((dec * currentMax) / 5) * 5;
                } else if (typeof s.weight === 'number' && s.weight > 0) {
                  target = Math.round(s.weight / 5) * 5;
                }
                return (
                  <div key={idx} className="grid grid-cols-3 text-sm text-gray-300">
                    <div>Set {idx + 1}</div>
                    <div>{s.reps || '-'}</div>
                    <div>{typeof target === 'number' ? `${target} lbs` : '-'}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">Weights are based on your max and hidden percentages, rounded to nearest 5.</p>
          </div>

            {/* Form Tips */}
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30">
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Form Tips</h3>
              <ul className="space-y-2">
                {exercise.exerciseDetails?.formTips && exercise.exerciseDetails.formTips.length > 0 ? (
                  exercise.exerciseDetails.formTips.map((tip, index) => (
                    <li key={index} className="text-blue-300 flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      {tip}
                    </li>
                  ))
                ) : (
                  <>
                    <li className="text-blue-300 flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Maintain proper posture throughout the movement
                    </li>
                    <li className="text-blue-300 flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Control the weight on both the lifting and lowering phases
                    </li>
                    <li className="text-blue-300 flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Breathe out during the exertion, breathe in during the return
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side - Controls */}
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Exercise Demo Placeholder */}
          <div className="relative w-full max-w-md aspect-square bg-dark-400/30 rounded-3xl overflow-hidden">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-400">Exercise Demo</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-4">
            {/* Navigation Buttons */}
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPreviousExercise}
                disabled={!canGoPrevious}
                className="flex-1 bg-gray-600/50 text-white font-medium py-3 px-4 rounded-xl hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNextExercise}
                disabled={!canGoNext}
                className="flex-1 bg-gray-600/50 text-white font-medium py-3 px-4 rounded-xl hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </motion.button>
            </div>

            {/* Complete Set Button */}
            {!isLastSet && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSetComplete}
                disabled={isPaused}
                className="w-full bg-gradient-to-r from-primary-500 to-accent-orange text-white font-bold py-4 px-8 rounded-2xl hover:shadow-lg hover:shadow-primary-500/30 transition-all text-lg disabled:opacity-50"
              >
                Complete Set
              </motion.button>
            )}

            {/* Complete Exercise Button */}
            {isLastSet && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExerciseComplete}
                disabled={isPaused}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 px-8 rounded-2xl hover:shadow-lg hover:shadow-green-500/30 transition-all text-lg disabled:opacity-50"
              >
                Complete Exercise
              </motion.button>
            )}

            {/* Pause Indicator */}
            {isPaused && (
              <div className="text-center py-4">
                <div className="text-yellow-400 text-lg font-semibold mb-2">Workout Paused</div>
                <p className="text-gray-400 text-sm">Resume when ready to continue</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}