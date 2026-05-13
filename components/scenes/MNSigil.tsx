"use client";

import { motion } from "framer-motion";

/**
 * The MAISON NOX house sigil — a proper interlocked baroque monogram.
 *
 *   1. Decorative outer ring + hairline rules draw in
 *   2. The M and N letterforms stroke-trace in gold
 *   3. The interior fills with the metallic gradient
 *   4. A vertical specular sheen sweeps across the form
 *   5. Center diamond accent settles
 */
export default function MNSigil({ active }: { active: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 280 280"
      className="w-[44vmin] max-w-[480px] h-auto"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
      transition={{ duration: 1.6, ease: [0.22, 0.8, 0.2, 1] }}
      aria-hidden
    >
      <defs>
        <linearGradient id="sigil-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbe9b0" />
          <stop offset="32%" stopColor="#d4af37" />
          <stop offset="55%" stopColor="#8c6f1e" />
          <stop offset="78%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#f4e1a4" />
        </linearGradient>

        <linearGradient id="sigil-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbe9b0" />
          <stop offset="100%" stopColor="#8c6f1e" />
        </linearGradient>

        <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        <filter id="sigil-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* Decorative outer rings */}
      <motion.circle
        cx="140"
        cy="140"
        r="128"
        fill="none"
        stroke="url(#sigil-gold)"
        strokeWidth="0.45"
        opacity="0.45"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={active ? { pathLength: 1, opacity: 0.45 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 2.0, delay: 0.1, ease: "easeOut" }}
      />
      <motion.circle
        cx="140"
        cy="140"
        r="122"
        fill="none"
        stroke="url(#sigil-gold)"
        strokeWidth="0.3"
        opacity="0.3"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={active ? { pathLength: 1, opacity: 0.3 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 2.0, delay: 0.25, ease: "easeOut" }}
      />

      {/* Hairline top + bottom rules */}
      <motion.line
        x1="60"
        y1="62"
        x2="220"
        y2="62"
        stroke="url(#sigil-gold)"
        strokeWidth="0.5"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
      />
      <motion.line
        x1="60"
        y1="218"
        x2="220"
        y2="218"
        stroke="url(#sigil-gold)"
        strokeWidth="0.5"
        initial={{ pathLength: 0 }}
        animate={active ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.4, delay: 0.55, ease: "easeOut" }}
      />

      {/* Outer halo behind the letters */}
      <motion.g
        filter="url(#sigil-glow)"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 0.55 } : { opacity: 0 }}
        transition={{ duration: 2.0, delay: 1.4, ease: "easeOut" }}
      >
        <Letters opacity={0.4} />
      </motion.g>

      {/* Stroke draw — "forged in light" */}
      <motion.g
        initial={{ opacity: 1 }}
        animate={active ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.8, ease: "easeOut" }}
      >
        <motion.g
          fill="none"
          stroke="url(#sigil-stroke)"
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 2.0, delay: 0.6, ease: [0.22, 0.8, 0.2, 1] }}
          style={{ filter: "drop-shadow(0 0 6px rgba(212,175,55,0.55))" }}
        >
          <LetterPaths />
        </motion.g>
      </motion.g>

      {/* Metallic fill blooms in */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.4, delay: 1.5, ease: "easeOut" }}
      >
        <Letters />
      </motion.g>

      {/* Center diamond accent */}
      <motion.g
        initial={{ opacity: 0, scale: 0.4 }}
        animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
        transition={{ duration: 1.2, delay: 2.4, ease: [0.22, 0.8, 0.2, 1] }}
        style={{ transformOrigin: "140px 140px" }}
      >
        <polygon
          points="140,132 148,140 140,148 132,140"
          fill="url(#sigil-gold)"
          stroke="rgba(244,225,164,0.8)"
          strokeWidth="0.4"
        />
        <line x1="68" y1="140" x2="124" y2="140" stroke="url(#sigil-gold)" strokeWidth="0.35" opacity="0.55" />
        <line x1="156" y1="140" x2="212" y2="140" stroke="url(#sigil-gold)" strokeWidth="0.35" opacity="0.55" />
      </motion.g>

      {/* Specular vertical sweep — premium light pass */}
      <motion.g
        initial={{ y: -300, opacity: 0 }}
        animate={active ? { y: 300, opacity: [0, 0.9, 0] } : { y: -300, opacity: 0 }}
        transition={{ duration: 2.4, delay: 2.0, ease: [0.5, 0, 0.2, 1] }}
        style={{ mixBlendMode: "screen" }}
      >
        <rect x="40" y="0" width="200" height="120" fill="url(#sheen)" opacity="0.45" />
      </motion.g>

      {/* Tiny credit beneath the sigil */}
      <motion.text
        x="140"
        y="246"
        textAnchor="middle"
        fontFamily="'Cormorant Garamond', serif"
        fontWeight="300"
        fontSize="6"
        letterSpacing="4"
        fill="#8c6f1e"
        opacity="0.85"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 0.85 } : { opacity: 0 }}
        transition={{ duration: 1.2, delay: 2.6 }}
      >
        EST · MMXXVI · PARIS
      </motion.text>
    </motion.svg>
  );
}

/* The two letterforms, sized + positioned to interlock as one mark. */
function Letters({ opacity = 1 }: { opacity?: number }) {
  return (
    <g fill="url(#sigil-gold)" opacity={opacity}>
      <LetterPaths />
    </g>
  );
}

/* Hand-drawn serif M + N. The N's left leg sits inside the M's right valley,
   so the two letters share visual space and read as a single sigil. */
function LetterPaths() {
  return (
    <>
      {/* M — wider, anchored to the left */}
      <path
        d="M62 200
           L62 80
           L70 76
           L76 80
           L120 178
           L122 178
           L166 80
           L172 76
           L180 80
           L180 200
           L168 200
           L168 100
           L130 196
           L112 196
           L74 100
           L74 200 Z"
      />
      {/* Serif feet for M */}
      <rect x="56" y="198" width="28" height="3" />
      <rect x="158" y="198" width="28" height="3" />
      {/* Top serifs */}
      <rect x="60" y="74" width="20" height="2.4" />
      <rect x="162" y="74" width="20" height="2.4" />

      {/* N — narrower, woven through the right side of the M */}
      <path
        d="M118 200
           L118 80
           L126 76
           L134 80
           L196 188
           L196 80
           L204 76
           L212 80
           L212 200
           L204 200
           L196 196
           L134 88
           L134 200 Z"
        opacity="0.95"
      />
      <rect x="112" y="198" width="26" height="3" />
      <rect x="190" y="198" width="26" height="3" />
      <rect x="116" y="74" width="22" height="2.4" />
      <rect x="190" y="74" width="22" height="2.4" />
    </>
  );
}
