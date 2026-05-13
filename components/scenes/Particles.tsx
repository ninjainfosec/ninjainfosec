"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

type ParticlesProps = {
  /** Number of particles to render. Keep modest for performance. */
  count?: number;
  /** 0..1 — overall opacity multiplier of the entire particle field. */
  intensity?: number;
  /** A seed so two layers can render different distributions. */
  seed?: number;
};

// Deterministic pseudo-random so SSR + client match and re-renders stay stable.
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Atmospheric gold dust. Soft, slow, cinematic — never disco.
 * Each particle drifts on a long, eased loop with its own delay so the field
 * feels organic instead of synchronized.
 */
export default function Particles({
  count = 70,
  intensity = 1,
  seed = 17,
}: ParticlesProps) {
  const particles = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, (_, i) => {
      const size = rand() * 2.6 + 0.6;
      return {
        id: i,
        x: rand() * 100,
        y: rand() * 100,
        size,
        baseOpacity: rand() * 0.55 + 0.08,
        driftX: rand() * 80 - 40,
        driftY: rand() * 80 - 40,
        duration: rand() * 22 + 16,
        delay: rand() * 14,
        blur: size > 2 ? 1.2 : 0.4,
      };
    });
  }, [count, seed]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity: intensity }}
      aria-hidden
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full will-change-transform"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background:
              "radial-gradient(circle, rgba(244,225,164,0.95) 0%, rgba(212,175,55,0.6) 45%, rgba(212,175,55,0) 75%)",
            filter: `blur(${p.blur}px)`,
            opacity: p.baseOpacity,
          }}
          animate={{
            x: [0, p.driftX * 0.6, p.driftX, p.driftX * 0.4, 0],
            y: [0, p.driftY * 0.5, p.driftY, p.driftY * 0.3, 0],
            opacity: [
              p.baseOpacity * 0.25,
              p.baseOpacity,
              p.baseOpacity * 0.7,
              p.baseOpacity,
              p.baseOpacity * 0.25,
            ],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
