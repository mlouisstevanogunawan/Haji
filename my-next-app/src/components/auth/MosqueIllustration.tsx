import * as React from "react";

export const MosqueIllustration: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1000 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="mosqueMainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#08544c" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#064841" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="mosqueBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a645b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#075148" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="mosqueAccentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0d786d" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#08544c" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Background Soft Secondary Domes */}
        <path
          d="M200 480 C200 340 250 280 300 280 C350 280 400 340 400 480 Z"
          fill="url(#mosqueBackGrad)"
        />
        <path
          d="M600 480 C600 340 650 280 700 280 C750 280 800 340 800 480 Z"
          fill="url(#mosqueBackGrad)"
        />

        {/* Central Grand Onion Dome */}
        {/* Crescent Finial */}
        <path d="M500 110 L500 155" stroke="#0a6960" strokeWidth="4" strokeLinecap="round" />
        <circle cx="500" cy="105" r="5" fill="#0a6960" />
        <path
          d="M500 98 C505 95 510 95 511 100 C512 105 507 109 500 110 C507 109 510 103 508 99 Z"
          fill="#0a6960"
        />

        {/* Grand Dome Body */}
        <path
          d="M500 155 
             C470 200 340 230 340 350 
             C340 400 365 480 365 480 
             L635 480 
             C635 480 660 400 660 350 
             C660 230 530 200 500 155 Z"
          fill="url(#mosqueMainGrad)"
        />

        {/* Arched windows / recessed niches on Grand Dome */}
        <path
          d="M480 370 C480 352 488 344 500 344 C512 344 520 352 520 370 L520 440 L480 440 Z"
          fill="rgba(4, 40, 35, 0.45)"
        />
        <path
          d="M425 385 C425 372 432 364 442 364 C452 364 459 372 459 385 L459 440 L425 440 Z"
          fill="rgba(4, 40, 35, 0.35)"
        />
        <path
          d="M541 385 C541 372 548 364 558 364 C568 364 575 372 575 385 L575 440 L541 440 Z"
          fill="rgba(4, 40, 35, 0.35)"
        />

        {/* Left Minaret Tower */}
        <path d="M100 140 L100 185" stroke="#0a6960" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="135" r="4" fill="#0a6960" />
        <path
          d="M85 220 L100 185 L115 220 Z"
          fill="url(#mosqueMainGrad)"
        />
        {/* Upper Balcony */}
        <rect x="80" y="220" width="40" height="10" rx="2" fill="url(#mosqueMainGrad)" />
        {/* Upper Column */}
        <rect x="87" y="230" width="26" height="70" fill="url(#mosqueMainGrad)" />
        {/* Mid Balcony */}
        <rect x="76" y="300" width="48" height="12" rx="2" fill="url(#mosqueMainGrad)" />
        {/* Main Column */}
        <rect x="82" y="312" width="36" height="168" fill="url(#mosqueMainGrad)" />

        {/* Right Minaret Tower */}
        <path d="M900 140 L900 185" stroke="#0a6960" strokeWidth="3" strokeLinecap="round" />
        <circle cx="900" cy="135" r="4" fill="#0a6960" />
        <path
          d="M885 220 L900 185 L915 220 Z"
          fill="url(#mosqueMainGrad)"
        />
        {/* Upper Balcony */}
        <rect x="880" y="220" width="40" height="10" rx="2" fill="url(#mosqueMainGrad)" />
        {/* Upper Column */}
        <rect x="887" y="230" width="26" height="70" fill="url(#mosqueMainGrad)" />
        {/* Mid Balcony */}
        <rect x="876" y="300" width="48" height="12" rx="2" fill="url(#mosqueMainGrad)" />
        {/* Main Column */}
        <rect x="882" y="312" width="36" height="168" fill="url(#mosqueMainGrad)" />

        {/* Base Wall structure */}
        <rect x="0" y="455" width="1000" height="25" fill="rgba(6, 60, 52, 0.7)" />
      </svg>
    </div>
  );
};
