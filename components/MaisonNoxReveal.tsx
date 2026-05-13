"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import Particles from "./scenes/Particles";
import Monogram from "./scenes/Monogram";
import PerfumeBottle from "./scenes/PerfumeBottle";
import RoyalCrest from "./scenes/RoyalCrest";

/*
 * Cinematic timeline (seconds):
 *   1. DARKNESS              0 → 2
 *   2. ENERGY AWAKENING      2 → 5
 *   3. MONOGRAM FORGED       5 → 8
 *   4. BRAND REVEAL          8 → 11
 *   5. BOTTLE EMERGENCE     11 → 15
 *   6. LUXURY STATEMENT     15 → 18
 *   7. LEGACY REVEAL        18 → 22  (then holds)
 *
 * Each scene drives in/out via a master `t` (seconds since start).
 * Particles + camera drift run continuously underneath.
 */

const LUX_EASE: [number, number, number, number] = [0.22, 0.8, 0.2, 1];

type SceneKey = 1 | 2 | 3 | 4 | 5 | 6 | 7;

function sceneAt(t: number): SceneKey {
  if (t < 2) return 1;
  if (t < 5) return 2;
  if (t < 8) return 3;
  if (t < 11) return 4;
  if (t < 15) return 5;
  if (t < 18) return 6;
  return 7;
}

