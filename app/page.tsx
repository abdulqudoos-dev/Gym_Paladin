'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import SubscriptionCard from '@/components/SubscriptionCard';
import TestimonialSlider from '@/components/TestimonialSlider';
import FeatureIcon from '@/components/FeatureIcon';
import { useState, useEffect } from 'react';

// CountUp Animation Component
function CountUpAnimation({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      // Animate from 0 to end value
      const currentCount = Math.floor(easeOutQuart * end);
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    // Start animation after a small delay to ensure component is mounted
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export default function Home() {
  const tiers = [
    {
      title: 'FOUNDATIONS',
      description: 'Our Pro Plan Offers Advanced Workouts And Personalized Coaching To Help You Achieve Your Goals Faster. Sign Up Right Now!',
      price: '12$',
      payhipProductId: 'RvyZG', // Foundations Membership Product ID
      planId: 'foundations',
      features: [
        { text: 'Access To All Of Our Exercise Videos', included: true },
        { text: 'Progress Tracking', included: true },
        { text: 'Supportive Online Community', included: true },
        { text: 'Advanced, Personalized Workout Plans', included: true },
        { text: 'Comprehensive Nutrition Coaching', included: true },
        { text: 'Access To Advanced Workout Programs', included: true },
        { text: 'Body Composition Analysis', included: true },
      ],
      highlighted: false,
    },
    {
      title: 'ADVANCED ACCELERATOR',
      description: 'Experience A Fully Tailored Fitness Experience With Our Custom Plan. Work One-On-One With A Dedicated Trainer To Achieve Your Goals.',
      price: '20$',
      payhipProductId: '36pC1', // Advanced Accelerator Membership Product ID
      planId: 'advanced',
      features: [
        { text: 'Access To All Of Our Exercise Videos', included: true },
        { text: 'Progress Tracking', included: true },
        { text: 'Supportive Online Community', included: true },
        { text: 'Fully Customized Workout And Nutrition Plan', included: true },
        { text: 'Weekly Check-Ins With Your Trainer', included: true },
        { text: 'Access To All Platform Features', included: true },
        { text: 'Exclusive Gear Discounts', included: true },
      ],
      highlighted: true,
    },
    {
      title: 'CUSTOM COACHING',
      description: 'Start Your Fitness Journey With Our Beginner Plan. Build A Strong Foundation With Basic Workouts And Essential Nutrition Guidance.',
      price: '30$',
      payhipProductId: 'TvSb8', // Custom Coaching Membership Product ID
      planId: 'custom',
      features: [
        { text: 'Access To All Of Our Exercise Videos', included: true },
        { text: 'Progress Tracking', included: true },
        { text: 'Supportive Online Community', included: true },
        { text: 'Personalized Workout Plans', included: true },
        { text: 'Basic Nutrition Guidance', included: true },
        { text: 'Access To Group Fitness Classes', included: true },
      ],
      highlighted: false,
    },
  ];

  const features = [
    {
      icon: 'chart',
      title: 'Progress Tracking',
      description: 'Monitor your fitness journey with detailed analytics and insights',
    },
    {
      icon: 'coach',
      title: 'Expert Coaching',
      description: 'Work with certified trainers who understand your goals',
    },
    {
      icon: 'target',
      title: 'Custom Programs',
      description: 'Personalized workout plans tailored to your fitness level',
    },
    {
      icon: 'mobile',
      title: 'Mobile Friendly',
      description: 'Access your workouts anytime, anywhere on any device',
    },
    {
      icon: 'nutrition',
      title: 'Nutrition Guidance',
      description: 'Comprehensive meal plans and nutritional support',
    },
    {
      icon: 'community',
      title: 'Community Support',
      description: 'Join a supportive community of like-minded fitness enthusiasts',
    },
  ];

  const testimonials = [
    {
      name: 'Steven Haward',
      role: 'Gym Trainer',
      image: 'SH',
      text: "I've been using PALADIN for the past three months, and I'm genuinely impressed. The personalized coaching has been a game-changer for me. My coach is incredibly supportive and always available to answer my questions.",
      rating: 5,
    },
    {
      name: 'Oliver Martinez',
      role: 'Fitness Enthusiast',
      image: 'OM',
      text: 'PALADIN has completely transformed my approach to fitness. The custom workout plans are challenging yet achievable, and the nutrition guidance has helped me see real results. The community support is incredible!',
      rating: 5,
    },
    {
      name: 'Edward Newey',
      role: 'Professional Athlete',
      image: 'EN',
      text: 'As a professional athlete, I need a program that can keep up with my demands. PALADIN delivers exactly that. The advanced tracking features and expert coaching have taken my performance to the next level.',
      rating: 5,
    },
    {
      name: 'Sarah Johnson',
      role: 'Weight Loss Success',
      image: 'SJ',
      text: 'Lost 30 pounds in 4 months! The personalized meal plans and weekly check-ins kept me accountable. Best investment I\'ve made in myself. The PALADIN community is so supportive and motivating.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-dark-500">

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gym-gradient" />
        
        {/* Animated background shapes */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-orange/10 rounded-full blur-3xl"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  Achieve Your{' '}
                  <span className="text-primary-500 block animate-glow">
                    FITNESS GOALS
                  </span>
                  <span className="text-white">With PALADIN</span>
                </h1>
              </motion.div>

               <motion.p
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.4 }}
                 className="text-gray-300 text-lg mb-8 leading-relaxed max-w-2xl"
               >
                 Transform your fitness journey with expert coaching and personalized programs. Ready to make a change?
               </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 mb-12"
              >
                <Link href="/pricing">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-primary-500/50 transition-all duration-300"
                  >
                    Start Your Journey
                  </motion.button>
                </Link>
                <Link href="#programs">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="border-2 border-accent-orange text-accent-orange font-bold px-8 py-4 rounded-full hover:bg-accent-orange hover:text-white transition-all duration-300"
                  >
                    Explore Programs
                  </motion.button>
                </Link>
              </motion.div>
            </div>

            {/* Right Image Section */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full h-[600px]">
                {/* Main image - completely transparent, no container */}
                <Image
                  src="/assets/Image.png"
                  alt="Fitness Professional"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                  style={{
                    objectPosition: '25% center',
                    maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 100%)'
                  }}
                />
                
                {/* Animated Circular Stats */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.2, type: "spring", bounce: 0.6 }}
                  className="absolute top-8 -right-4"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -8, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-primary-600/30 backdrop-blur-md rounded-full flex flex-col items-center justify-center shadow-xl border border-primary-500/30"
                  >
                    <div className="text-xl font-bold text-primary-500">
                      +<CountUpAnimation end={1300} duration={3000} />
                    </div>
                    <div className="text-xs text-gray-400 text-center leading-tight">Positive<br/>Reviews</div>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.4, type: "spring", bounce: 0.6 }}
                  className="absolute bottom-8 -left-4"
                >
                  <motion.div
                    animate={{ 
                      y: [0, 8, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-20 h-20 bg-gradient-to-br from-accent-orange/20 to-accent-orange/30 backdrop-blur-md rounded-full flex flex-col items-center justify-center shadow-xl border border-accent-orange/30"
                  >
                    <div className="text-xl font-bold text-accent-orange">
                      +<CountUpAnimation end={80} duration={3000} />
                    </div>
                    <div className="text-xs text-gray-400 text-center leading-tight">Expert<br/>Coaches</div>
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1.6, type: "spring", bounce: 0.6 }}
                  className="absolute top-1/2 -left-6"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-20 h-20 bg-gradient-to-br from-primary-500/20 to-primary-600/30 backdrop-blur-md rounded-full flex flex-col items-center justify-center shadow-xl border border-primary-500/30"
                  >
                    <div className="text-xl font-bold text-primary-500">
                      +<CountUpAnimation end={1000} duration={3000} />
                    </div>
                    <div className="text-xs text-gray-400 text-center leading-tight">Workout<br/>Videos</div>
                  </motion.div>
                </motion.div>
                
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Programs/Tiers Section */}
      <section id="programs" className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Our <span className="text-primary-500">Plans</span>
            </h2>
             <p className="text-gray-400 text-lg max-w-3xl mx-auto">
               Choose the perfect plan for your fitness goals. Expert guidance included.
             </p>
            
            {/* Toggle buttons */}
            <div className="flex justify-center mt-8 gap-4">
              <button className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold px-8 py-3 rounded-full">
                Monthly
              </button>
              <button className="bg-dark-300 text-gray-400 font-bold px-8 py-3 rounded-full hover:bg-dark-200 transition-colors">
                Annually
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {tiers.map((tier, index) => (
              <SubscriptionCard
                key={tier.title}
                title={tier.title}
                description={tier.description}
                price={tier.price}
                features={tier.features}
                highlighted={tier.highlighted}
                ctaText="Choose This Plan"
                ctaLink="/auth/signup"
                payhipProductId={tier.payhipProductId}
                planId={tier.planId}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-dark-400 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-orange/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="inline-block mb-6">
              <span className="bg-primary-500/10 text-primary-500 px-6 py-3 rounded-full text-sm font-semibold tracking-wider uppercase">
                Why Choose PALADIN
              </span>
            </div>
            <h2 className="text-5xl sm:text-6xl font-bold mb-6">
              Professional <span className="text-primary-500">Fitness Solutions</span>
            </h2>
             <p className="text-gray-400 text-xl max-w-4xl mx-auto leading-relaxed">
               Professional fitness solutions backed by cutting-edge technology and expert guidance
             </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group flex items-start gap-6 p-8 rounded-2xl bg-gradient-to-r from-dark-300/50 to-dark-400/50 border border-dark-200/50 hover:border-primary-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary-500/10"
              >
                {/* Icon Container */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500/20 to-accent-orange/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FeatureIcon icon={feature.icon} className="w-8 h-8 text-primary-500" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-primary-500 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-16"
          >
            <div className="max-w-3xl mx-auto">
               <h3 className="text-3xl font-bold mb-4 text-white">
                 Ready to Transform?
               </h3>
               <p className="text-gray-400 text-lg mb-8">
                 Join thousands of members achieving their fitness goals
               </p>
              <Link href="/pricing">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-primary-500 to-accent-orange text-white font-bold px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-primary-500/50 transition-all duration-300"
                >
                  Start Your Journey Today
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 relative overflow-hidden bg-dark-400">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-orange/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4">
              <span className="bg-primary-500/10 text-primary-500 px-4 py-2 rounded-full text-sm font-semibold">
                SUCCESS STORIES
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              What Our <span className="text-primary-500">Members Say</span>
            </h2>
             <p className="text-gray-400 text-lg max-w-2xl mx-auto">
               Real results from real people. Join thousands of satisfied members.
             </p>
          </motion.div>

          <TestimonialSlider testimonials={testimonials} />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-accent-orange/20 to-primary-600/20" />
        
        {/* Animated background shapes */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-orange/20 rounded-full blur-3xl"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Ready to Start Your{' '}
              <span className="bg-gradient-to-r from-primary-500 to-accent-orange bg-clip-text text-transparent">
                Transformation?
              </span>
            </h2>
             <p className="text-gray-300 text-xl mb-10 leading-relaxed">
               Join thousands of members achieving their fitness goals. 
               Start your 7-day free trial today. No credit card required.
             </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-primary-500 to-accent-orange text-white font-bold px-10 py-5 rounded-full text-lg shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 relative group overflow-hidden"
                >
                  <span className="relative z-10">Start Free Trial</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-orange to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.button>
              </Link>
              <Link href="#programs">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-gray-600 hover:border-primary-500 text-white font-bold px-10 py-5 rounded-full text-lg hover:bg-primary-500/10 transition-all duration-300"
                >
                  View All Plans
                </motion.button>
              </Link>
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>30-Day Money Back Guarantee</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
