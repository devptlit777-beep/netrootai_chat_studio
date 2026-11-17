import React from 'react';

export default function NetrootLogoBrain() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* ══════════════════════════════════════════════════════════════════
          1. DEEP SPACE COSMIC GALAXY & NEBULA DUST (CALM & ANTI-GLARE)
         ══════════════════════════════════════════════════════════════════ */}
      {/* Left Deep Space Nebula Glow */}
      <div className="absolute top-[10%] -left-[10%] w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.07)_0%,rgba(99,102,241,0.06)_40%,transparent_75%)] rounded-full blur-[120px] animate-aurora-1 pointer-events-none" />

      {/* Right Deep Space Nebula Glow */}
      <div className="absolute top-[15%] -right-[10%] w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,rgba(147,197,253,0.04)_40%,transparent_75%)] rounded-full blur-[120px] animate-aurora-2 pointer-events-none" />

      {/* Center Ambient Aurora Behind Prompt Hub */}
      <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[850px] md:w-[1000px] h-[450px] sm:h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.08)_0%,rgba(99,102,241,0.06)_45%,transparent_85%)] rounded-full blur-[130px] pointer-events-none" />

      {/* ══════════════════════════════════════════════════════════════════
          2. TWINKLING STARDUST & 4-POINT CELESTIAL STARS (STEADY, NO HARSH BLINK)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute top-[18%] left-[16%] text-sky-200/40 text-sm font-medium animate-pulse">✦</span>
        <span className="absolute top-[14%] right-[18%] text-indigo-200/40 text-sm font-medium animate-pulse" style={{ animationDelay: '1.2s' }}>✦</span>
        <span className="absolute top-[68%] left-[8%] text-blue-300/30 text-xs animate-pulse" style={{ animationDelay: '2s' }}>✦</span>
        <span className="absolute top-[62%] right-[10%] text-slate-300/40 text-xs font-medium animate-pulse" style={{ animationDelay: '1.6s' }}>✦</span>
        <span className="absolute top-[32%] left-[6%] w-1.5 h-1.5 rounded-full bg-blue-500/40 blur-[0.5px]" />
        <span className="absolute top-[44%] right-[7%] w-1.5 h-1.5 rounded-full bg-indigo-300/40 blur-[0.5px]" />
        <span className="absolute top-[76%] left-[20%] w-1 h-1 rounded-full bg-white/40" />
        <span className="absolute top-[82%] right-[22%] w-1 h-1 rounded-full bg-white/40" />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. 2027 QUANTUM GYROSCOPE DYNAMIC ROTATING ORBITAL RINGS (SVG)
         ══════════════════════════════════════════════════════════════════ */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      >
        <defs>
          <linearGradient id="gyro-orbit-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.30" />
            <stop offset="35%" stopColor="#818cf8" stopOpacity="0.22" />
            <stop offset="70%" stopColor="#818cf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.30" />
          </linearGradient>

          <linearGradient id="gyro-orbit-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.25" />
          </linearGradient>

          <linearGradient id="horizon-arc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="20%" stopColor="#38bdf8" stopOpacity="0.22" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.30" />
            <stop offset="80%" stopColor="#818cf8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>

          <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="beacon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b2" />
            <feMerge>
              <feMergeNode in="b2" />
              <feMergeNode in="b1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── 1. OUTER GYROSCOPE RING: Tilted -10°, Rotating Clockwise (42s) ── */}
        <g transform="translate(720 480) rotate(-10) scale(1 0.3793)">
          {/* Static Subtle Guide Orbit Track */}
          <circle
            cx="0"
            cy="0"
            r="580"
            fill="none"
            stroke="url(#gyro-orbit-1)"
            strokeWidth="1"
            strokeDasharray="4 8"
            className="opacity-25"
            vectorEffect="non-scaling-stroke"
          />

          {/* Dynamic Rotating Laser Stream & Orbiting Photons */}
          <g className="animate-spin-orbit-cw">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 0 0"
              to="360 0 0"
              dur="42s"
              repeatCount="indefinite"
            />
            {/* Primary Orbit Laser Dash Stream */}
            <circle
              cx="0"
              cy="0"
              r="580"
              fill="none"
              stroke="url(#gyro-orbit-1)"
              strokeWidth="1.5"
              strokeDasharray="16 12 4 12"
              filter="url(#ring-glow)"
              className="opacity-70"
              vectorEffect="non-scaling-stroke"
            />

            {/* Orbiting Quantum Beacons (Docked on outer ring perimeter) */}
            {/* Beacon Alpha (Cyan Lead, 0°) */}
            <circle cx="580" cy="0" r="5" fill="#38bdf8" filter="url(#beacon-glow)" />
            <circle cx="580" cy="0" r="2.2" fill="#ffffff" />

            {/* Beacon Beta (Violet Flank, 180°) */}
            <circle cx="-580" cy="0" r="5" fill="#c084fc" filter="url(#beacon-glow)" />
            <circle cx="-580" cy="0" r="2.2" fill="#ffffff" />

            {/* Beacon Gamma (Indigo Apex, 90°) */}
            <circle cx="0" cy="580" r="4.2" fill="#818cf8" filter="url(#beacon-glow)" />
            <circle cx="0" cy="580" r="1.8" fill="#ffffff" />

            {/* Beacon Delta (Sky Blue Nadir, 270°) */}
            <circle cx="0" cy="-580" r="4.2" fill="#38bdf8" filter="url(#beacon-glow)" />
            <circle cx="0" cy="-580" r="1.8" fill="#ffffff" />
          </g>
        </g>

        {/* ── 2. INNER GYROSCOPE RING: Tilted +7°, Counter-Clockwise (32s) ── */}
        <g transform="translate(720 480) rotate(7) scale(1 0.3723)">
          {/* Static Subtle Guide Orbit Track */}
          <circle
            cx="0"
            cy="0"
            r="470"
            fill="none"
            stroke="url(#gyro-orbit-2)"
            strokeWidth="0.8"
            strokeDasharray="4 6"
            className="opacity-20"
            vectorEffect="non-scaling-stroke"
          />

          {/* Counter-Clockwise Rotating Laser Stream */}
          <g className="animate-spin-orbit-ccw">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 0 0"
              to="0 0 0"
              dur="32s"
              repeatCount="indefinite"
            />
            {/* Inner Laser Orbit Ring */}
            <circle
              cx="0"
              cy="0"
              r="470"
              fill="none"
              stroke="url(#gyro-orbit-2)"
              strokeWidth="1.2"
              strokeDasharray="12 10 3 10"
              filter="url(#ring-glow)"
              className="opacity-60"
              vectorEffect="non-scaling-stroke"
            />

            {/* Orbiting Quantum Beacons (Diagonal 45° alignment) */}
            {/* Beacon 1 (Top-Right, 45°) */}
            <circle cx="332" cy="332" r="4.5" fill="#a855f7" filter="url(#beacon-glow)" />
            <circle cx="332" cy="332" r="2" fill="#ffffff" />

            {/* Beacon 2 (Bottom-Left, 225°) */}
            <circle cx="-332" cy="-332" r="4.5" fill="#38bdf8" filter="url(#beacon-glow)" />
            <circle cx="-332" cy="-332" r="2" fill="#ffffff" />

            {/* Beacon 3 (Top-Left, 135°) */}
            <circle cx="-332" cy="332" r="3.8" fill="#6366f1" filter="url(#beacon-glow)" />
            <circle cx="-332" cy="332" r="1.6" fill="#ffffff" />

            {/* Beacon 4 (Bottom-Right, 315°) */}
            <circle cx="332" cy="-332" r="3.8" fill="#38bdf8" filter="url(#beacon-glow)" />
            <circle cx="332" cy="-332" r="1.6" fill="#ffffff" />
          </g>
        </g>

        {/* ── 3. FRONT SWEEPING HORIZON LASER ARC: Continuous Flowing Laser Stream ── */}
        <path
          d="M 180 490 Q 720 570 1260 490"
          fill="none"
          stroke="url(#horizon-arc)"
          strokeWidth="1.2"
          strokeDasharray="10 8"
          filter="url(#ring-glow)"
          className="opacity-65 animate-laser-flow"
        />

        {/* ── 4. FIXED DOCKING STATION ANCHOR LIGHTS (Grounding the Satellite Pills - Calm Steady Glow) ── */}
        <circle cx="210" cy="465" r="2.5" fill="#38bdf8" opacity="0.4" />
        <circle cx="210" cy="465" r="1.5" fill="#ffffff" opacity="0.8" />
        <circle cx="340" cy="360" r="2" fill="#818cf8" opacity="0.4" />

        <circle cx="1230" cy="465" r="2.5" fill="#818cf8" opacity="0.4" />
        <circle cx="1230" cy="465" r="1.5" fill="#ffffff" opacity="0.8" />
        <circle cx="1100" cy="360" r="2" fill="#38bdf8" opacity="0.4" />
      </svg>
    </div>
  );
}
