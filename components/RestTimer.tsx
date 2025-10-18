'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RestTimerProps {
  duration: number; // in seconds
  onComplete: () => void;
  onSkip: () => void;
}

export default function RestTimer({ duration, onComplete, onSkip }: RestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeRemaining) / duration) * 100;
  const circumference = 2 * Math.PI * 60; // radius = 60
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-gradient-to-br from-dark-300 to-dark-400 rounded-3xl p-8 border border-dark-200/50 max-w-md w-full mx-4"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Rest Time</h2>
            <p className="text-gray-400 mb-8">Take a breather before the next set</p>

            {/* Circular Timer */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="60"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="60"
                  stroke="url(#restGradient)"
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
                  <linearGradient id="restGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#34D399" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Time Display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-1">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-400">remaining</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSkip}
                className="flex-1 bg-dark-400/50 hover:bg-dark-300/50 text-gray-400 hover:text-white font-medium py-3 px-6 rounded-xl transition-all"
              >
                Skip Rest
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onComplete}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all"
              >
                Continue
              </motion.button>
            </div>

            {/* Motivational Message */}
            <div className="mt-6 text-sm text-gray-500">
              {timeRemaining > 30 && "Great job! Keep it up!"}
              {timeRemaining <= 30 && timeRemaining > 10 && "Almost ready!"}
              {timeRemaining <= 10 && "Get ready!"}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
