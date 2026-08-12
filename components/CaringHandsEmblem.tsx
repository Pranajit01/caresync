"use client";

import React from "react";

/**
 * CaringHandsEmblem Component
 *
 * Real photo-realistic human hand cutouts:
 * - Top-Left Hand: Enters cleanly from the top-left corner.
 * - Bottom-Right Hand: Enters cleanly from the bottom-right corner.
 * - Sized perfectly so the layout fits within 100% browser zoom without overflowing.
 */
export function CaringHandsEmblem() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <style>{`
        @keyframes handTopSlideIn {
          0% {
            transform: translate(-18vw, -18vh) rotate(-15deg);
            opacity: 0;
          }
          70% {
            transform: translate(0.5vw, 0.5vh) rotate(1deg);
            opacity: 1;
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.92;
          }
        }

        @keyframes handBottomSlideIn {
          0% {
            transform: translate(18vw, 18vh) rotate(15deg);
            opacity: 0;
          }
          70% {
            transform: translate(-0.5vw, -0.5vh) rotate(-1deg);
            opacity: 1;
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.92;
          }
        }

        .animate-top-hand-slide {
          animation: handTopSlideIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-bottom-hand-slide {
          animation: handBottomSlideIn 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Top-Left Corner Hand */}
      <div className="absolute top-0 left-0 w-[28vw] min-w-[200px] max-w-[380px] aspect-square animate-top-hand-slide pointer-events-none">
        <img
          src="/images/nokia_top_hand.png"
          alt="Connecting Human Hand Top Left"
          className="w-full h-full object-contain filter drop-shadow-xl"
        />
      </div>

      {/* Bottom-Right Corner Hand */}
      <div className="absolute bottom-0 right-0 w-[28vw] min-w-[200px] max-w-[380px] aspect-square animate-bottom-hand-slide pointer-events-none">
        <img
          src="/images/nokia_bottom_hand.png"
          alt="Connecting Human Hand Bottom Right"
          className="w-full h-full object-contain filter drop-shadow-xl"
        />
      </div>
    </div>
  );
}

/**
 * CaringHeartEmblem Component
 * Compact glowing healthcare heart emblem with animated teal ECG heartbeat stream.
 * Fits comfortably in the hero flow at 100% zoom.
 */
export function CaringHeartEmblem() {
  return (
    <div className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto my-2 flex items-center justify-center pointer-events-none select-none">
      <style>{`
        @keyframes centerHeartIgnite {
          0% {
            transform: scale(0.5);
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
            filter: drop-shadow(0 0 20px rgba(230, 57, 70, 0.65)) drop-shadow(0 0 35px rgba(42, 157, 143, 0.4));
          }
        }

        @keyframes heartPulseContinuous {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 16px rgba(230, 57, 70, 0.5)) drop-shadow(0 0 30px rgba(42, 157, 143, 0.35));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 28px rgba(230, 57, 70, 0.8)) drop-shadow(0 0 50px rgba(42, 157, 143, 0.55));
          }
        }

        @keyframes ecgStreamFlow {
          0% { stroke-dashoffset: 400; }
          100% { stroke-dashoffset: -400; }
        }

        .animate-heart-ignite-glow {
          animation: centerHeartIgnite 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards,
                     heartPulseContinuous 3.2s ease-in-out infinite 1.5s;
        }

        .animate-ecg-stream {
          stroke-dasharray: 400;
          animation: ecgStreamFlow 2.2s linear infinite 0.8s;
        }
      `}</style>

      <svg
        viewBox="0 0 400 400"
        className="w-full h-full animate-heart-ignite-glow overflow-visible"
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

        {/* Ambient Glow Disk */}
        <circle cx="200" cy="200" r="140" fill="#E63946" fillOpacity="0.2" className="blur-xl" />

        {/* Heart Emblem */}
        <path
          d="M 200 270
             C 130 220, 105 175, 125 140
             C 145 105, 188 118, 200 142
             C 212 118, 255 105, 275 140
             C 295 175, 270 220, 200 270 Z"
          fill="url(#realHeartGrad)"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Base ECG Line */}
        <path
          d="M 115 190 L 160 190 L 170 155 L 183 220 L 201 140 L 215 205 L 225 190 L 285 190"
          fill="none"
          stroke="#1D3557"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Animated Cyan/Teal Pulse Wave */}
        <path
          d="M 115 190 L 160 190 L 170 155 L 183 220 L 201 140 L 215 205 L 225 190 L 285 190"
          fill="none"
          stroke="#2A9D8F"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-ecg-stream"
        />
      </svg>
    </div>
  );
}

export default CaringHandsEmblem;
