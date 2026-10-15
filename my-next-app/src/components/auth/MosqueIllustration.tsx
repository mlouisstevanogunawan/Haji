import * as React from "react";

export const MosqueIllustration: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1000 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          {/* Subtle Mosque Gradients matching Emerald Tone */}
          <linearGradient id="domeGradPrimary" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="domeGradSecondary" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.10" />
          </linearGradient>

          <linearGradient id="towerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#065f46" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Back Ground Domes (Soft Layer) */}
        <path
          d="M180 450 C180 320 230 260 280 260 C330 260 380 320 380 450 Z"
          fill="url(#domeGradSecondary)"
        />
        <path
          d="M620 450 C620 320 670 260 720 260 C770 260 820 320 820 450 Z"
          fill="url(#domeGradSecondary)"
        />

        {/* Central Grand Dome */}
        {/* Dome Finial / Crescent Spike */}
        <path d="M500 90 L500 130" stroke="#a7f3d0" strokeWidth="4" strokeLinecap="round" />
        <circle cx="500" cy="85" r="5" fill="#a7f3d0" />
        <path
          d="M500 80 C504 77 508 77 509 82 C510 87 505 91 500 92 C506 91 509 85 507 81 Z"
          fill="#a7f3d0"
        />

        {/* Grand Dome Body (Classic pointed onion shape) */}
        <path
          d="M500 130 
             C470 180 350 210 350 330 
             C350 380 370 450 370 450 
             L630 450 
             C630 450 650 380 650 330 
             C650 210 530 180 500 130 Z"
          fill="url(#domeGradPrimary)"
        />

        {/* Arched windows on Grand Dome */}
        <path
          d="M475 360 C475 340 485 330 500 330 C515 330 525 340 525 360 L525 410 L475 410 Z"
          fill="rgba(4, 120, 87, 0.4)"
        />
        <path
          d="M420 375 C420 360 428 350 440 350 C452 350 460 360 460 375 L460 410 L420 410 Z"
          fill="rgba(4, 120, 87, 0.35)"
        />
        <path
          d="M540 375 C540 360 548 350 560 350 C572 350 580 360 580 375 L580 410 L540 410 Z"
          fill="rgba(4, 120, 87, 0.35)"
        />

        {/* Left Minaret Tower */}
        {/* Minaret Spike & Finial */}
        <path d="M120 120 L120 160" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" />
        <circle cx="120" cy="115" r="4" fill="#a7f3d0" />
        <path
          d="M105 200 L120 160 L135 200 Z"
          fill="url(#domeGradPrimary)"
        />
        {/* Upper Balcony */}
        <rect x="98" y="200" width="44" height="12" rx="2" fill="url(#towerGrad)" />
        {/* Upper Column */}
        <rect x="106" y="212" width="28" height="70" fill="url(#towerGrad)" />
        {/* Mid Balcony */}
        <rect x="94" y="282" width="52" height="14" rx="2" fill="url(#towerGrad)" />
        {/* Main Pillar */}
        <rect x="100" y="296" width="40" height="154" fill="url(#towerGrad)" />
        {/* Minaret Windows */}
        <rect x="114" y="235" width="12" height="24" rx="6" fill="rgba(4, 120, 87, 0.4)" />
        <rect x="114" y="330" width="12" height="30" rx="6" fill="rgba(4, 120, 87, 0.4)" />
        <rect x="114" y="380" width="12" height="30" rx="6" fill="rgba(4, 120, 87, 0.4)" />

        {/* Right Minaret Tower */}
        {/* Minaret Spike & Finial */}
        <path d="M880 120 L880 160" stroke="#a7f3d0" strokeWidth="3" strokeLinecap="round" />
        <circle cx="880" cy="115" r="4" fill="#a7f3d0" />
        <path
          d="M865 200 L880 160 L895 200 Z"
          fill="url(#domeGradPrimary)"
        />
        {/* Upper Balcony */}
        <rect x="858" y="200" width="44" height="12" rx="2" fill="url(#towerGrad)" />
        {/* Upper Column */}
        <rect x="866" y="212" width="28" height="70" fill="url(#towerGrad)" />
        {/* Mid Balcony */}
        <rect x="854" y="282" width="52" height="14" rx="2" fill="url(#towerGrad)" />
        {/* Main Pillar */}
        <rect x="860" y="296" width="40" height="154" fill="url(#towerGrad)" />
        {/* Minaret Windows */}
        <rect x="874" y="235" width="12" height="24" rx="6" fill="rgba(4, 120, 87, 0.4)" />
        <rect x="874" y="330" width="12" height="30" rx="6" fill="rgba(4, 120, 87, 0.4)" />
        <rect x="874" y="380" width="12" height="30" rx="6" fill="rgba(4, 120, 87, 0.4)" />

        {/* Base Wall & Colonnade */}
        <rect x="0" y="440" width="1000" height="10" fill="rgba(6, 78, 59, 0.3)" />
      </svg>
    </div>
  );
};
