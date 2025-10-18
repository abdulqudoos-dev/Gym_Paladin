'use client';

import { motion } from 'framer-motion';

interface WorkoutControlsProps {
  status: 'preparing' | 'active' | 'paused' | 'completed' | 'cancelled';
  isPaused: boolean;
  onPauseResume: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onSkip: () => void;
  onRestart: () => void;
  onAddNote: () => void;
}

export default function WorkoutControls({
  status,
  isPaused,
  onPauseResume,
  onComplete,
  onCancel,
  onSkip,
  onRestart,
  onAddNote
}: WorkoutControlsProps) {
  const getMainButtonConfig = () => {
    switch (status) {
      case 'preparing':
        return {
          text: 'Start Workout',
          icon: '▶️',
          onClick: onPauseResume,
          className: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-green-500/30'
        };
      case 'active':
        return {
          text: 'Pause',
          icon: '⏸️',
          onClick: onPauseResume,
          className: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-yellow-500/30'
        };
      case 'paused':
        return {
          text: 'Resume',
          icon: '▶️',
          onClick: onPauseResume,
          className: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-green-500/30'
        };
      default:
        return {
          text: 'Complete Workout',
          icon: '✅',
          onClick: onComplete,
          className: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-green-500/30'
        };
    }
  };

  const mainButton = getMainButtonConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-dark-500 via-dark-400 to-transparent backdrop-blur-md border-t border-dark-200/50 p-6 z-50"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center space-x-4">
          {/* Side Button - Skip */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSkip}
            className="w-12 h-12 bg-dark-400/50 hover:bg-dark-300/50 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all"
            title="Skip Exercise"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.button>

          {/* Main Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={mainButton.onClick}
            className={`${mainButton.className} text-white font-bold py-4 px-8 rounded-2xl hover:shadow-lg transition-all text-lg min-w-[200px] flex items-center justify-center space-x-2`}
          >
            <span className="text-xl">{mainButton.icon}</span>
            <span>{mainButton.text}</span>
          </motion.button>

          {/* Side Button - Stop */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="w-12 h-12 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 transition-all"
            title="Cancel Workout"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" />
            </svg>
          </motion.button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-center space-x-6 mt-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm">Restart Exercise</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddNote}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="text-sm">Add Note</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
