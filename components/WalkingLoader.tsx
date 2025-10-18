'use client';

import React from 'react';

export default function WalkingLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_12px_rgba(255,56,56,0.25)]"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id="lg" x1="0" x2="1">
            <stop offset="0%" stopColor="#ff3838" />
            <stop offset="100%" stopColor="#FF4500" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Platform shadow */}
        <ellipse cx="60" cy="100" rx="26" ry="7" fill="#000" opacity="0.25">
          <animate attributeName="rx" values="22;26;22" dur="1.4s" repeatCount="indefinite" />
        </ellipse>

        {/* SQUATTER with barbell and plates */}
        <g id="squatter">
          {/* Whole system (bar + body) moves together */}
          <g>
            {/* Bar */}
            <rect x="20" y="44" width="80" height="4" rx="2" fill="url(#lg)" filter="url(#glow)" />
            {/* Left plates */}
            <g transform="translate(24 46)" fill="none" stroke="url(#lg)" strokeWidth="3">
              <circle r="8" />
              <circle r="5" opacity="0.8" />
              <circle r="2" opacity="0.7" />
            </g>
            {/* Right plates */}
            <g transform="translate(96 46)" fill="none" stroke="url(#lg)" strokeWidth="3">
              <circle r="8" />
              <circle r="5" opacity="0.8" />
              <circle r="2" opacity="0.7" />
            </g>

            {/* Body */}
            {/* Head - filled for better visibility */}
            <circle cx="60" cy="28" r="11" fill="url(#lg)" stroke="#ffb3a3" strokeOpacity="0.12" strokeWidth="2" filter="url(#glow)" />
            {/* Neck/Torso */}
            <path d="M60 38 L60 70" stroke="url(#lg)" strokeWidth="7" strokeLinecap="round" filter="url(#glow)" />

            {/* Arms fixed to bar on shoulders */}
            {/* Arms - offset under the bar so they are visible */}
            <g strokeLinecap="round" stroke="url(#lg)" strokeWidth="7" filter="url(#glow)">
              {/* Left arm from shoulder to grip */}
              <path d="M60 46 L50 50" />
              {/* Right arm */}
              <path d="M60 46 L70 50" />
            </g>
            {/* Hands (grips) */}
            <g fill="url(#lg)">
              <circle cx="50" cy="50" r="3" />
              <circle cx="70" cy="50" r="3" />
            </g>

            {/* Leg mechanics: hips slightly apart for visibility */}
            {/* BACK OUTLINE (thicker dark stroke for contrast) */}
            <g stroke="#000" strokeOpacity="0.5" strokeWidth="11" strokeLinecap="round">
              {/* Left leg (hip at 56,70) */}
              <g transform="translate(56 70)">
                <g>
                  <path d="M0 0 L 0 18">
                    <animateTransform attributeName="transform" type="rotate" values="0; 35; 0" dur="1.4s" repeatCount="indefinite" />
                  </path>
                </g>
                <g transform="translate(0 18)">
                  <path d="M0 0 L 0 18">
                    <animateTransform attributeName="transform" type="rotate" values="0; -35; 0" dur="1.4s" repeatCount="indefinite" />
                  </path>
                  <g transform="translate(0 18)" strokeWidth="10">
                    <path d="M -10 0 L 10 0" />
                  </g>
                </g>
              </g>
              {/* Right leg (hip at 64,70) */}
              <g transform="translate(64 70)">
                <g>
                  <path d="M0 0 L 0 18">
                    <animateTransform attributeName="transform" type="rotate" values="0; -35; 0" dur="1.4s" repeatCount="indefinite" />
                  </path>
                </g>
                <g transform="translate(0 18)">
                  <path d="M0 0 L 0 18">
                    <animateTransform attributeName="transform" type="rotate" values="0; 35; 0" dur="1.4s" repeatCount="indefinite" />
                  </path>
                  <g transform="translate(0 18)" strokeWidth="10">
                    <path d="M -10 0 L 10 0" />
                  </g>
                </g>
              </g>
            </g>
            {/* FRONT LEG STROKES (gradient) */}
            <g stroke="url(#lg)" strokeWidth="8" strokeLinecap="round" filter="url(#glow)">
              {/* Left leg (hip at 56,70) */}
              <g transform="translate(56 70)">
                <g>
                  <path d="M0 0 L 0 18">
                    <animateTransform attributeName="transform" type="rotate" values="0; 35; 0" dur="1.4s" repeatCount="indefinite" />
                  </path>
                </g>
                <g transform="translate(0 18)">
                  <path d="M0 0 L 0 18">
                    <animateTransform attributeName="transform" type="rotate" values="0; -35; 0" dur="1.4s" repeatCount="indefinite" />
                  </path>
                  <g transform="translate(0 18)" strokeWidth="7">
                    <path d="M -10 0 L 10 0" />
                  </g>
                </g>
              </g>
              {/* Right leg (hip at 64,70) */}
              <g transform="translate(64 70)">
                <g>
                  <path d="M0 0 L 0 18">
                    <animateTransform attributeName="transform" type="rotate" values="0; -35; 0" dur="1.4s" repeatCount="indefinite" />
                  </path>
                </g>
                <g transform="translate(0 18)">
                  <path d="M0 0 L 0 18">
                    <animateTransform attributeName="transform" type="rotate" values="0; 35; 0" dur="1.4s" repeatCount="indefinite" />
                  </path>
                  <g transform="translate(0 18)" strokeWidth="7">
                    <path d="M -10 0 L 10 0" />
                  </g>
                </g>
              </g>
            </g>
            {/* Depth motion for the whole system */}
            <animateTransform attributeName="transform" type="translate" values="0 0; 0 10; 0 0" dur="1.4s" repeatCount="indefinite" />
          </g>
        </g>

        {/* Effort pulse */}
        <circle cx="60" cy="52" r="6" fill="none" stroke="url(#lg)" strokeWidth="2" opacity="0.45">
          <animate attributeName="r" values="5.5;7;5.5" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.6;0.35" dur="1.4s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div className="mt-3 text-gray-300 text-sm">{label}</div>
    </div>
  );
}


