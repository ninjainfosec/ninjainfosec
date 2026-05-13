"use client";

import { motion } from "framer-motion";

/**
 * A discreet royal crest: laurel wreath flanking the MN sigil under a small crown.
 * Restraint over ornament — barely-there gold linework on void.
 */
export default function RoyalCrest({ active }: { active: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 240 200"
      className="w-[14vmin] max-w-[140px] h-auto"
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={
        active
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 12, scale: 0.96 }
      }
      transition={{ duration: 1.6, ease: [0.22, 0.8, 0.2, 1] }}
      aria-hidden
    >
      <defs>
        <linearGradient id="crest-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4e1a4" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8c6f1e" />
        </linearGradient>
      </defs>

      {/* Crown — three minimal points */}
      <g stroke="url(#crest-gold)" fill="none" strokeWidth="1.1" strokeLinecap="round">
        <path d="M90 38 L100 22 L110 38" />
        <path d="M110 38 L120 18 L130 38" />
        <path d="M130 38 L140 22 L150 38" />
        <line x1="86" y1="40" x2="154" y2="40" />
        <circle cx="100" cy="22" r="1.2" fill="url(#crest-gold)" />
        <circle cx="120" cy="18" r="1.4" fill="url(#crest-gold)" />
        <circle cx="140" cy="22" r="1.2" fill="url(#crest-gold)" />
      </g>

      {/* Laurel wreath — minimal leaves */}
      <g fill="none" stroke="url(#crest-gold)" strokeWidth="0.9" strokeLinecap="round">
        {/* Left branch */}
        <path d="M70 70 Q60 110 88 160" />
        <path d="M68 80 Q56 84 50 76" />
        <path d="M66 96 Q54 102 48 94" />
        <path d="M68 116 Q56 122 50 114" />
        <path d="M74 138 Q62 144 56 138" />
        <path d="M84 156 Q72 162 66 156" />
        {/* Right branch (mirrored) */}
        <path d="M170 70 Q180 110 152 160" />
        <path d="M172 80 Q184 84 190 76" />
        <path d="M174 96 Q186 102 192 94" />
        <path d="M172 116 Q184 122 190 114" />
        <path d="M166 138 Q178 144 184 138" />
        <path d="M156 156 Q168 162 174 156" />
      </g>

      {/* Center MN sigil */}
      <g
        fontFamily="'Cormorant Garamond', serif"
        fontWeight="500"
        textAnchor="middle"
        fill="url(#crest-gold)"
      >
        <text x="120" y="110" fontSize="38" letterSpacing="1">
          MN
        </text>
        <text x="120" y="132" fontSize="6" letterSpacing="4" fontWeight="300">
          EST · MMXXVI
        </text>
      </g>

      {/* Base ribbon line */}
      <g stroke="url(#crest-gold)" strokeWidth="0.7" fill="none">
        <path d="M70 168 Q120 184 170 168" />
        <path d="M68 168 L60 174" />
        <path d="M172 168 L180 174" />
      </g>
    </motion.svg>
  );
}
