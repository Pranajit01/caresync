"use client";

import React from "react";

/**
 * CaringHandsEmblem Component
 *
 * Real photo-realistic human hand cutouts (100% transparent background):
 * - Mobile: Both hands visible in the top hero area (Top-Left & Top-Right) framing the headline.
 * - Desktop: Top-Left and Bottom-Right corner reaching hands.
 * - 100% visible on mobile phones & desktop, 0 lag.
 */
export function CaringHandsEmblem() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <style>{`
        @keyframes handTopMobileSlide {
          0% {
            transform: translate(-20vw, -10vh) rotate(-15deg);
            opacity: 0;
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.95;
          }
        }

        @keyframes handRightMobileSlide {
          0% {
            transform: translate(20vw, -10vh) rotate(15deg);
            opacity: 0;
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.95;
          }
        }

        @keyframes handBottomDesktopSlide {
          0% {
            transform: translate(18vw, 18vh) rotate(15deg);
            opacity: 0;
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0.95;
          }
        }

        .animate-top-hand {
          animation: handTopMobileSlide 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-bottom-hand {
          animation: handBottomDesktopSlide 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (max-width: 639px) {
          .animate-bottom-hand {
            animation: handRightMobileSlide 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
      `}</style>

      {/* Top-Left Human Hand (Visible at top left on both Mobile & Desktop) */}
      <div className="absolute top-10 -left-2 sm:top-0 sm:left-0 w-36 sm:w-[28vw] sm:min-w-[200px] sm:max-w-[380px] aspect-square animate-top-hand pointer-events-none">
        <img
          src="/images/nokia_top_hand.png"
          alt="Connecting Human Hand Top Left"
          className="w-full h-full object-contain filter drop-shadow-xl"
        />
      </div>

      {/* Right/Bottom Human Hand (Positioned at Top-Right on Mobile so BOTH hands are 100% visible at top of phone!) */}
      <div className="absolute top-24 -right-2 sm:top-auto sm:bottom-0 sm:right-0 w-36 sm:w-[28vw] sm:min-w-[200px] sm:max-w-[380px] aspect-square animate-bottom-hand pointer-events-none">
        <img
          src="/images/nokia_bottom_hand.png"
          alt="Connecting Human Hand Right/Bottom"
          className="w-full h-full object-contain filter drop-shadow-xl"
        />
      </div>
    </div>
  );
}

/**
 * CaringHeartEmblem Component
 * Compact glowing healthcare heart emblem with animated teal ECG heartbeat stream.
 * Renders in its own dedicated space between the main headline and the tagline text.
 */
export function CaringHeartEmblem() {
  return (
    <div className="relative w-24 h-24 sm:w-36 sm:h-36 mx-auto my-2 flex items-center justify-center pointer-events-none select-none">
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
