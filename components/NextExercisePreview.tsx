'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface Exercise {
  exerciseId: string;
  exerciseName: string;
  exerciseDetails?: any;
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

interface NextExercisePreviewProps {
  nextExercise: Exercise;
  isLast: boolean;
}

export default function NextExercisePreview({
  nextExercise,
  isLast
}: NextExercisePreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-dark-300/60 to-dark-400/60 backdrop-blur-md rounded-2xl p-6 border border-dark-200/30 mb-8"
    >
      <div className="flex items-center space-x-4">
        {/* Icon */}
        <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">
              {nextExercise.exerciseDetails?.name || nextExercise.exerciseName || 'Next Exercise'}
            </h3>
            <span className="text-sm text-gray-400 bg-dark-400/50 px-2 py-1 rounded-full">
              {isLast ? 'Last Exercise' : 'Coming Up'}
            </span>
          </div>
          
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            Exercise #{nextExercise.order}
          </p>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{nextExercise.sets?.length || 0} sets</span>
            <span>•</span>
            <span>Ready to start</span>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="w-16 h-16 bg-dark-400/50 rounded-xl overflow-hidden flex-shrink-0">
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
