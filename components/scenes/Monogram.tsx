"use client";

import { motion } from "framer-motion";

/**
 * The MAISON NOX monogram — interlocking M and N, cast in gold.
 * Stroke draws first (forged in light), then the metallic fill blooms,
 * then a cinematic specular sweep passes across the form.
 */
export default function Monogram({ active }: { active: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 480 320"
      className="w-[58vmin] max-w-[680px] h-auto"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={
        active
          ? { opacity: 1, scale: 1 }
          : { opacity: 0, scale: 0.94 }
      }
      transition={{ duration: 1.6, ease: [0.22, 0.8, 0.2, 1] }}
      aria-hidden
    >
      <defs>
        <linearGradient id="mn-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4e1a4" />
          <stop offset="35%" stopColor="#d4af37" />
          <stop offset="60%" stopColor="#8c6f1e" />
          <stop offset="80%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#efd998" />
        </linearGradient>

        <linearGradient id="mn-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4e1a4" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8c6f1e" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient
          id="mn-sheen"
          x1="-0.3"
          y1="0"
          x2="0.3"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        <filter id="mn-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/*
          Two interlocking serif glyphs, simplified to elegant strokes
          so they read as a single sigil rather than typed letters.
        */}
        <symbol id="mn-glyph" viewBox="0 0 480 320">
          {/* M */}
          <path
            d="M70 270 L70 60 L100 60 L170 200 L240 60 L270 60 L270 270 L240 270 L240 110 L185 220 L155 220 L100 110 L100 270 Z"
            fill="url(#mn-gold)"
          />
          {/* N — sized to interlock with the M's right limb */}
          <path
            d="M210 270 L210 60 L240 60 L370 220 L370 60 L400 60 L400 270 L370 270 L240 110 L240 270 Z"
            fill="url(#mn-gold)"
            opacity="0.96"
          />
          {/* Serif crossbar — ties the monogram into one piece */}
          <rect x="60" y="58" width="350" height="3" fill="url(#mn-gold)" />
          <rect x="60" y="269" width="350" height="3" fill="url(#mn-gold)" />
        </symbol>
      </defs>

      {/* Outer halo bloom */}
      <motion.g
        filter="url(#mn-glow)"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 0.55 } : { opacity: 0 }}
        transition={{ duration: 2, delay: 0.6, ease: "easeOut" }}
      >
        <use href="#mn-glyph" opacity="0.25" />
      </motion.g>

      {/* Stroke draw — "forged in light" */}
      <motion.g
        initial={{ opacity: 1 }}
        animate={active ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 1.1, delay: 1.5, ease: "easeOut" }}
      >
        <motion.use
          href="#mn-glyph"
          fill="none"
          stroke="url(#mn-stroke)"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 1.6, ease: [0.22, 0.8, 0.2, 1] }}
          style={{ filter: "drop-shadow(0 0 8px rgba(212,175,55,0.55))" }}
        />
      </motion.g>

      {/* Metallic fill blooms in */}
      <motion.use
        href="#mn-glyph"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.4, delay: 1.0, ease: "easeOut" }}
      />

      {/* Specular sheen sweep — cinematic light pass */}
      <motion.g
        initial={{ x: -480, opacity: 0 }}
        animate={active ? { x: 480, opacity: [0, 1, 0] } : { x: -480, opacity: 0 }}
        transition={{ duration: 1.8, delay: 1.6, ease: [0.5, 0, 0.2, 1] }}
        style={{ mixBlendMode: "screen" }}
      >
        <rect x="0" y="0" width="160" height="320" fill="url(#mn-sheen)" opacity="0.5" />
      </motion.g>
    </motion.svg>
  );
}
