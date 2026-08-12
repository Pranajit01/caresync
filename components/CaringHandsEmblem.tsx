"use client";

import React from "react";

/**
 * CaringHandsEmblem Component
 *
 * Full-screen viewport animation inspired by Nokia's iconic connecting hands:
 * - Top-Left Hand extends out from the top-left corner of the website screen.
 * - Bottom-Right Hand extends out from the bottom-right corner of the website screen.
 * - Both hands reach across the screen to gently meet around the glowing healthcare heart symbol in the center.
 *
 * 100% GPU-accelerated CSS keyframe animations for 60fps performance without lag.
 */
export function CaringHandsEmblem() {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden select-none">
      <style>{`
        @keyframes nokiaScreenCornerTop {
          0% {
            transform: translate(-30vw, -30vh) rotate(-25deg);
            opacity: 0;
          }
          70% {
            transform: translate(2vw, 1vh) rotate(2deg);
            opacity: 1;
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes nokiaScreenCornerBottom {
          0% {
            transform: translate(30vw, 30vh) rotate(25deg);
            opacity: 0;
          }
          70% {
            transform: translate(-2vw, -1vh) rotate(-2deg);
            opacity: 1;
          }
          100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes centerHeartIgnite {
          0% {
            transform: scale(0.5);
            opacity: 0;
            filter: drop-shadow(0 0 5px rgba(230, 57, 70, 0.2));
          }
          60% {
            transform: scale(1.12);
            opacity: 1;
            filter: drop-shadow(0 0 40px rgba(230, 57, 70, 0.95)) drop-shadow(0 0 70px rgba(42, 157, 143, 0.7));
          }
          100% {
            transform: scale(1);
            opacity: 1;
            filter: drop-shadow(0 0 25px rgba(230, 57, 70, 0.7)) drop-shadow(0 0 45px rgba(42, 157, 143, 0.45));
          }
        }

        @keyframes heartPulseLoop {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 20px rgba(230, 57, 70, 0.6)) drop-shadow(0 0 40px rgba(42, 157, 143, 0.4));
          }
          50% {
            transform: scale(1.06);
            filter: drop-shadow(0 0 35px rgba(230, 57, 70, 0.9)) drop-shadow(0 0 65px rgba(42, 157, 143, 0.65));
          }
        }

        @keyframes ecgLinePulse {
          0% { stroke-dashoffset: 500; }
          100% { stroke-dashoffset: -500; }
        }

        .animate-corner-top-hand {
          animation: nokiaScreenCornerTop 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top left;
        }

        .animate-corner-bottom-hand {
          animation: nokiaScreenCornerBottom 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: bottom right;
        }

        .animate-center-heart {
          animation: centerHeartIgnite 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s forwards,
                     heartPulseLoop 3.2s ease-in-out infinite 2s;
          transform-origin: center;
        }

        .animate-ecg-stream {
          stroke-dasharray: 500;
          animation: ecgLinePulse 2.2s linear infinite 1.2s;
        }
      `}</style>

      <svg
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial Gradient for Center Heart */}
          <radialGradient id="centerHeartGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#FFF0F3" />
            <stop offset="85%" stopColor="#E63946" />
            <stop offset="100%" stopColor="#C1121F" />
          </radialGradient>

          {/* Skin / Sleeve Gradients */}
          <linearGradient id="topArmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E232A" />
            <stop offset="40%" stopColor="#2D333F" />
            <stop offset="80%" stopColor="#1A1E24" />
            <stop offset="100%" stopColor="#12151A" />
          </linearGradient>

          <linearGradient id="bottomArmGrad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#1E232A" />
            <stop offset="40%" stopColor="#2D333F" />
            <stop offset="80%" stopColor="#1A1E24" />
            <stop offset="100%" stopColor="#12151A" />
          </linearGradient>

          {/* Accent Highlights */}
          <linearGradient id="topGlowLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E63946" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="bottomGlowLine" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#2A9D8F" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* ========================================================================= */}
        {/* TOP-LEFT SCREEN CORNER HAND (Extends from top-left of site to center) */}
        {/* ========================================================================= */}
        <g className="animate-corner-top-hand">
          {/* Long Arm extending from offscreen top-left (0,0) towards center (700, 360) */}
          <path
            d="M -150 -150
               C 0 -50, 150 50, 300 140
               C 420 210, 520 250, 630 280
               C 690 295, 730 320, 765 350
               C 745 375, 715 378, 660 365
               C 580 345, 480 315, 360 270
               C 220 220, 80 150, -150 40 Z"
            fill="url(#topArmGrad)"
            stroke="#3B4252"
            strokeWidth="2.5"
          />

          {/* Hand Details & Thumb */}
          <path
            d="M 520 250 C 560 280, 595 315, 590 355 C 575 368, 545 360, 520 335 C 500 315, 490 285, 520 250 Z"
            fill="url(#topArmGrad)"
            stroke="#4C566A"
            strokeWidth="2"
          />

          {/* Index & Fingertip Contour extending right above heart */}
          <path
            d="M 630 280 C 690 295, 730 320, 765 350 C 755 365, 730 368, 680 350 C 620 330, 560 305, 530 295"
            fill="none"
            stroke="url(#topGlowLine)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Middle & Ring Finger Contours */}
          <path
            d="M 615 295 C 670 310, 710 335, 745 370 C 735 382, 710 382, 665 365 C 605 345, 550 322, 520 312"
            fill="none"
            stroke="#D8DEE9"
            strokeWidth="2.5"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />
        </g>

        {/* ========================================================================= */}
        {/* BOTTOM-RIGHT SCREEN CORNER HAND (Extends from bottom-right to center) */}
        {/* ========================================================================= */}
        <g className="animate-corner-bottom-hand">
          {/* Long Arm extending from offscreen bottom-right (1550,1050) towards center (700, 440) */}
          <path
            d="M 1550 1050
               C 1400 950, 1250 850, 1100 760
               C 980 690, 880 650, 770 620
               C 710 605, 670 580, 635 550
               C 655 525, 685 522, 740 535
               C 820 555, 920 585, 1040 630
               C 1180 680, 1320 750, 1550 860 Z"
            fill="url(#bottomArmGrad)"
            stroke="#3B4252"
            strokeWidth="2.5"
          />

          {/* Hand Details & Thumb */}
          <path
            d="M 880 650 C 840 620, 805 585, 810 545 C 825 532, 855 540, 880 565 C 900 585, 910 615, 880 650 Z"
            fill="url(#bottomArmGrad)"
            stroke="#4C566A"
            strokeWidth="2"
          />

          {/* Index & Fingertip Contour extending left under heart */}
          <path
            d="M 770 620 C 710 605, 670 580, 635 550 C 645 535, 670 532, 720 550 C 780 570, 840 595, 870 605"
            fill="none"
            stroke="url(#bottomGlowLine)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Middle & Ring Finger Contours */}
          <path
            d="M 785 605 C 730 590, 690 565, 655 530 C 665 518, 690 518, 735 535 C 795 555, 850 578, 880 588"
            fill="none"
            stroke="#D8DEE9"
            strokeWidth="2.5"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />
        </g>

        {/* ========================================================================= */}
        {/* CENTER GLOWING HEALTHCARE HEART EMBLEM */}
        {/* ========================================================================= */}
        <g className="animate-center-heart" style={{ opacity: 0 }}>
          {/* Ambient Glow Disk Behind Heart */}
          <circle cx="700" cy="450" r="120" fill="#E63946" fillOpacity="0.15" className="blur-xl" />

          {/* Heart Emblem Path centered at (700, 450) */}
          <path
            d="M 700 540
               C 590 460, 550 390, 580 340
               C 610 290, 680 310, 700 350
               C 720 310, 790 290, 820 340
               C 850 390, 810 460, 700 540 Z"
            fill="url(#centerHeartGrad)"
            stroke="#FFFFFF"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Base Dark ECG Line */}
          <path
            d="M 570 425 L 640 425 L 656 375 L 678 475 L 702 350 L 724 450 L 738 425 L 830 425"
            fill="none"
            stroke="#1D3557"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Animated Cyan/Teal Pulse Wave Line */}
          <path
            d="M 570 425 L 640 425 L 656 375 L 678 475 L 702 350 L 724 450 L 738 425 L 830 425"
            fill="none"
            stroke="#2A9D8F"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg-stream"
          />
        </g>
      </svg>
    </div>
  );
}

export default CaringHandsEmblem;
