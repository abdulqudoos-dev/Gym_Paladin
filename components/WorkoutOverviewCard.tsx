'use client';

import { motion } from 'framer-motion';
import CountUpAnimation from '@/components/CountUpAnimation';

interface WorkoutOverviewCardProps {
  title: string;
  progress: number; // 0-100
  elapsedTime: number;
  totalTime: number;
  caloriesBurned: number;
  exercisesCompleted: number;
  totalExercises: number;
  showCalories?: boolean; // Only show calories when workout is completed
}

export default function WorkoutOverviewCard({
  title,
  progress,
  elapsedTime,
  totalTime,
  caloriesBurned,
  exercisesCompleted,
  totalExercises,
  showCalories = false
}: WorkoutOverviewCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-dark-300/80 to-dark-400/80 backdrop-blur-md rounded-3xl p-8 border border-dark-200/50 mb-8 shadow-2xl"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between">
        {/* Left Side - Title and Progress */}
        <div className="flex-1 mb-6 lg:mb-0">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <div className="flex items-center space-x-4">
            {/* Circular Progress Ring */}
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  style={{
                    strokeDasharray: circumference,
                  }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Exercise Progress */}
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-400">
                <CountUpAnimation end={exercisesCompleted} duration={1000} />
                <span className="text-white">/{totalExercises}</span>
              </div>
              <div className="text-sm text-gray-400">Exercises</div>
            </div>
          </div>
        </div>

        {/* Right Side - Stats */}
        <div className="flex flex-col sm:flex-row lg:flex-col space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-0 lg:space-y-4">
          {/* Duration */}
          <div className="bg-dark-400/50 rounded-2xl p-4 text-center min-w-[120px]">
            <div className="text-2xl font-bold text-white mb-1">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-gray-400">Duration</div>
            <div className="text-xs text-gray-500 mt-1">
              of {formatTime(totalTime)}
            </div>
          </div>

      {/* Calories - Only show when workout is completed */}
      {showCalories && (
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-4 text-center min-w-[120px] border border-orange-500/30">
          <div className="text-2xl font-bold text-orange-400 mb-1">
            <CountUpAnimation end={caloriesBurned} duration={1500} />
          </div>
          <div className="text-sm text-gray-400">Calories</div>
          <div className="text-xs text-orange-300 mt-1">Burned</div>
        </div>
      )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-dark-400/50 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-primary-500 to-accent-orange h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
