'use client';

import React from 'react';

type SimpleLoaderProps = {
  label?: string;
  size?: number;
};

export default function SimpleLoader({ label = 'Loading...', size = 40 }: SimpleLoaderProps) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="text-primary-500"
        role="img"
        aria-label={label}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2b2b2b"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.75}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${size / 2} ${size / 2}`}
            to={`360 ${size / 2} ${size / 2}`}
            dur="1s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <div className="mt-3 text-gray-300 text-sm">{label}</div>
    </div>
  );
}











