'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Feature {
  text: string;
  included: boolean;
}

interface SubscriptionCardProps {
  title: string;
  description: string;
  price: string;
  period?: string;
  features: Feature[];
  highlighted?: boolean;
  ctaText?: string;
  ctaLink?: string;
  payhipProductId?: string;
  planId?: string;
  index?: number;
}

export default function SubscriptionCard({
  title,
  description,
  price,
  period = '/USDT',
  features,
  highlighted = false,
  ctaText = 'Choose This Plan',
  ctaLink = '#',
  payhipProductId,
  planId,
  index = 0,
}: SubscriptionCardProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      setIsLoggedIn(true);
      // Get user email from token payload (avoid extra API call)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) {
          setUserEmail(payload.email);
        }
      } catch (error) {
        // If token parsing fails, fallback to API call
        fetchUserEmail(token);
      }
    }
  }, []);

  const fetchUserEmail = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const user = data.user || data;
        setUserEmail(user.email);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const getCheckoutUrl = () => {
    // If Payhip product ID is provided, use Payhip checkout
    if (payhipProductId && payhipProductId !== 'XXXXX') {
      let url = `https://payhip.com/b/${payhipProductId}`;
      // Pre-fill email if user is logged in
      if (userEmail) {
        url += `?email=${encodeURIComponent(userEmail)}`;
      }
      return url;
    }
    // Otherwise use the provided ctaLink (signup page)
    return ctaLink;
  };

  const handleSubscribeClick = (e: React.MouseEvent) => {
    const checkoutUrl = getCheckoutUrl();
    
    // If it's a Payhip URL, open in same tab
    if (checkoutUrl.includes('payhip.com')) {
      window.location.href = checkoutUrl;
      e.preventDefault();
    }
    // Otherwise let Link handle it normally
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className={`relative rounded-3xl p-8 transition-all duration-500 group ${
        highlighted
          ? 'bg-gradient-to-br from-dark-200 via-dark-300 to-dark-400 border-2 border-primary-500 shadow-2xl shadow-primary-500/30 scale-105'
          : 'bg-gradient-to-br from-dark-300 to-dark-400 border-2 border-dark-200 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/20'
      }`}
    >
      {/* Highlighted Badge */}
      {highlighted && (
        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="bg-gradient-to-r from-accent-orange to-primary-500 text-white px-8 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            MOST POPULAR
          </motion.div>
        </div>
      )}

      {/* Glow Effect for Highlighted */}
      {highlighted && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500/20 to-accent-orange/20 blur-xl -z-10" />
      )}

      {/* Price Section - Top */}
      <div className="text-center mb-6 pb-6 border-b border-gray-700/50">
        <div className="text-sm font-semibold text-primary-500 mb-2 uppercase tracking-wider">
          {highlighted ? 'Best Value' : 'Premium Plan'}
        </div>
        <h3 className="text-2xl font-bold mb-4 text-white">
          {title}
        </h3>
        <div className="flex items-end justify-center gap-1">
          <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-500 to-accent-orange bg-clip-text text-transparent">
            {price}
          </span>
          <span className="text-gray-400 mb-3 text-lg">
            {period}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-center mb-6 leading-relaxed text-sm">
        {description}
      </p>

      {/* CTA Button - Middle */}
      <Link href={getCheckoutUrl()} onClick={handleSubscribeClick}>
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-4 rounded-xl font-bold text-lg mb-8 transition-all duration-300 relative overflow-hidden group/btn ${
            highlighted
              ? 'bg-gradient-to-r from-primary-500 to-accent-orange text-white shadow-lg shadow-primary-500/30'
              : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-primary-500 hover:to-accent-orange shadow-lg'
          }`}
        >
          <span className="relative z-10">
            {payhipProductId && payhipProductId !== 'XXXXX' && isLoggedIn 
              ? 'Subscribe Now' 
              : !isLoggedIn 
                ? 'Sign Up to Subscribe'
                : ctaText
            }
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-accent-orange to-primary-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
        </motion.button>
      </Link>

      {/* Features List */}
      <div className="space-y-4">
        <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          What's Included
        </div>
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-start group/item"
            >
              <div className={`flex-shrink-0 w-5 h-5 rounded-full mr-3 mt-0.5 flex items-center justify-center ${
                feature.included
                  ? 'bg-primary-500/20 text-primary-500'
                  : 'bg-gray-700 text-gray-600'
              }`}>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d={feature.included ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}
                  />
                </svg>
              </div>
              <span className={`text-sm leading-relaxed ${
                feature.included ? 'text-gray-300' : 'text-gray-600 line-through'
              }`}>
                {feature.text}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
