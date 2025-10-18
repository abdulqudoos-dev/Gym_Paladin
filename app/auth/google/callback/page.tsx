'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage('Google authentication failed. Please try again.');
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
          return;
        }

        if (success === 'true' && token) {
          // Store the token
          localStorage.setItem('token', token);
          
          // Get user info to determine redirect
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              const userData = await response.json();
              setStatus('success');
              setMessage('Successfully signed in with Google!');
              
              // Redirect based on user role
              setTimeout(() => {
                if (userData.user?.role === 'admin') {
                  router.push('/admin-dashboard');
                } else {
                  router.push('/dashboard');
                }
              }, 2000);
            } else {
              throw new Error('Failed to get user info');
            }
          } catch (error) {
            console.error('Error getting user info:', error);
            setStatus('error');
            setMessage('Authentication successful but failed to load user data.');
            setTimeout(() => {
              router.push('/auth/login');
            }, 3000);
          }
        } else {
          setStatus('error');
          setMessage('Invalid callback parameters.');
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('An error occurred during authentication.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center border border-white/20"
      >
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-4">Processing...</h2>
            <p className="text-gray-300">Completing Google authentication</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">Success!</h2>
            <p className="text-gray-300">{message}</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting you now...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
            <p className="text-gray-300">{message}</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting to login...</p>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
