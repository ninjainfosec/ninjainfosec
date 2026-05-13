"use client";

import { motion } from "framer-motion";

/**
 * Maison Nox flacon — black optical-glass body, polished gold cap with
 * knurled collar, amber liquid level inside, refractive distortion at the
 * shoulders via feTurbulence + feDisplacementMap, and a slow specular pass
 * that gives the glass a sense of curvature.
 */
export default function PerfumeBottle({ active }: { active: boolean }) {
  return (
    <motion.div
      className="relative flex items-end justify-center"
      style={{ perspective: 1800 }}
      initial={{ opacity: 0, y: 80, scale: 0.92 }}
      animate={active ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 80, scale: 0.92 }}
      transition={{ duration: 2.0, ease: [0.22, 0.8, 0.2, 1] }}
    >
      {/* Floor pool */}
      <motion.div
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[44vmin] h-[7vmin] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(212,175,55,0.30) 0%, rgba(212,175,55,0.10) 40%, rgba(0,0,0,0) 75%)",
          filter: "blur(10px)",
        }}
        initial={{ opacity: 0, scaleX: 0.5 }}
        animate={active ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.5 }}
        transition={{ duration: 2.4, delay: 0.2, ease: "easeOut" }}
      />

      {/* Hairline floor reflection of the bottle (vertical mirror) */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 -bottom-[34vmin] w-[34vmin] max-w-[360px] h-[34vmin] pointer-events-none"
        style={{
          transform: "scaleY(-1)",
          opacity: 0.18,
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 60%)",
          filter: "blur(2px)",
        }}
      >
        <BottleSVG mirrored />
      </div>

      {/* Bottle proper */}
      <motion.div
        className="relative"
        animate={
          active
            ? { rotateY: [-3, 3, -1.5, 0], y: [0, -6, 0] }
            : { rotateY: 0, y: 0 }
        }
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <BottleSVG />
      </motion.div>
    </motion.div>
  );
}

