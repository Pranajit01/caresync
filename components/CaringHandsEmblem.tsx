"use client";

import React from "react";

/**
 * CaringHandsEmblem Component
 *
 * Inspired by healthcare protection imagery:
 * Features 2 gentle caring hands entering from top and bottom to embrace a glowing
 * heartbeat ECG emblem in the center. Built with 100% GPU-accelerated CSS keyframe
 * animations for 60fps performance without any lag or heavy JavaScript.
 */
export function CaringHandsEmblem() {
  return (
    <div className="relative w-full max-w-lg mx-auto aspect-square flex items-center justify-center p-4 select-none pointer-events-none">
      <style>{`
        @keyframes handTopEntrance {
          0% {
            transform: translateY(-40px) translateX(-20px) rotate(-6deg);
            opacity: 0;
          }
          60% {
            transform: translateY(4px) translateX(0px) rotate(1deg);
            opacity: 1;
          }
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes handBottomEntrance {
          0% {
            transform: translateY(40px) translateX(20px) rotate(6deg);
            opacity: 0;
          }
          60% {
            transform: translateY(-4px) translateX(0px) rotate(-1deg);
            opacity: 1;
          }
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes heartPulseGlow {
          0%, 100% {
            transform: scale(0.98);
            filter: drop-shadow(0 0 15px rgba(230, 57, 70, 0.4)) drop-shadow(0 0 35px rgba(42, 157, 143, 0.25));
          }
          50% {
            transform: scale(1.04);
            filter: drop-shadow(0 0 25px rgba(230, 57, 70, 0.7)) drop-shadow(0 0 50px rgba(42, 157, 143, 0.5));
          }
        }

        @keyframes ecgPulseLine {
          0% { stroke-dashoffset: 400; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -400; }
        }

        .animate-hand-top {
          animation: handTopEntrance 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-hand-bottom {
          animation: handBottomEntrance 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-heart-pulse {
          animation: heartPulseGlow 3s ease-in-out infinite 0.6s;
          transform-origin: center;
        }

        .animate-ecg-line {
          stroke-dasharray: 400;
          animation: ecgPulseLine 2.5s linear infinite;
        }
      `}</style>

      {/* Background Soft Glow Aura */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-red-500/15 to-blue-500/10 rounded-full blur-3xl opacity-60 animate-pulse" />

      {/* Main SVG Container */}
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full relative z-10 drop-shadow-2xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial Gradient for Glowing Heart Emblem */}
          <radialGradient id="heartGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#FFF0F2" />
            <stop offset="100%" stopColor="#E63946" />
          </radialGradient>

          {/* Linear Gradient for ECG Line */}
          <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1D3557" />
            <stop offset="50%" stopColor="#2A9D8F" />
            <stop offset="100%" stopColor="#E63946" />
          </linearGradient>

          {/* Top Hand Gradient */}
          <linearGradient id="topHandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A303C" />
            <stop offset="100%" stopColor="#181C24" />
          </linearGradient>

          {/* Bottom Hand Gradient */}
          <linearGradient id="bottomHandGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2A303C" />
            <stop offset="100%" stopColor="#181C24" />
          </linearGradient>
        </defs>

        {/* ========================================================================= */}
        {/* CENTER HEART EMBLEM WITH ECG PULSE WAVE */}
        {/* ========================================================================= */}
        <g className="animate-heart-pulse">
          {/* Outer Glow Ring */}
          <circle
            cx="200"
            cy="200"
            r="85"
            fill="none"
            stroke="url(#ecgGradient)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
            className="animate-spin"
            style={{ animationDuration: '20s' }}
          />

          {/* Heart Shape */}
          <path
            d="M 200 255
               C 135 210, 115 170, 135 140
               C 155 110, 190 125, 200 145
               C 210 125, 245 110, 265 140
               C 285 170, 265 210, 200 255 Z"
            fill="url(#heartGradient)"
            stroke="#FFFFFF"
            strokeWidth="3"
          />

          {/* Heartbeat ECG Line across Heart */}
          <path
            d="M 125 190 L 165 190 L 175 160 L 188 220 L 202 145 L 214 205 L 222 190 L 275 190"
            fill="none"
            stroke="#1D3557"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Animated ECG Pulse Wave Overlay */}
          <path
            d="M 125 190 L 165 190 L 175 160 L 188 220 L 202 145 L 214 205 L 222 190 L 275 190"
            fill="none"
            stroke="#2A9D8F"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg-line"
          />
        </g>

        {/* ========================================================================= */}
        {/* TOP CARING HAND (Cupped downward from top-left) */}
        {/* ========================================================================= */}
        <g className="animate-hand-top">
          {/* Main Hand Wrist & Palm Shadow */}
          <path
            d="M 20 80
               C 60 70, 110 50, 170 50
               C 230 50, 290 75, 330 110
               C 310 120, 280 125, 250 120
               C 200 112, 150 100, 100 105
               C 60 110, 35 105, 20 80 Z"
            fill="url(#topHandGrad)"
            stroke="#3A4252"
            strokeWidth="1.5"
          />
          {/* Top Hand Fingers Curling Over Heart */}
          <path
            d="M 170 50 C 220 50, 280 75, 330 110 C 320 125, 295 125, 260 112 C 215 95, 175 92, 140 100"
            fill="none"
            stroke="#E63946"
            strokeWidth="2"
            strokeOpacity="0.8"
          />
          {/* Gentle Highlight Contour Line */}
          <path
            d="M 40 85 C 90 70, 160 58, 240 68 C 280 74, 310 92, 325 105"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeOpacity="0.25"
            strokeDasharray="4 4"
          />
        </g>

        {/* ========================================================================= */}
        {/* BOTTOM SUPPORT HAND (Cupped upward from bottom-right) */}
        {/* ========================================================================= */}
        <g className="animate-hand-bottom">
          {/* Main Hand Wrist & Palm Base */}
          <path
            d="M 380 320
               C 340 330, 290 350, 230 350
               C 170 350, 110 325, 70 290
               C 90 280, 120 275, 150 280
               C 200 288, 250 300, 300 295
               C 340 290, 365 295, 380 320 Z"
            fill="url(#bottomHandGrad)"
            stroke="#3A4252"
            strokeWidth="1.5"
          />
          {/* Bottom Hand Fingers Supporting Heart */}
          <path
            d="M 230 350 C 180 350, 120 325, 70 290 C 80 275, 105 275, 140 288 C 185 305, 225 308, 260 300"
            fill="none"
            stroke="#2A9D8F"
            strokeWidth="2"
            strokeOpacity="0.8"
          />
          {/* Gentle Highlight Contour Line */}
          <path
            d="M 360 315 C 310 330, 240 342, 160 332 C 120 326, 90 308, 75 295"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeOpacity="0.25"
            strokeDasharray="4 4"
          />
        </g>
      </svg>
    </div>
  );
}

export default CaringHandsEmblem;
