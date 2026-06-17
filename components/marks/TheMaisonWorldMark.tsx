"use client";

import { motion } from "framer-motion";

/**
 * THE MAISON WORLD — the parent house mark, reproduced as SVG to match
 * the supplied identity. Shield (double outline) · WM monogram ·
 * "THE MAISON WORLD" wordmark · rule · "HOUSE OF DISTINCTION".
 *
 * All gold drawn with stroke-then-fill so the entire mark can elegantly
 * trace in over ~2 seconds.
 */
export default function TheMaisonWorldMark({
  active,
  scale = 1,
}: {
  active: boolean;
  scale?: number;
}) {
  const LUX: [number, number, number, number] = [0.22, 0.8, 0.2, 1];

  return (
    <motion.div
      className="flex flex-col items-center"
      style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1.2, ease: LUX }}
    >
      <motion.svg
        viewBox="0 0 360 460"
        className="w-[26vmin] max-w-[280px] h-auto"
        aria-hidden
      >
        <defs>
          <linearGradient id="tmw-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4e1a4" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8c6f1e" />
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
          stroke="url(#tmw-gold)"
          strokeWidth="3"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 1.6, delay: 0.2, ease: LUX }}
        />

        {/* Inner shield outline (offset 10px in) */}
        <motion.path
          d="M 72 52
             L 288 52
             L 288 238
             Q 288 312 180 402
             Q 72 312 72 238
             Z"
          fill="none"
          stroke="url(#tmw-gold)"
          strokeWidth="1.4"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { pathLength: 1, opacity: 0.9 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 1.6, delay: 0.45, ease: LUX }}
        />

        {/* WM monogram — interlocked M (downward) + W (upward), filled gold */}
        <motion.g
          fill="url(#tmw-gold)"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
          transition={{ duration: 1.4, delay: 1.1, ease: LUX }}
          style={{ transformOrigin: "180px 240px", transformBox: "fill-box" as any }}
        >
          {/* Outer M — top-anchored, two diagonals descending toward the center */}
          <path
            d="M 116 134
               L 116 320
               L 134 320
               L 134 168
               L 180 250
               L 226 168
               L 226 320
               L 244 320
               L 244 134
               L 224 134
               L 180 222
               L 136 134 Z"
          />
          {/* Inner W — bottom-anchored, two diagonals ascending toward the center.
              Slightly smaller and inset; drawn as a vertically-mirrored M. */}
          <path
            d="M 138 314
               L 138 184
               L 152 184
               L 152 290
               L 180 230
               L 208 290
               L 208 184
               L 222 184
               L 222 314
               L 206 314
               L 180 256
               L 154 314 Z"
            opacity="0.96"
          />
        </motion.g>
      </motion.svg>

      {/* Wordmark */}
      <motion.h1
        className="mt-6 font-display gold-foil text-[clamp(1.4rem,3.8vmin,2.6rem)] tracking-[0.16em] leading-none"
        initial={{ opacity: 0, y: 10 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 1.4, delay: 1.8, ease: LUX }}
      >
        THE MAISON WORLD
      </motion.h1>

      {/* Hairline rule */}
      <motion.div
        className="mt-3 h-px w-[26vmin] max-w-[280px] origin-center"
        style={{
          background:
            "linear-gradient(90deg, rgba(212,175,55,0) 0%, #d4af37 50%, rgba(212,175,55,0) 100%)",
        }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={active ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
        transition={{ duration: 1.2, delay: 2.2, ease: LUX }}
      />

      {/* Subtitle */}
      <motion.p
        className="mt-3 font-display text-[clamp(0.65rem,1.3vmin,0.85rem)] tracking-[0.48em] text-[#c5a45c]"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2, delay: 2.5, ease: LUX }}
      >
        HOUSE OF DISTINCTION
      </motion.p>
    </motion.div>
  );
}
