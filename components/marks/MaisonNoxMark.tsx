"use client";

import { motion } from "framer-motion";

/**
 * MAISON NOX house mark — built in the same heraldic idiom as the parent
 * THE MAISON WORLD identity (shield, double outline, Cinzel wordmark,
 * thin rule, subtitle) so the two read as a single brand family.
 *
 * Inside the shield: an interlocked MN — the M is the wider outer letter,
 * the N is woven through its right shoulder.
 */
export default function MaisonNoxMark({ active }: { active: boolean }) {
  const LUX: [number, number, number, number] = [0.22, 0.8, 0.2, 1];

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1.4, ease: LUX }}
    >
      <motion.svg
        viewBox="0 0 360 460"
        className="w-[36vmin] max-w-[420px] h-auto drop-shadow-[0_0_40px_rgba(212,175,55,0.18)]"
        aria-hidden
      >
        <defs>
          <linearGradient id="nox-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4e1a4" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8c6f1e" />
          </linearGradient>
          <linearGradient id="nox-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Outer shield outline */}
        <motion.path
          d="M 60 40
             L 300 40
             L 300 240
             Q 300 320 180 420
             Q 60 320 60 240
             Z"
          fill="none"
          stroke="url(#nox-gold)"
          strokeWidth="3"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 1.8, delay: 0.2, ease: LUX }}
        />

        {/* Inner shield outline */}
        <motion.path
          d="M 72 52
             L 288 52
             L 288 238
             Q 288 312 180 402
             Q 72 312 72 238
             Z"
          fill="none"
          stroke="url(#nox-gold)"
          strokeWidth="1.4"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { pathLength: 1, opacity: 0.9 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 1.8, delay: 0.45, ease: LUX }}
        />

        {/* MN monogram — M wider and outer, N woven through the right valley.
            Both letters drawn in the same Cinzel-adjacent weight as the WM mark. */}
        <motion.g
          fill="url(#nox-gold)"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
          transition={{ duration: 1.4, delay: 1.1, ease: LUX }}
          style={{ transformOrigin: "180px 240px", transformBox: "fill-box" as any }}
        >
          {/* M — outer letter, two strong diagonals meeting at the center valley */}
          <path d="M 108 318
                   L 108 138
                   L 132 138
                   L 180 248
                   L 228 138
                   L 252 138
                   L 252 318
                   L 234 318
                   L 234 172
                   L 188 274
                   L 172 274
                   L 126 172
                   L 126 318 Z" />
          {/* Serif feet on M */}
          <rect x="100" y="316" width="34" height="4" />
          <rect x="226" y="316" width="34" height="4" />
          {/* Top serifs on M */}
          <rect x="104" y="136" width="30" height="3" />
          <rect x="226" y="136" width="30" height="3" />

          {/* N — narrower, sitting inside the right shoulder of the M */}
          <path d="M 178 318
                   L 178 168
                   L 196 168
                   L 252 274
                   L 252 168
                   L 268 168
                   L 268 318
                   L 250 318
                   L 196 212
                   L 196 318 Z"
                opacity="0.96" />
          <rect x="172" y="316" width="30" height="3.5" opacity="0.96" />
          <rect x="244" y="316" width="30" height="3.5" opacity="0.96" />
        </motion.g>

        {/* Vertical specular sweep — premium light pass over the mark */}
        <motion.g
          initial={{ y: -380, opacity: 0 }}
          animate={active ? { y: 460, opacity: [0, 0.8, 0] } : { y: -380, opacity: 0 }}
          transition={{ duration: 2.4, delay: 2.0, ease: [0.5, 0, 0.2, 1] }}
          style={{ mixBlendMode: "screen" }}
        >
          <rect x="60" y="0" width="240" height="120" fill="url(#nox-sheen)" opacity="0.5" />
        </motion.g>
      </motion.svg>

      {/* Wordmark */}
      <motion.h1
        className="mt-6 font-display gold-foil text-[clamp(2rem,5.2vmin,3.6rem)] tracking-[0.22em] leading-none"
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={
          active
            ? { opacity: 1, y: 0, filter: "blur(0px)" }
            : { opacity: 0, y: 14, filter: "blur(8px)" }
        }
        transition={{ duration: 1.6, delay: 2.0, ease: LUX }}
      >
        MAISON NOX
      </motion.h1>

      {/* Hairline rule */}
      <motion.div
        className="mt-3 h-px w-[36vmin] max-w-[420px] origin-center"
        style={{
          background:
            "linear-gradient(90deg, rgba(212,175,55,0) 0%, #d4af37 50%, rgba(212,175,55,0) 100%)",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={active ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 1.4, delay: 2.5, ease: LUX }}
      />

      {/* Subtitle */}
      <motion.p
        className="mt-3 font-display text-[clamp(0.7rem,1.4vmin,0.95rem)] tracking-[0.55em] text-[#c5a45c]"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2, delay: 2.8, ease: LUX }}
      >
        PARFUM · PARIS
      </motion.p>
    </motion.div>
  );
}
