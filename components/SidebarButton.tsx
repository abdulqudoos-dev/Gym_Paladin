'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface SidebarButtonProps {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
}

export default function SidebarButton({ 
  href, 
  icon, 
  label, 
  isActive, 
  isCollapsed 
}: SidebarButtonProps) {
  return (
    <Link
      href={href}
      className={`flex items-center transition-all duration-300 group relative ${
        isCollapsed 
          ? 'justify-center px-3 py-3 rounded-xl' 
          : 'space-x-3 px-4 py-3 rounded-xl'
      } ${
        isActive
          ? 'bg-red-500/20 text-red-400 border-l-4 border-red-500 shadow-lg shadow-red-500/20'
          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
      }`}
      title={isCollapsed ? label : undefined}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {icon}
      </div>
      
      {/* Text - only show when sidebar is open */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="font-medium"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className={`absolute w-2 h-2 bg-red-500 rounded-full ${
            isCollapsed ? 'top-1 right-1' : 'right-2'
          }`}
        />
      )}
    </Link>
  );
}