function BottleSVG({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <svg
      viewBox="0 0 240 520"
      className="relative w-[34vmin] max-w-[360px] h-auto"
      style={{
        filter: mirrored ? "none" : "drop-shadow(0 30px 60px rgba(0,0,0,0.95))",
      }}
      aria-hidden
    >
      <defs>
        {/* Black glass body, asymmetric highlight */}
        <linearGradient id="glass-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0a0a0a" />
          <stop offset="14%" stopColor="#1d1d1d" />
          <stop offset="38%" stopColor="#050505" />
          <stop offset="62%" stopColor="#0e0e0e" />
          <stop offset="88%" stopColor="#181818" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>

        {/* Polished gold cap */}
        <linearGradient id="cap-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbe9b0" />
          <stop offset="28%" stopColor="#e5c977" />
          <stop offset="55%" stopColor="#a98b30" />
          <stop offset="80%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#6a5414" />
        </linearGradient>

        <linearGradient id="cap-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6a5414" />
          <stop offset="50%" stopColor="#fbe9b0" />
          <stop offset="100%" stopColor="#6a5414" />
        </linearGradient>

        {/* Amber liquid */}
        <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b2a0c" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#7a5417" stopOpacity="0.9" />
        </linearGradient>

        {/* Vertical specular */}
        <linearGradient id="glass-spec" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.32)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Soft inner rim glow */}
        <linearGradient id="rim-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(244,225,164,0.85)" />
          <stop offset="100%" stopColor="rgba(212,175,55,0)" />
        </linearGradient>

        <radialGradient id="bottle-floor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(212,175,55,0.4)" />
          <stop offset="100%" stopColor="rgba(212,175,55,0)" />
        </radialGradient>

        {/* Glass refraction filter — gentle turbulent distortion at shoulders */}
        <filter id="refract" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="3" />
        </filter>

        {/* Cap knurling pattern */}
        <pattern id="knurl" x="0" y="0" width="3" height="6" patternUnits="userSpaceOnUse">
          <rect width="3" height="6" fill="#a98b30" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#6a5414" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Cap shadow cast on shoulder */}
      <ellipse cx="120" cy="138" rx="62" ry="6" fill="rgba(0,0,0,0.7)" />

      {/* Cap stack */}
      <g>
        {/* Top dome */}
        <rect x="74" y="24" width="92" height="22" rx="6" fill="url(#cap-gold)" />
        <rect x="74" y="24" width="92" height="5" fill="url(#cap-edge)" />
        {/* Mid knurled collar */}
        <rect x="74" y="46" width="92" height="14" fill="url(#knurl)" opacity="0.95" />
        {/* Main cap body */}
        <rect x="74" y="60" width="92" height="68" rx="3" fill="url(#cap-gold)" />
        <rect x="74" y="124" width="92" height="6" fill="url(#cap-edge)" />
        {/* Cap specular */}
        <rect x="92" y="32" width="6" height="92" fill="rgba(255,255,255,0.4)" />
        <rect x="138" y="32" width="3" height="92" fill="rgba(255,255,255,0.22)" />
        {/* Embossed MN on cap face */}
        <text
          x="120"
          y="100"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', serif"
          fontWeight="500"
          fontSize="18"
          letterSpacing="1"
          fill="#6a5414"
          opacity="0.85"
        >
          MN
        </text>
      </g>

      {/* Neck */}
      <g>
        <rect x="96" y="128" width="48" height="18" fill="url(#cap-gold)" opacity="0.85" />
        <rect x="96" y="144" width="48" height="4" fill="#080808" />
        {/* Neck collar shine */}
        <rect x="102" y="130" width="3" height="14" fill="rgba(255,255,255,0.45)" />
      </g>

      {/* Glass body — slight refraction filter applied */}
      <g filter="url(#refract)">
        <path
          d="M40 178
             Q40 152 76 148
             L164 148
             Q200 152 200 178
             L200 470
             Q200 494 174 494
             L66 494
             Q40 494 40 470 Z"
          fill="url(#glass-body)"
          stroke="rgba(212,175,55,0.20)"
          strokeWidth="0.8"
        />
      </g>

      {/* Amber liquid level inside the bottle (clipped to bottle interior) */}
      <defs>
        <clipPath id="liquid-clip">
          <path
            d="M48 184
               Q48 158 80 154
               L160 154
               Q192 158 192 184
               L192 462
               Q192 484 168 484
               L72 484
               Q48 484 48 462 Z"
          />
        </clipPath>
      </defs>
      <g clipPath="url(#liquid-clip)">
        <rect x="48" y="280" width="144" height="220" fill="url(#liquid)" opacity="0.85" />
        {/* Meniscus highlight */}
        <ellipse cx="120" cy="282" rx="72" ry="3" fill="rgba(255,220,140,0.45)" />
      </g>

      {/* Left inner rim glow */}
      <path
        d="M46 178 Q46 156 82 152 L92 152 L92 484 L74 484 Q50 484 50 466 Z"
        fill="url(#rim-light)"
        opacity="0.4"
      />

      {/* Vertical specular */}
      <rect x="106" y="168" width="26" height="306" fill="url(#glass-spec)" opacity="0.5" />

      {/* Right edge shadow */}
      <path
        d="M190 178 L190 470 Q190 484 178 484 L172 484 L172 152 Q190 156 190 178 Z"
        fill="rgba(0,0,0,0.6)"
      />

      {/* Floor highlight inside bottle */}
      <ellipse cx="120" cy="472" rx="64" ry="9" fill="url(#bottle-floor)" />

      {/* Etched gold label */}
      <g transform="translate(120, 340)">
        {/* Hairline decorative frame */}
        <rect
          x="-46"
          y="-32"
          width="92"
          height="78"
          fill="none"
          stroke="#8c6f1e"
          strokeWidth="0.4"
          opacity="0.45"
        />
        <rect
          x="-49"
          y="-35"
          width="98"
          height="84"
          fill="none"
          stroke="#8c6f1e"
          strokeWidth="0.3"
          opacity="0.3"
        />
        <text
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', serif"
          fontWeight="500"
          fontSize="42"
          letterSpacing="2"
          fill="url(#cap-gold)"
          style={{ filter: "drop-shadow(0 0 4px rgba(212,175,55,0.45))" }}
        >
          MN
        </text>
        <text
          y="22"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', serif"
          fontWeight="300"
          fontSize="6.5"
          letterSpacing="6"
          fill="#c5a45c"
          opacity="0.95"
        >
          MAISON NOX
        </text>
        <line x1="-26" y1="30" x2="26" y2="30" stroke="#8c6f1e" strokeWidth="0.45" opacity="0.7" />
        <text
          y="40"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond', serif"
          fontWeight="300"
          fontSize="4.5"
          letterSpacing="4"
          fill="#8c6f1e"
          opacity="0.85"
        >
          EAU DE PARFUM · 100ML
        </text>
      </g>

      {/* Slow specular sweep across the glass */}
      {!mirrored && (
        <motion.rect
          x="-80"
          y="140"
          width="48"
          height="360"
          fill="rgba(255,255,255,0.20)"
          style={{ mixBlendMode: "screen", filter: "blur(8px)" }}
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 260, opacity: [0, 0.7, 0] }}
          transition={{ duration: 3.0, delay: 1.2, ease: [0.5, 0, 0.2, 1] }}
        />
      )}
    </svg>
  );
}
