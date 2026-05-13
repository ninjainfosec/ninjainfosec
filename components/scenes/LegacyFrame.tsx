"use client";

import { motion } from "framer-motion";

/**
 * Ornamental gold frame for the legacy reveal — hairline rectangle that
 * draws in from the corners, with discreet floret accents at each corner
 * and a small heraldic ornament centered along the top + bottom edges.
 *
 * Sits behind the legacy lockup; its sole job is to give the final
 * frame the gravity of a museum plaque.
 */
export default function LegacyFrame({ active }: { active: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 800 500"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 m-auto w-[82vw] max-w-[1100px] h-auto pointer-events-none"
      style={{ aspectRatio: "8/5" }}
      aria-hidden
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
    >
      <defs>
        <linearGradient id="frame-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4e1a4" />
          <stop offset="55%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8c6f1e" />
        </linearGradient>
      </defs>

      {/* Four edges, each drawing from the corner inward */}
      <motion.line
        x1="40" y1="40" x2="400" y2="40"
        stroke="url(#frame-gold)" strokeWidth="0.55"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.8, delay: 0.6, ease: [0.22, 0.8, 0.2, 1] }}
      />
      <motion.line
        x1="760" y1="40" x2="400" y2="40"
        stroke="url(#frame-gold)" strokeWidth="0.55"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.8, delay: 0.6, ease: [0.22, 0.8, 0.2, 1] }}
      />
      <motion.line
        x1="40" y1="460" x2="400" y2="460"
        stroke="url(#frame-gold)" strokeWidth="0.55"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.8, delay: 0.8, ease: [0.22, 0.8, 0.2, 1] }}
      />
      <motion.line
        x1="760" y1="460" x2="400" y2="460"
        stroke="url(#frame-gold)" strokeWidth="0.55"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.8, delay: 0.8, ease: [0.22, 0.8, 0.2, 1] }}
      />
      <motion.line
        x1="40" y1="40" x2="40" y2="250"
        stroke="url(#frame-gold)" strokeWidth="0.55"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.8, delay: 0.7, ease: [0.22, 0.8, 0.2, 1] }}
      />
      <motion.line
        x1="40" y1="460" x2="40" y2="250"
        stroke="url(#frame-gold)" strokeWidth="0.55"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.8, delay: 0.7, ease: [0.22, 0.8, 0.2, 1] }}
      />
      <motion.line
        x1="760" y1="40" x2="760" y2="250"
        stroke="url(#frame-gold)" strokeWidth="0.55"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.8, delay: 0.7, ease: [0.22, 0.8, 0.2, 1] }}
      />
      <motion.line
        x1="760" y1="460" x2="760" y2="250"
        stroke="url(#frame-gold)" strokeWidth="0.55"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.8, delay: 0.7, ease: [0.22, 0.8, 0.2, 1] }}
      />

      {/* Inner hairline (offset 6px in) */}
      <motion.rect
        x="48" y="48" width="704" height="404"
        fill="none" stroke="url(#frame-gold)" strokeWidth="0.3" opacity="0.55"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={active ? { pathLength: 1, opacity: 0.55 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 2.0, delay: 1.2, ease: "easeOut" }}
      />

      {/* Corner florets */}
      {[
        { x: 40, y: 40, r: 0 },
        { x: 760, y: 40, r: 90 },
        { x: 760, y: 460, r: 180 },
        { x: 40, y: 460, r: 270 },
      ].map((c, i) => (
        <motion.g
          key={i}
          transform={`translate(${c.x} ${c.y}) rotate(${c.r})`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 1.2, delay: 1.6 + i * 0.08, ease: [0.22, 0.8, 0.2, 1] }}
        >
          <line x1="0" y1="0" x2="14" y2="0" stroke="url(#frame-gold)" strokeWidth="0.6" />
          <line x1="0" y1="0" x2="0" y2="14" stroke="url(#frame-gold)" strokeWidth="0.6" />
          <circle cx="0" cy="0" r="1.4" fill="url(#frame-gold)" />
          <line x1="6" y1="6" x2="18" y2="18" stroke="url(#frame-gold)" strokeWidth="0.4" opacity="0.6" />
        </motion.g>
      ))}

      {/* Top + bottom center ornaments — small diamond between two short rules */}
      {[40, 460].map((y, i) => (
        <motion.g
          key={i}
          transform={`translate(400 ${y})`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 1.0, delay: 1.9 + i * 0.1, ease: [0.22, 0.8, 0.2, 1] }}
        >
          <rect x="-16" y="-1" width="32" height="2" fill="#000" />
          <line x1="-16" y1="0" x2="-4" y2="0" stroke="url(#frame-gold)" strokeWidth="0.5" />
          <line x1="16" y1="0" x2="4" y2="0" stroke="url(#frame-gold)" strokeWidth="0.5" />
          <polygon points="0,-4 4,0 0,4 -4,0" fill="url(#frame-gold)" />
        </motion.g>
      ))}
    </motion.svg>
  );
}
