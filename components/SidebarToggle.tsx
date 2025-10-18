'use client';

import { motion } from 'framer-motion';

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  variant?: 'sidebar' | 'navbar';
}

export default function SidebarToggle({ 
  isOpen, 
  onToggle, 
  variant = 'sidebar' 
}: SidebarToggleProps) {
  if (variant === 'navbar') {
    return (
      <button
        onClick={onToggle}
        className="p-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white transition-colors"
        title={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    );
  }

  return (
    <div className="absolute -right-3 top-6 z-[60]">
      <button
        onClick={onToggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-2 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600 text-white border-red-400' 
            : 'bg-gray-800 hover:bg-gray-700 text-white border-gray-400'
        }`}
        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </motion.svg>
      </button>
    </div>
  );
}