export default function MaisonNoxReveal() {
  const reduce = useReducedMotion();
  const [t, setT] = useState(0);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (reduce) {
      // Skip straight to the held final frame for accessibility.
      setT(22);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      setT(elapsed);
      if (elapsed < 24) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce, runId]);

  const replay = useCallback(() => setRunId((n) => n + 1), []);
  const scene = sceneAt(t);

  return (
    <section className="relative h-[100svh] w-full bg-nox-black overflow-hidden grain vignette select-none">
      {/* Cinematic camera drift — applies to every layer beneath. */}
      <motion.div
        key={`cam-${runId}`}
        className="absolute inset-0"
        initial={{ scale: 1.04, x: -8, y: 6 }}
        animate={{ scale: [1.04, 1.0, 1.02, 1.0], x: [-8, 4, -2, 0], y: [6, -2, 4, 0] }}
        transition={{ duration: 22, ease: "easeInOut" }}
      >
        {/* Ambient bottom amber glow */}
        <motion.div
          className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(184,134,11,0.18) 0%, rgba(184,134,11,0.06) 35%, rgba(0,0,0,0) 70%)",
          }}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.55, 0.7, 0.55, 0.7] }}
          transition={{ duration: 22, ease: "easeInOut", times: [0, 0.18, 0.5, 0.75, 1] }}
        />

        {/* Center awakening glow — intensifies during scenes 2 & 3 */}
        <motion.div
          key={`center-${runId}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: "70vmin",
            height: "70vmin",
            background:
              "radial-gradient(circle, rgba(212,175,55,0.32) 0%, rgba(212,175,55,0.10) 30%, rgba(0,0,0,0) 65%)",
            filter: "blur(20px)",
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 0, 0.55, 0.7, 0.35, 0.25, 0.2, 0.3],
            scale: [0.6, 0.7, 1.05, 1.15, 1.0, 1.0, 1.0, 1.05],
          }}
          transition={{
            duration: 22,
            ease: "easeInOut",
            // 0s, 2s, 5s, 8s, 11s, 15s, 18s, 22s
            times: [0, 0.09, 0.227, 0.363, 0.5, 0.682, 0.818, 1],
          }}
        />

        {/* Two particle layers for parallax depth */}
        <Particles count={48} intensity={0.55} seed={11} />
        <Particles count={28} intensity={0.85} seed={42} />

        {/* Slow horizontal light bar — atmospheric volumetric pass */}
        <motion.div
          key={`bar-${runId}`}
          className="absolute -inset-x-20 top-1/2 -translate-y-1/2 h-[30vmin] pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(212,175,55,0) 0%, rgba(212,175,55,0.10) 50%, rgba(212,175,55,0) 100%)",
            filter: "blur(40px)",
            mixBlendMode: "screen",
          }}
          initial={{ x: "-40%", opacity: 0 }}
          animate={{ x: ["-40%", "-10%", "10%", "30%"], opacity: [0, 0.4, 0.6, 0.3] }}
          transition={{ duration: 22, ease: "easeInOut" }}
        />

        {/* SCENE STAGE — only one scene visible at a time, beautifully cross-faded */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {scene === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0"
              />
            )}

            {scene === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 1.4, ease: LUX_EASE }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <EnergyAwakening />
              </motion.div>
            )}

            {scene === 3 && (
              <motion.div
                key="s3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: LUX_EASE }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Monogram active />
              </motion.div>
            )}

            {scene === 4 && (
              <motion.div
                key="s4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: LUX_EASE }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <BrandReveal />
              </motion.div>
            )}

            {scene === 5 && (
              <motion.div
                key="s5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: LUX_EASE }}
                className="absolute inset-0 flex items-end justify-center pb-[12vh]"
              >
                <PerfumeBottle active />
              </motion.div>
            )}

            {scene === 6 && (
              <motion.div
                key="s6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: LUX_EASE }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <LuxuryStatement />
              </motion.div>
            )}

            {scene === 7 && (
              <motion.div
                key="s7"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: LUX_EASE }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <LegacyReveal />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Letterbox bars — reinforce the cinematic aspect */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-black"
        initial={{ height: "12vh" }}
        animate={{ height: ["12vh", "8vh", "6vh", "8vh"] }}
        transition={{ duration: 22, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-black"
        initial={{ height: "12vh" }}
        animate={{ height: ["12vh", "8vh", "6vh", "8vh"] }}
        transition={{ duration: 22, ease: "easeInOut" }}
      />

      {/* Quiet UI — chapter marker + replay. No buttons mid-scene; restraint. */}
      <ChapterMarker scene={scene} />
      <ReplayButton onClick={replay} visible={t >= 21} />
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Scene 2 — Energy Awakening                                               */
/* ────────────────────────────────────────────────────────────────────────── */
function EnergyAwakening() {
  return (
    <div className="relative">
      {/* Slowly forming gold orb */}
      <motion.div
        className="rounded-full"
        style={{
          width: "26vmin",
          height: "26vmin",
          background:
            "radial-gradient(circle, rgba(244,225,164,0.85) 0%, rgba(212,175,55,0.45) 35%, rgba(184,134,11,0.0) 70%)",
          filter: "blur(8px)",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.7, 0.9, 0.6], scale: [0.5, 1.0, 1.15, 1.05] }}
        transition={{ duration: 3, ease: "easeInOut" }}
      />

      {/* Swirling trail rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border"
          style={{
            width: `${36 + i * 14}vmin`,
            height: `${36 + i * 14}vmin`,
            borderColor: "rgba(212,175,55,0.18)",
            borderStyle: "solid",
            transform: "translate(-50%, -50%)",
          }}
          initial={{ opacity: 0, rotate: 0, scale: 0.7 }}
          animate={{ opacity: [0, 0.5, 0.2], rotate: 60 + i * 30, scale: [0.7, 1, 1.05] }}
          transition={{ duration: 3, ease: "easeOut", delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Scene 4 — Brand Reveal                                                   */
/* ────────────────────────────────────────────────────────────────────────── */
function BrandReveal() {
  const word1 = "MAISON".split("");
  const word2 = "NOX".split("");
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="h-px w-24 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: LUX_EASE }}
      />

      <h1 className="font-serif text-[clamp(2.6rem,9vmin,7.2rem)] leading-none flex gap-[0.18em] tracking-royal">
        {word1.map((ch, i) => (
          <motion.span
            key={`m-${i}`}
            className="gold-foil inline-block"
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.4, delay: 0.3 + i * 0.08, ease: LUX_EASE }}
          >
            {ch}
          </motion.span>
        ))}
        <span className="w-[0.4em]" />
        {word2.map((ch, i) => (
          <motion.span
            key={`n-${i}`}
            className="gold-foil inline-block"
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.4, delay: 0.85 + i * 0.08, ease: LUX_EASE }}
          >
            {ch}
          </motion.span>
        ))}
      </h1>

      <motion.div
        className="h-px w-24 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.4, ease: LUX_EASE }}
      />

      <motion.p
        className="font-sans text-[10px] tracking-regal text-[#b89a52] mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 1.6, ease: "easeOut" }}
      >
        PARFUM · PARIS
      </motion.p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Scene 6 — Luxury Statement                                               */
/* ────────────────────────────────────────────────────────────────────────── */
function LuxuryStatement() {
  const lines = ["NOT A PERFUME.", "A PRESENCE."];
  return (
    <div className="flex flex-col items-center gap-2 px-6 text-center">
      {lines.map((line, li) => (
        <motion.div
          key={line}
          className="overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 + li * 0.5, ease: LUX_EASE }}
        >
          <motion.p
            className="font-serif gold-foil-soft text-[clamp(1.5rem,5.4vmin,3.8rem)] tracking-[0.32em] leading-tight"
            initial={{ y: 24, filter: "blur(6px)" }}
            animate={{ y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.6, delay: 0.2 + li * 0.5, ease: LUX_EASE }}
          >
            {line}
          </motion.p>
        </motion.div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Scene 7 — Legacy Reveal                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
function LegacyReveal() {
  return (
    <div className="relative flex flex-col items-center gap-5 text-center">
      <RoyalCrest active />

      <motion.h2
        className="font-serif gold-foil text-[clamp(1.8rem,6vmin,4.2rem)] tracking-royal"
        initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.6, delay: 0.6, ease: LUX_EASE }}
      >
        THE MAISON WORLD
      </motion.h2>

      <motion.div
        className="h-px w-40 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.4, delay: 1.0, ease: LUX_EASE }}
      />

      <motion.p
        className="font-sans text-[clamp(0.7rem,1.4vmin,0.95rem)] tracking-regal text-[#b89a52]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 1.4, ease: LUX_EASE }}
      >
        HOUSE OF DISTINCTION
      </motion.p>

      {/* Final cinematic gold sweep across the legacy lockup */}
      <motion.div
        className="absolute inset-x-[-10%] top-[35%] h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, rgba(212,175,55,0) 0%, rgba(244,225,164,0.95) 50%, rgba(212,175,55,0) 100%)",
          filter: "blur(2px)",
          mixBlendMode: "screen",
        }}
        initial={{ x: "-60%", opacity: 0 }}
        animate={{ x: ["-60%", "60%"], opacity: [0, 0.9, 0] }}
        transition={{ duration: 2.4, delay: 1.8, ease: [0.5, 0, 0.2, 1] }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Quiet UI                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */
function ChapterMarker({ scene }: { scene: SceneKey }) {
  const total = 7;
  return (
    <div className="pointer-events-none absolute bottom-[2.2vh] left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 opacity-60">
      {Array.from({ length: total }, (_, i) => (
        <motion.span
          key={i}
          className="block h-px"
          style={{
            width: i + 1 === scene ? 28 : 14,
            background: i + 1 <= scene ? "#d4af37" : "rgba(212,175,55,0.22)",
          }}
          animate={{ width: i + 1 === scene ? 28 : 14 }}
          transition={{ duration: 0.8, ease: LUX_EASE }}
        />
      ))}
    </div>
  );
}

function ReplayButton({ onClick, visible }: { onClick: () => void; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={onClick}
          className="absolute right-6 bottom-[2vh] z-30 font-sans text-[10px] tracking-regal text-[#b89a52] hover:text-[#f4e1a4] transition-colors"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.8, ease: LUX_EASE }}
          aria-label="Replay reveal"
        >
          REPLAY
        </motion.button>
      )}
    </AnimatePresence>
  );
}
