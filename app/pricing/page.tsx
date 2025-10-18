'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import SubscriptionCard from '@/components/SubscriptionCard';

export default function PricingPage() {

  const pricingTiers = [
    {
      title: 'FOUNDATIONS',
      planId: 'foundations',
      description: 'Our Pro Plan Offers Advanced Workouts And Personalized Coaching To Help You Achieve Your Goals Faster. Sign Up Right Now!',
      monthlyPrice: '12$',
      payhipProductId: 'RvyZG', // Foundations Membership Product ID
      features: [
        { text: 'Access To All Of Our Exercise Videos', included: true },
        { text: 'Progress Tracking', included: true },
        { text: 'Supportive Online Community', included: true },
        { text: 'Advanced, Personalized Workout Plans', included: true },
        { text: 'Comprehensive Nutrition Coaching', included: true },
        { text: 'Access To Advanced Workout Programs', included: true },
        { text: 'Body Composition Analysis', included: true },
        { text: '24/7 Email Support', included: false },
      ],
      highlighted: false,
      ctaLink: '/auth/signup',
    },
    {
      title: 'ADVANCED ACCELERATOR',
      planId: 'advanced',
      description: 'Experience A Fully Tailored Fitness Experience With Our Custom Plan. Work One-On-One With A Dedicated Trainer To Achieve Your Goals.',
      monthlyPrice: '20$',
      payhipProductId: '36pC1', // Advanced Accelerator Membership Product ID
      features: [
        { text: 'Access To All Of Our Exercise Videos', included: true },
        { text: 'Progress Tracking', included: true },
        { text: 'Supportive Online Community', included: true },
        { text: 'Fully Customized Workout And Nutrition Plan', included: true },
        { text: 'Weekly Check-Ins With Your Trainer', included: true },
        { text: 'Access To All Platform Features', included: true },
        { text: 'Exclusive Gear Discounts', included: true },
        { text: 'Priority 24/7 Support', included: true },
      ],
      highlighted: true,
      ctaLink: '/auth/signup',
    },
    {
      title: 'CUSTOM COACHING',
      planId: 'custom',
      description: 'Get the ultimate personalized fitness experience with dedicated one-on-one coaching, custom programming, and premium support to maximize your results.',
      monthlyPrice: '30$',
      payhipProductId: 'TvSb8', // Custom Coaching Membership Product ID
      features: [
        { text: 'Everything in Advanced Accelerator', included: true },
        { text: 'Dedicated Personal Trainer', included: true },
        { text: '100% Custom Workout Programming', included: true },
        { text: 'Daily Check-ins & Accountability', included: true },
        { text: 'Custom Meal Plans & Macro Tracking', included: true },
        { text: 'Video Form Checks & Feedback', included: true },
        { text: 'Monthly Body Composition Analysis', included: true },
        { text: 'VIP Community Access', included: true },
      ],
      highlighted: false,
      ctaLink: '/auth/signup',
    },
  ];

  const comparisonFeatures = [
    'Exercise Video Library',
    'Progress Tracking Dashboard',
    'Community Forum Access',
    'Personalized Workout Plans',
    'Nutrition Coaching',
    'Advanced Workout Programs',
    'Body Composition Analysis',
    'Weekly Trainer Check-ins',
    'Custom Meal Plans',
    'Dedicated Personal Trainer',
    'Video Form Checks',
    '24/7 Priority Support',
  ];

  return (
    <div className="min-h-screen bg-dark-500">

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gym-gradient" />
        
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

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              Choose Your <span className="text-primary-500 animate-glow">Path</span>
            </h1>
            <p className="text-gray-300 text-xl mb-8 leading-relaxed">
              Select The Perfect Plan To Transform Your Body And Achieve Your Fitness Goals. All Plans Include Access To Our Expert Coaches And Supportive Community.
            </p>

          </motion.div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-12 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <SubscriptionCard
                key={tier.title}
                title={tier.title}
                description={tier.description}
                price={tier.monthlyPrice}
                period="/MONTH"
                features={tier.features}
                highlighted={tier.highlighted}
                ctaText="Subscribe Now"
                ctaLink={tier.ctaLink}
                payhipProductId={tier.payhipProductId}
                planId={tier.planId}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-20 bg-dark-400">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-4">
              <span className="bg-primary-500/10 text-primary-500 px-4 py-2 rounded-full text-sm font-semibold">
                DETAILED COMPARISON
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Compare <span className="text-primary-500">Plans</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              See what's included in each plan at a glance and choose the perfect fit for your fitness journey
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto overflow-x-auto"
          >
            <table className="w-full bg-dark-300 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-dark-200">
                  <th className="text-left p-6 text-white font-bold">Features</th>
                  {pricingTiers.map((tier) => (
                    <th key={tier.title} className="p-6 text-center">
                      <div className="text-white font-bold text-lg">{tier.title}</div>
                      <div className="text-primary-500 text-2xl font-bold mt-2">
                        {tier.monthlyPrice}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, index) => (
                  <motion.tr
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-t border-dark-200 hover:bg-dark-400/50 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{feature}</td>
                  {pricingTiers.map((tier) => {
                    const hasFeature = tier.features.some(
                      (f) => f.text.includes(feature.split(' ')[0]) && f.included
                    );
                    return (
                      <td key={tier.title} className="p-4 text-center">
                        {hasFeature || index < 3 ? (
                          <svg className="w-6 h-6 text-primary-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : index < 7 && tier.title !== 'FOUNDATIONS' ? (
                          <svg className="w-6 h-6 text-primary-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : index >= 9 && tier.title === 'CUSTOM COACHING' ? (
                          <svg className="w-6 h-6 text-primary-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                    );
                  })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Frequently Asked <span className="text-primary-500">Questions</span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                q: 'Can I switch plans at any time?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
              },
              {
                q: 'Is there a free trial available?',
                a: 'We offer a 7-day free trial for all new members. No credit card required to start!',
              },
              {
                q: 'What if I\'m not satisfied with my plan?',
                a: 'We offer a 30-day money-back guarantee. If you\'re not completely satisfied, we\'ll refund your purchase.',
              },
              {
                q: 'Do you offer student or military discounts?',
                a: 'Yes! We offer 20% off for students and military personnel. Contact us for your discount code.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-dark-300 rounded-2xl p-6 border border-dark-200 hover:border-primary-500/50 transition-all"
              >
                <h3 className="text-xl font-bold text-white mb-3">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-orange opacity-10" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Ready to <span className="text-primary-500">Transform</span> Your Body?
            </h2>
            <p className="text-gray-300 text-xl mb-8">
              Join thousands of members who have already started their fitness journey with PALADIN
            </p>
            <Link href="/auth/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold px-12 py-5 rounded-full text-lg shadow-2xl hover:shadow-primary-500/50 transition-all duration-300"
              >
                Start Your Free Trial
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
