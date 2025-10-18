'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AdminExercisesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user.role !== 'admin') {
            router.push('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }}
        className="mb-2"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Exercise Management</h1>
        <p className="text-gray-400">Manage exercises in the system</p>
      </motion.div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-gray-700">
        <div className="text-center py-8 sm:py-12">
          <div className="text-5xl sm:text-6xl mb-4">🏋️‍♂️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Exercise Management</h2>
          <p className="text-gray-400 mb-6">This feature is coming soon!</p>
          <p className="text-sm text-gray-500">You&apos;ll be able to create, edit, and manage exercises here.</p>
        </div>
      </div>
    </div>
  );
}
