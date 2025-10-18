'use client';

import React from 'react';

type GymLoaderProps = {
  label?: string;
  width?: number;
  height?: number;
};

export default function GymLoader({
  label = 'Loading... ',
  width = 180,
  height = 180,
}: GymLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        width={width}
        height={height}
        viewBox="0 0 180 180"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_12px_rgba(255,56,56,0.2)]"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#ff3838" />
            <stop offset="100%" stopColor="#FF4500" />
          </linearGradient>
        </defs>

        {/* Dumbbell loader (spins gently) */}
        <g transform="translate(90 90)">
          <g>
            {/* bar */}
            <rect x="-40" y="-4" width="80" height="8" rx="4" fill="url(#g1)" />
            {/* left plates */}
            <g transform="translate(-50 0)">
              <rect x="-2" y="-12" width="6" height="24" fill="url(#g1)" opacity="0.85" />
              <rect x="-10" y="-10" width="6" height="20" fill="url(#g1)" opacity="0.7" />
              <rect x="-16" y="-8" width="5" height="16" fill="url(#g1)" opacity="0.55" />
            </g>
            {/* right plates */}
            <g transform="translate(50 0)">
              <rect x="-4" y="-12" width="6" height="24" fill="url(#g1)" opacity="0.85" />
              <rect x="2" y="-10" width="6" height="20" fill="url(#g1)" opacity="0.7" />
              <rect x="9" y="-8" width="5" height="16" fill="url(#g1)" opacity="0.55" />
            </g>
          </g>
          {/* gentle spin and pulse */}
          <animateTransform attributeName="transform" type="rotate" values="-18;18;-18" dur="1.1s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="scale" additive="sum" values="1 1;1.03 0.97;1 1" dur="1.1s" repeatCount="indefinite" />
        </g>

        {/* Ground shadow */}
        <ellipse cx="90" cy="150" rx="28" ry="8" fill="#000" opacity="0.25">
          <animate attributeName="rx" values="22;28;22" dur="1.1s" repeatCount="indefinite" />
        </ellipse>
      </svg>
      <div className="mt-3 text-gray-300 text-sm">{label}</div>
    </div>
  );
}











