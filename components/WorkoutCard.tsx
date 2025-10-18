'use client';

import { motion } from 'framer-motion';
import { Play, CheckCircle, Clock, Flame } from 'lucide-react';

interface WorkoutCardProps {
  workout: {
    workoutId: {
      _id: string;
      title: string;
      description?: string;
      difficulty?: string;
      exercises?: Array<any>;
      duration?: number;
    };
    order: number;
  };
  week: number;
  day: number;
  workoutIndex: number;
  completionStatus: 'not-started' | 'in-progress' | 'completed';
  completionPercentage: number;
  onStartWorkout: (week: number, day: number, workoutIndex: number) => void;
}

export default function WorkoutCard({
  workout,
  week,
  day,
  workoutIndex,
  completionStatus,
  completionPercentage,
  onStartWorkout
}: WorkoutCardProps) {
  const getStatusColor = () => {
    switch (completionStatus) {
      case 'completed':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'in-progress':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      default:
        return 'from-dark-400/20 to-dark-500/20 border-dark-300/30';
    }
  };

  const getStatusIcon = () => {
    switch (completionStatus) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return <Play className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (completionStatus) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-br ${getStatusColor()} backdrop-blur-md rounded-2xl p-4 border min-w-[280px] max-w-[320px] hover:scale-105 transition-all duration-300 cursor-pointer group`}
      onClick={() => onStartWorkout(week, day, workoutIndex)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
            {workout.workoutId.title}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {workout.workoutId.description || 'Workout session'}
          </p>
        </div>
        <div className="ml-3">
          {getStatusIcon()}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Progress</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="w-full bg-dark-400/30 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${
              completionStatus === 'completed' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : completionStatus === 'in-progress'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                : 'bg-gradient-to-r from-gray-500 to-gray-600'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-gray-300">
              {workout.workoutId.exercises?.length || 0} exercises
            </span>
          </div>
          <div className="text-gray-400">
            {workout.workoutId.duration || 30} min
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {getStatusText()}
        </div>
      </div>

      {/* Difficulty Badge */}
      {workout.workoutId.difficulty && (
        <div className="mt-3 flex justify-between items-center">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            workout.workoutId.difficulty === 'Beginner' 
              ? 'bg-green-500/20 text-green-400'
              : workout.workoutId.difficulty === 'Intermediate'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {workout.workoutId.difficulty}
          </span>
          <span className="text-xs text-gray-500">
            Week {week}, Day {day}
          </span>
        </div>
      )}

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-accent-orange/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}
