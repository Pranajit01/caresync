"use client";

import React from "react";

/**
 * CaringHandsEmblem Component
 *
 * Features real photo-realistic human hands (matching Nokia connecting hands reference photo):
 * - Top-Left Hand: Reaches in smoothly from the top-left corner of the browser window.
 * - Bottom-Right Hand: Reaches in smoothly from the bottom-right corner of the browser window.
 * - Center Emblem: Glowing healthcare heart with an animated teal ECG heartbeat line.
 *
 * Uses mix-blend-multiply and z-indexing to ensure 100% text readability for all header and hero text.
 */
export function CaringHandsEmblem() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <style>{`
        @keyframes realTopHandSlide {
          0% {
            transform: translate(-25vw, -25vh) rotate(-15deg);
            opacity: 0;
          }
          70% {
            transform: translate(1vw, 1vh) rotate(2deg);
            opacity: 0.9;
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.85;
          }
        }

        @keyframes realBottomHandSlide {
          0% {
            transform: translate(25vw, 25vh) rotate(15deg);
            opacity: 0;
          }
          70% {
            transform: translate(-1vw, -1vh) rotate(-2deg);
            opacity: 0.9;
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.85;
          }
        }

        @keyframes heartPulseIgnite {
          0% {
            transform: scale(0.5);
            opacity: 0;
            filter: drop-shadow(0 0 5px rgba(230, 57, 70, 0.2));
          }
          60% {
            transform: scale(1.1);
            opacity: 1;
            filter: drop-shadow(0 0 35px rgba(230, 57, 70, 0.9)) drop-shadow(0 0 60px rgba(42, 157, 143, 0.6));
          }
          100% {
            transform: scale(1);
            opacity: 1;
            filter: drop-shadow(0 0 20px rgba(230, 57, 70, 0.6)) drop-shadow(0 0 35px rgba(42, 157, 143, 0.4));
          }
        }

        @keyframes heartContinuousGlow {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 18px rgba(230, 57, 70, 0.5)) drop-shadow(0 0 35px rgba(42, 157, 143, 0.3));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 30px rgba(230, 57, 70, 0.8)) drop-shadow(0 0 55px rgba(42, 157, 143, 0.55));
          }
        }

        @keyframes ecgStreamFlow {
          0% { stroke-dashoffset: 400; }
          100% { stroke-dashoffset: -400; }
        }

        .animate-real-top-hand {
          animation: realTopHandSlide 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-real-bottom-hand {
          animation: realBottomHandSlide 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-heart-glow {
          animation: heartPulseIgnite 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards,
                     heartContinuousGlow 3.2s ease-in-out infinite 2s;
        }

        .animate-ecg-stream {
          stroke-dasharray: 400;
          animation: ecgStreamFlow 2.2s linear infinite 1.2s;
        }
      `}</style>

      {/* Real Human Top-Left Hand (Positioned safely outside text boundaries) */}
      <div className="absolute top-0 left-0 w-72 sm:w-96 md:w-[480px] aspect-square animate-real-top-hand mix-blend-multiply opacity-85 pointer-events-none">
        <img
          src="/images/nokia_top_hand.png"
          alt="Connecting Human Hand Top"
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </div>

      {/* Real Human Bottom-Right Hand (Positioned safely outside text boundaries) */}
      <div className="absolute bottom-0 right-0 w-72 sm:w-96 md:w-[480px] aspect-square animate-real-bottom-hand mix-blend-multiply opacity-85 pointer-events-none">
        <img
          src="/images/nokia_bottom_hand.png"
          alt="Connecting Human Hand Bottom"
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </div>

      {/* Center Heart Emblem with Animated ECG Stream (Rendered gently behind text) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 sm:w-56 sm:h-56 pointer-events-none opacity-90">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full animate-heart-glow overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="realHeartGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#FFF0F3" />
              <stop offset="85%" stopColor="#E63946" />
              <stop offset="100%" stopColor="#C1121F" />
            </radialGradient>
          </defs>

          {/* Heart Emblem */}
          <path
            d="M 200 270
               C 130 220, 105 175, 125 140
               C 145 105, 188 118, 200 142
               C 212 118, 255 105, 275 140
               C 295 175, 270 220, 200 270 Z"
            fill="url(#realHeartGrad)"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Base ECG Line */}
          <path
            d="M 115 190 L 160 190 L 170 155 L 183 220 L 201 140 L 215 205 L 225 190 L 285 190"
            fill="none"
            stroke="#1D3557"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Animated Cyan/Teal Pulse Wave */}
          <path
            d="M 115 190 L 160 190 L 170 155 L 183 220 L 201 140 L 215 205 L 225 190 L 285 190"
            fill="none"
            stroke="#2A9D8F"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg-stream"
          />
        </svg>
      </div>
    </div>
  );
}

export default CaringHandsEmblem;
