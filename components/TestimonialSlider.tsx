'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Testimonial {
  name: string;
  role: string;
  image: string;
  text: string;
  rating: number;
}

interface TestimonialSliderProps {
  testimonials: Testimonial[];
}

export default function TestimonialSlider({ testimonials }: TestimonialSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => handleNext(), 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => setCurrentIndex((p) => (p + 1) % testimonials.length);
  const handlePrev = () => setCurrentIndex((p) => (p - 1 + testimonials.length) % testimonials.length);
  const handleDotClick = (i: number) => setCurrentIndex(i);

  return (
    <div className="relative max-w-6xl mx-auto">
      {/* 3D carousel stage */}
      <div className="relative h-[360px] md:h-[320px] -mt-28">
        {testimonials.map((t, i) => {
          const pos = ((i - currentIndex + testimonials.length) % testimonials.length) - 1; // -1,0,1
          if (Math.abs(pos) > 1) return null;
          const isCenter = pos === 0;
          const xPos = pos * 520; // add a bit more separation
          const scale = isCenter ? 1.08 : 0.88;
          const opacity = isCenter ? 1 : 0.65;
          const rotate = isCenter ? 0 : pos === -1 ? -5 : 5;
          const z = isCenter ? 40 : 15;

          return (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 w-[88%] md:w-[30rem] -translate-y-1/2"
              animate={{ x: xPos, scale, opacity, rotate, zIndex: z }}
              transition={{ type: 'spring', stiffness: 110, damping: 20, mass: 0.8 }}
              style={{ translateX: '-50%' }}
            >
              <div className={`rounded-2xl p-6 ${isCenter ? 'bg-zinc-900/70 border border-zinc-600 shadow-[0_0_60px_rgba(255,82,82,0.28)]' : 'bg-zinc-900/35 border border-zinc-700/80'} ${isCenter ? '' : 'ring-1 ring-zinc-700/60'}`}>
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-accent-orange p-0.5">
                      <div className="w-full h-full rounded-xl bg-dark-400 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">{t.image}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-300 leading-relaxed mb-4">{t.text}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-bold">{t.name}</h4>
                        <p className="text-primary-500 text-sm">{t.role}</p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, idx) => (
                          <svg key={idx} className={`w-4 h-4 ${idx < t.rating ? 'text-accent-orange' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-5 mt-20">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handlePrev} className="w-14 h-14 rounded-full bg-dark-300 border border-primary-500/30 hover:border-primary-500 hover:bg-primary-500/20 flex items-center justify-center transition-all shadow-lg shadow-black/20" aria-label="Previous testimonial">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </motion.button>
        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button key={index} onClick={() => handleDotClick(index)} className={`transition-all duration-300 rounded-full ${index === currentIndex ? 'w-8 h-3 bg-primary-500' : 'w-3 h-3 bg-dark-300 hover:bg-primary-500/50'}`} aria-label={`Go to testimonial ${index + 1}`} />
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleNext} className="w-14 h-14 rounded-full bg-dark-300 border border-primary-500/30 hover:border-primary-500 hover:bg-primary-500/20 flex items-center justify-center transition-all shadow-lg shadow-black/20" aria-label="Next testimonial">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
        </motion.button>
      </div>
    </div>
  );
}
