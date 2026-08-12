"use client";

import React from "react";

/**
 * CaringHandsEmblem Component
 *
 * Inspired by Nokia's iconic "connecting hands" animation style:
 * Two detailed hands reach out from top-left and bottom-right to meet in the center,
 * cupping around a glowing healthcare heart emblem with an animated ECG heartbeat pulse.
 *
 * Built with 100% GPU-accelerated CSS keyframe animations for 60fps smoothness.
 */
export function CaringHandsEmblem() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center select-none pointer-events-none">
      <style>{`
        @keyframes nokiaTopHandConnect {
          0% {
            transform: translate(-140px, -90px) rotate(-18deg);
            opacity: 0;
          }
          70% {
            transform: translate(6px, 4px) rotate(2deg);
            opacity: 1;
          }
          100% {
            transform: translate(0px, 0px) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes nokiaBottomHandConnect {
          0% {
            transform: translate(140px, 90px) rotate(18deg);
            opacity: 0;
          }
          70% {
            transform: translate(-6px, -4px) rotate(-2deg);
            opacity: 1;
          }
          100% {
            transform: translate(0px, 0px) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes heartIgniteGlow {
          0% {
            transform: scale(0.6);
            opacity: 0;
            filter: drop-shadow(0 0 5px rgba(230, 57, 70, 0.2));
          }
          60% {
            transform: scale(1.1);
            opacity: 1;
            filter: drop-shadow(0 0 30px rgba(230, 57, 70, 0.9)) drop-shadow(0 0 50px rgba(42, 157, 143, 0.6));
          }
          100% {
            transform: scale(1);
            opacity: 1;
            filter: drop-shadow(0 0 20px rgba(230, 57, 70, 0.6)) drop-shadow(0 0 35px rgba(42, 157, 143, 0.4));
          }
        }

        @keyframes heartContinuousPulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 18px rgba(230, 57, 70, 0.5)) drop-shadow(0 0 35px rgba(42, 157, 143, 0.3));
          }
          50% {
            transform: scale(1.06);
            filter: drop-shadow(0 0 28px rgba(230, 57, 70, 0.8)) drop-shadow(0 0 55px rgba(42, 157, 143, 0.6));
          }
        }

        @keyframes ecgLineFlow {
          0% { stroke-dashoffset: 400; }
          100% { stroke-dashoffset: -400; }
        }

        .animate-nokia-top-hand {
          animation: nokiaTopHandConnect 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top left;
        }

        .animate-nokia-bottom-hand {
          animation: nokiaBottomHandConnect 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: bottom right;
        }

        .animate-heart-ignite {
          animation: heartIgniteGlow 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards,
                     heartContinuousPulse 3s ease-in-out infinite 2s;
          transform-origin: center;
        }

        .animate-ecg-flow {
          stroke-dasharray: 400;
          animation: ecgLineFlow 2.2s linear infinite 1.2s;
        }
      `}</style>

      {/* Ambient Glow Atmosphere Behind Center */}
      <div className="absolute inset-0 bg-radial from-red-500/20 via-teal-500/10 to-transparent blur-3xl rounded-full scale-110" />

      <svg
        viewBox="0 0 500 500"
        className="w-full h-full relative z-10 drop-shadow-2xl overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial Gradient for Glowing Heart Emblem */}
          <radialGradient id="heartBodyGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#FFF0F3" />
            <stop offset="85%" stopColor="#E63946" />
            <stop offset="100%" stopColor="#C1121F" />
          </radialGradient>

          {/* Linear Gradient for Hands (Realistic Tone with Medical Dark Blue Tint) */}
          <linearGradient id="topHandSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#252A34" />
            <stop offset="60%" stopColor="#1E222A" />
            <stop offset="100%" stopColor="#14171D" />
          </linearGradient>

          <linearGradient id="bottomHandSkin" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#252A34" />
            <stop offset="60%" stopColor="#1E222A" />
            <stop offset="100%" stopColor="#14171D" />
          </linearGradient>

          {/* Highlights for Fingers */}
          <linearGradient id="topFingerHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E63946" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="bottomFingerHighlight" x1="100%" y1="100%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A9D8F" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* ========================================================================= */}
        {/* CENTER GLOWING HEART & ECG PULSE SYMBOL */}
        {/* ========================================================================= */}
        <g className="animate-heart-ignite" style={{ opacity: 0 }}>
          {/* Heart Emblem Path */}
          <path
            d="M 250 320
               C 165 260, 135 205, 160 165
               C 185 125, 235 140, 250 170
               C 265 140, 315 125, 340 165
               C 365 205, 335 260, 250 320 Z"
            fill="url(#heartBodyGrad)"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Base ECG Line */}
          <path
            d="M 150 230 L 205 230 L 218 190 L 234 270 L 252 175 L 268 250 L 278 230 L 350 230"
            fill="none"
            stroke="#1D3557"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Animated Cyan/Teal Pulse Wave Line */}
          <path
            d="M 150 230 L 205 230 L 218 190 L 234 270 L 252 175 L 268 250 L 278 230 L 350 230"
            fill="none"
            stroke="#2A9D8F"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg-flow"
          />
        </g>

        {/* ========================================================================= */}
        {/* TOP-LEFT HAND (Reaching in from top-left, cupping downwards over heart) */}
        {/* ========================================================================= */}
        <g className="animate-nokia-top-hand">
          {/* Forearm & Wrist extending offscreen top-left */}
          <path
            d="M -30 20
               C 30 20, 90 40, 150 70
               C 195 92, 235 110, 280 115
               C 320 120, 360 135, 385 160
               C 365 175, 340 178, 300 168
               C 255 156, 210 142, 160 135
               C 110 128, 50 115, -30 90 Z"
            fill="url(#topHandSkin)"
            stroke="#3B4252"
            strokeWidth="2"
          />

          {/* Detailed Thumb (Curving gently inward) */}
          <path
            d="M 195 92 C 220 110, 240 135, 235 160 C 225 170, 205 165, 190 148 C 180 135, 175 115, 195 92 Z"
            fill="url(#topHandSkin)"
            stroke="#4C566A"
            strokeWidth="1.5"
          />

          {/* Index Finger (Extending right above heart) */}
          <path
            d="M 280 115 C 320 118, 360 132, 388 158 C 382 168, 365 172, 335 160 C 300 148, 270 136, 250 130"
            fill="none"
            stroke="url(#topFingerHighlight)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Middle Finger */}
          <path
            d="M 270 125 C 310 130, 350 145, 378 172 C 370 180, 355 182, 325 170 C 290 156, 260 144, 240 138"
            fill="none"
            stroke="#D8DEE9"
            strokeWidth="2"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />

          {/* Ring & Pinky Contour Details */}
          <path
            d="M 255 135 C 290 142, 330 158, 355 185 C 348 190, 335 190, 310 178"
            fill="none"
            stroke="#D8DEE9"
            strokeWidth="1.5"
            strokeOpacity="0.25"
            strokeLinecap="round"
          />
        </g>

        {/* ========================================================================= */}
        {/* BOTTOM-RIGHT HAND (Reaching in from bottom-right, cupping upwards under heart) */}
        {/* ========================================================================= */}
        <g className="animate-nokia-bottom-hand">
          {/* Forearm & Wrist extending offscreen bottom-right */}
          <path
            d="M 530 480
               C 470 480, 410 460, 350 430
               C 305 408, 265 390, 220 385
               C 180 380, 140 365, 115 340
               C 135 325, 160 322, 200 332
               C 245 344, 290 358, 340 365
               C 390 372, 450 385, 530 410 Z"
            fill="url(#bottomHandSkin)"
            stroke="#3B4252"
            strokeWidth="2"
          />

          {/* Detailed Thumb (Curving upward) */}
          <path
            d="M 305 408 C 280 390, 260 365, 265 340 C 275 330, 295 335, 310 352 C 320 365, 325 385, 305 408 Z"
            fill="url(#bottomHandSkin)"
            stroke="#4C566A"
            strokeWidth="1.5"
          />

          {/* Index Finger (Extending left under heart) */}
          <path
            d="M 220 385 C 180 382, 140 368, 112 342 C 118 332, 135 328, 165 340 C 200 352, 230 364, 250 370"
            fill="none"
            stroke="url(#bottomFingerHighlight)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Middle Finger */}
          <path
            d="M 230 375 C 190 370, 150 355, 122 328 C 130 320, 145 318, 175 330 C 210 344, 240 356, 260 362"
            fill="none"
            stroke="#D8DEE9"
            strokeWidth="2"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />

          {/* Ring & Pinky Contour Details */}
          <path
            d="M 245 365 C 210 358, 170 342, 145 315 C 152 310, 165 310, 190 322"
            fill="none"
            stroke="#D8DEE9"
            strokeWidth="1.5"
            strokeOpacity="0.25"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

export default CaringHandsEmblem;
