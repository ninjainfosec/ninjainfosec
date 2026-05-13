"use client";

import { motion } from "framer-motion";

/**
 * Maison Nox flagship flacon — black glossy glass, polished gold cap,
 * thick weighted base, soft rim lighting. Built entirely in SVG so it
 * scales crisply at any viewport.
 */
export default function PerfumeBottle({ active }: { active: boolean }) {
  return (
    <motion.div
      className="relative flex items-end justify-center"
      style={{ perspective: 1400 }}
      initial={{ opacity: 0, y: 80 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 80 }}
      transition={{ duration: 2.2, ease: [0.22, 0.8, 0.2, 1] }}
    >
      {/* Floor pool — soft gold reflection on the void */}
      <motion.div
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[40vmin] h-[6vmin] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 35%, rgba(0,0,0,0) 70%)",
          filter: "blur(8px)",
        }}
        initial={{ opacity: 0, scaleX: 0.6 }}
        animate={active ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.6 }}
        transition={{ duration: 2.6, delay: 0.3, ease: "easeOut" }}
      />

      {/* Bottle */}
      <motion.svg
        viewBox="0 0 220 460"
        className="relative w-[34vmin] max-w-[360px] h-auto drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
        animate={
          active
            ? { rotateY: [0, 2, -2, 0], y: [0, -6, 0] }
            : { rotateY: 0, y: 0 }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <defs>
          {/* Black glossy glass body */}
          <linearGradient id="glass-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0a0a0a" />
            <stop offset="20%" stopColor="#1a1a1a" />
            <stop offset="50%" stopColor="#050505" />
            <stop offset="80%" stopColor="#161616" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          {/* Polished gold cap */}
          <linearGradient id="cap-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4e1a4" />
            <stop offset="35%" stopColor="#d4af37" />
            <stop offset="70%" stopColor="#8c6f1e" />
            <stop offset="100%" stopColor="#6a5414" />
          </linearGradient>

          <linearGradient id="cap-gold-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8c6f1e" />
            <stop offset="50%" stopColor="#f4e1a4" />
            <stop offset="100%" stopColor="#8c6f1e" />
          </linearGradient>

          {/* Subtle vertical highlight on the glass */}
          <linearGradient id="glass-spec" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="rim-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(244,225,164,0.7)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </linearGradient>

          <radialGradient id="bottle-floor" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="rgba(212,175,55,0.35)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </radialGradient>

          <filter id="bottle-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Cap shadow on shoulder */}
        <ellipse cx="110" cy="118" rx="55" ry="6" fill="rgba(0,0,0,0.6)" />

        {/* Cap */}
        <g>
          <rect x="72" y="22" width="76" height="92" rx="4" fill="url(#cap-gold)" />
          <rect x="72" y="22" width="76" height="6" fill="url(#cap-gold-edge)" />
          <rect x="72" y="108" width="76" height="6" fill="url(#cap-gold-edge)" />
          {/* Cap specular */}
          <rect x="86" y="30" width="6" height="76" fill="rgba(255,255,255,0.35)" />
          <rect x="128" y="30" width="3" height="76" fill="rgba(255,255,255,0.18)" />
        </g>

        {/* Neck */}
        <rect x="92" y="114" width="36" height="18" fill="url(#cap-gold)" opacity="0.85" />
        <rect x="92" y="130" width="36" height="6" fill="#0a0a0a" />

        {/* Bottle body — heavy shoulders, weighted base */}
        <path
          d="M40 160
             Q40 138 70 134
             L150 134
             Q180 138 180 160
             L180 410
             Q180 432 158 432
             L62 432
             Q40 432 40 410 Z"
          fill="url(#glass-body)"
          stroke="rgba(212,175,55,0.18)"
          strokeWidth="0.6"
        />

        {/* Inner rim light — subtle highlight along left edge */}
        <path
          d="M44 160
             Q44 142 72 138
             L80 138
             L80 426
             L62 426
             Q48 426 48 410 Z"
          fill="url(#rim-light)"
          opacity="0.35"
        />

        {/* Vertical specular */}
        <rect x="98" y="150" width="22" height="270" fill="url(#glass-spec)" opacity="0.45" />

        {/* Right edge dark */}
        <path
          d="M170 160 L170 420 Q170 428 160 428 L155 428 L155 138 Q170 142 170 160 Z"
          fill="rgba(0,0,0,0.55)"
        />

        {/* Floor highlight inside bottle */}
        <ellipse cx="110" cy="412" rx="58" ry="8" fill="url(#bottle-floor)" />

        {/* Engraved gold MN */}
        <g transform="translate(110, 290)">
          <text
            textAnchor="middle"
            fontFamily="'Cormorant Garamond', serif"
            fontWeight="500"
            fontSize="38"
            letterSpacing="2"
            fill="url(#cap-gold)"
            style={{ filter: "drop-shadow(0 0 4px rgba(212,175,55,0.4))" }}
          >
            MN
          </text>
          <text
            y="22"
            textAnchor="middle"
            fontFamily="'Cormorant Garamond', serif"
            fontWeight="300"
            fontSize="7"
            letterSpacing="6"
            fill="#b89a52"
            opacity="0.85"
          >
            MAISON NOX
          </text>
          {/* Hairline divider */}
          <line x1="-22" y1="32" x2="22" y2="32" stroke="#8c6f1e" strokeWidth="0.5" opacity="0.7" />
          <text
            y="44"
            textAnchor="middle"
            fontFamily="'Cormorant Garamond', serif"
            fontWeight="300"
            fontSize="5"
            letterSpacing="4"
            fill="#8c6f1e"
            opacity="0.8"
          >
            EAU DE PARFUM
          </text>
        </g>

        {/* Animated specular sweep across glass */}
        <motion.rect
          x="-60"
          y="120"
          width="40"
          height="320"
          fill="rgba(255,255,255,0.18)"
          style={{ mixBlendMode: "screen", filter: "blur(6px)" }}
          initial={{ x: -60, opacity: 0 }}
          animate={active ? { x: 240, opacity: [0, 0.6, 0] } : { x: -60, opacity: 0 }}
          transition={{ duration: 2.4, delay: 1.4, ease: [0.5, 0, 0.2, 1] }}
        />
      </motion.svg>
    </motion.div>
  );
}
