"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ParticleStage, { ParticleStageHandle } from "./canvas/ParticleStage";
import PerfumeBottle from "./scenes/PerfumeBottle";
import RoyalCrest from "./scenes/RoyalCrest";

/*
 * NEW TIMELINE (22.5s)
 *
 *   ▢ 0.0 – 3.0  · VOID         · gold dust drifts in pure black
 *   ▢ 3.0 – 7.0  · MONOGRAM     · particles converge into the MN sigil
 *   ▢ 7.0 – 10.0 · WORDMARK     · sigil flows into "MAISON NOX"
 *   ▢ 10.0– 14.0 · FLACON       · particles disperse, the bottle rises
 *   ▢ 14.0– 17.0 · STATEMENT    · bottle dissolves into the statement text
 *   ▢ 17.0– 22.5 · LEGACY       · text settles into the legacy lockup + crest
 *
 * Transitions are not crossfades — particles physically morph from one
 * shape into the next via spring physics on the canvas layer.
 */

const LUX_EASE: [number, number, number, number] = [0.22, 0.8, 0.2, 1];
const TOTAL = 22.5;

type SceneKey = "void" | "monogram" | "wordmark" | "flacon" | "statement" | "legacy";

const SCENES: { key: SceneKey; start: number; end: number; label: string }[] = [
  { key: "void", start: 0, end: 3, label: "I" },
  { key: "monogram", start: 3, end: 7, label: "II" },
  { key: "wordmark", start: 7, end: 10, label: "III" },
  { key: "flacon", start: 10, end: 14, label: "IV" },
  { key: "statement", start: 14, end: 17, label: "V" },
  { key: "legacy", start: 17, end: TOTAL, label: "VI" },
];

function sceneAt(t: number): SceneKey {
  for (const s of SCENES) if (t >= s.start && t < s.end) return s.key;
  return "legacy";
}

export default function MaisonNoxReveal() {
  const reduce = useReducedMotion();
  const stageRef = useRef<ParticleStageHandle>(null);
  const [t, setT] = useState(0);
  const [runId, setRunId] = useState(0);
  const [audioOn, setAudioOn] = useState(false);
  const audioRef = useRef<{ stop: () => void } | null>(null);
  const scene = sceneAt(t);

  /* ── master clock ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (reduce) {
      setT(TOTAL);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      setT(elapsed);
      if (elapsed < TOTAL + 4) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, runId]);

  /* ── particle stage morph orchestration ───────────────────────────── */
  useEffect(() => {
    const s = stageRef.current;
    if (!s) return;
    switch (scene) {
      case "void":
        s.morph({ kind: "drift" });
        break;
      case "monogram":
        s.morph({ kind: "monogram" });
        s.pulse();
        break;
      case "wordmark":
        s.morph({
          kind: "text",
          lines: [
            { text: "MAISON NOX", size: vmin(11, 56, 130), weight: "500", letterSpacing: 14 },
          ],
        });
        break;
      case "flacon":
        // Particles fly outward so the flacon has the stage to itself
        s.morph({ kind: "disperse" });
        break;
      case "statement":
        s.morph({
          kind: "text",
          lines: [
            { text: "NOT A PERFUME.", size: vmin(5.6, 32, 72), weight: "400", letterSpacing: 6 },
            { text: "A PRESENCE.", size: vmin(5.6, 32, 72), weight: "400", letterSpacing: 6 },
          ],
          lineGap: 12,
        });
        break;
      case "legacy":
        s.morph({
          kind: "text",
          lines: [
            { text: "THE MAISON WORLD", size: vmin(6.4, 38, 92), weight: "500", letterSpacing: 12 },
            { text: "HOUSE OF DISTINCTION", size: vmin(1.4, 11, 18), weight: "300", letterSpacing: 8 },
          ],
          lineGap: 22,
          yOffset: vmin(6, 30, 70),
        });
        break;
    }
  }, [scene]);

  /* ── ambient audio toggle (Web Audio API, optional) ──────────────── */
  const toggleAudio = useCallback(async () => {
    if (audioOn) {
      audioRef.current?.stop();
      audioRef.current = null;
      setAudioOn(false);
      return;
    }
    try {
      audioRef.current = await startDrone();
      setAudioOn(true);
    } catch {
      // browser blocked autoplay or no audio context
    }
  }, [audioOn]);

  useEffect(() => () => audioRef.current?.stop(), []);

  const replay = useCallback(() => setRunId((n) => n + 1), []);

  return (
    <section
      className="relative h-[100svh] w-full overflow-hidden bg-nox-black select-none grain"
      key={`stage-${runId}`}
    >
      {/* Deep volumetric backdrop — ambient amber wash under everything */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 105%, rgba(184,134,11,0.16) 0%, rgba(184,134,11,0.04) 40%, rgba(0,0,0,0) 70%), radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212,175,55,0.08) 0%, rgba(0,0,0,0) 60%)",
        }}
      />

      {/* Cinematic camera drift wraps every layer for parallax */}
      <motion.div
        key={`cam-${runId}`}
        className="absolute inset-0"
        initial={{ scale: 1.05, x: -10, y: 8 }}
        animate={{
          scale: [1.05, 1.0, 1.02, 1.0, 1.03],
          x: [-10, 4, -3, 6, 0],
          y: [8, -2, 5, -3, 0],
        }}
        transition={{ duration: TOTAL, ease: "easeInOut" }}
      >
        {/* Particle field — the living medium that morphs through every scene */}
        <ParticleStage ref={stageRef} />

        {/* Center awakening glow — intensifies during transitions */}
        <motion.div
          key={`glow-${runId}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: "78vmin",
            height: "78vmin",
            background:
              "radial-gradient(circle, rgba(244,225,164,0.30) 0%, rgba(212,175,55,0.10) 30%, rgba(0,0,0,0) 65%)",
            filter: "blur(28px)",
            mixBlendMode: "screen",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0.0, 0.5, 0.7, 0.45, 0.55, 0.35, 0.4],
            scale: [0.5, 0.6, 1.0, 1.1, 0.95, 1.0, 0.95, 1.05],
          }}
          transition={{
            duration: TOTAL,
            ease: "easeInOut",
            // 0, 3, 7, 10, 14, 17, 20, 22.5
            times: [0, 0.133, 0.311, 0.444, 0.622, 0.755, 0.889, 1],
          }}
        />

        {/* Anamorphic horizontal light bar — slow volumetric pass */}
        <motion.div
          key={`bar-${runId}`}
          aria-hidden
          className="absolute -inset-x-20 top-1/2 -translate-y-1/2 h-[26vmin] pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(212,175,55,0) 0%, rgba(244,225,164,0.16) 50%, rgba(212,175,55,0) 100%)",
            filter: "blur(36px)",
            mixBlendMode: "screen",
          }}
          initial={{ x: "-45%", opacity: 0 }}
          animate={{
            x: ["-45%", "-10%", "10%", "30%"],
            opacity: [0, 0.5, 0.55, 0.25],
          }}
          transition={{ duration: TOTAL, ease: "easeInOut" }}
        />

        {/* Scene 4 — the flacon. Lives on its own DOM layer, doesn't need
            cross-fades because the particle stage clears for it. */}
        <AnimatePresence>
          {scene === "flacon" && (
            <motion.div
              key="bottle"
              className="absolute inset-0 flex items-end justify-center pb-[14vh]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
              transition={{ duration: 1.4, ease: LUX_EASE }}
            >
              <PerfumeBottle active />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene 6 — royal crest floats above the legacy text on the canvas */}
        <AnimatePresence>
          {scene === "legacy" && (
            <motion.div
              key="crest"
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ top: "22%" }}
              initial={{ opacity: 0, y: 14, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, delay: 0.6, ease: LUX_EASE }}
            >
              <RoyalCrest active />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Aperture wipe between act-bookends (scene transitions) */}
        <ApertureWipe trigger={scene} />

        {/* Anamorphic lens flare — fires near peak moments */}
        <LensFlare t={t} />
      </motion.div>

      {/* Letterbox bars — gently breathe through the whole reel */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-black"
        initial={{ height: "14vh" }}
        animate={{ height: ["14vh", "8vh", "6vh", "8vh", "10vh"] }}
        transition={{ duration: TOTAL, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-black"
        initial={{ height: "14vh" }}
        animate={{ height: ["14vh", "8vh", "6vh", "8vh", "10vh"] }}
        transition={{ duration: TOTAL, ease: "easeInOut" }}
      />

      {/* Outer vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.78) 95%)",
        }}
      />

      {/* Quiet UI */}
      <ChapterRail scene={scene} />
      <AudioToggle on={audioOn} onClick={toggleAudio} />
      <ReplayButton onClick={replay} visible={t >= TOTAL - 1} />
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function ChapterRail({ scene }: { scene: SceneKey }) {
  const idx = SCENES.findIndex((s) => s.key === scene);
  return (
    <div className="pointer-events-none absolute bottom-[2.6vh] left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 opacity-70">
      {SCENES.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <motion.span
            className="block h-px"
            style={{
              width: i === idx ? 32 : 14,
              background: i <= idx ? "#d4af37" : "rgba(212,175,55,0.22)",
            }}
            animate={{ width: i === idx ? 32 : 14 }}
            transition={{ duration: 0.7, ease: LUX_EASE }}
          />
          {i < SCENES.length - 1 && <span className="block w-0" />}
        </div>
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
          className="absolute right-6 bottom-[2.4vh] z-40 font-sans text-[10px] tracking-regal text-[#b89a52] hover:text-[#f4e1a4] transition-colors"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.9, ease: LUX_EASE }}
          aria-label="Replay reveal"
        >
          ↻ REPLAY
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function AudioToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute left-6 bottom-[2.4vh] z-40 font-sans text-[10px] tracking-regal text-[#b89a52] hover:text-[#f4e1a4] transition-colors flex items-center gap-2"
      aria-label={on ? "Mute ambient" : "Play ambient"}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{
          background: on ? "#f4e1a4" : "transparent",
          border: "1px solid #b89a52",
          boxShadow: on ? "0 0 8px rgba(244,225,164,0.7)" : "none",
        }}
      />
      {on ? "AMBIENT · ON" : "AMBIENT"}
    </button>
  );
}

/* Aperture wipe — fires a momentary radial mask between scenes. */
function ApertureWipe({ trigger }: { trigger: SceneKey }) {
  return (
    <motion.div
      key={trigger}
      aria-hidden
      className="absolute inset-0 z-10 pointer-events-none"
      style={{
        background:
          "radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.9) 100%)",
        mixBlendMode: "multiply",
      }}
      initial={{ opacity: 1, scale: 0.6 }}
      animate={{ opacity: 0, scale: 1.4 }}
      transition={{ duration: 1.6, ease: LUX_EASE }}
    />
  );
}

/* Subtle anamorphic horizontal flare — fires once per major beat. */
function LensFlare({ t }: { t: number }) {
  // Fire near these moments (scene starts), each flare ~1.2s
  const beats = useMemo(() => [3.1, 7.1, 10.2, 14.1, 17.2], []);
  const active = beats.find((b) => t >= b && t < b + 1.4);
  return (
    <AnimatePresence>
      {active != null && (
        <motion.div
          key={active}
          aria-hidden
          className="absolute inset-x-[-10%] top-1/2 -translate-y-1/2 z-10 pointer-events-none"
          style={{
            height: 2,
            background:
              "linear-gradient(90deg, rgba(212,175,55,0) 0%, rgba(244,225,164,0.9) 50%, rgba(212,175,55,0) 100%)",
            filter: "blur(2px)",
            mixBlendMode: "screen",
            boxShadow:
              "0 0 32px rgba(244,225,164,0.6), 0 0 80px rgba(244,225,164,0.35)",
          }}
          initial={{ opacity: 0, scaleX: 0.6 }}
          animate={{ opacity: [0, 0.9, 0], scaleX: [0.6, 1.2, 1.4] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.5, 0, 0.2, 1] }}
        />
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Ambient drone — three detuned sines under a low-pass with slow LFO     */

async function startDrone(): Promise<{ stop: () => void }> {
  const Ctx =
    typeof window !== "undefined"
      ? window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      : null;
  if (!Ctx) throw new Error("no AudioContext");
  const ctx = new Ctx();

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 480;
  filter.Q.value = 0.7;
  filter.connect(master);

  // Reverb-ish: feedback delay
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.35;
  const fbGain = ctx.createGain();
  fbGain.gain.value = 0.42;
  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  filter.connect(delay);
  delay.connect(fbGain);
  fbGain.connect(delay);
  delay.connect(wet);
  wet.connect(master);

  const freqs = [55, 82.4, 110, 164.8]; // A1, E2, A2, E3 — open fifth chord
  const oscs: OscillatorNode[] = [];
  freqs.forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = i % 2 === 0 ? "sine" : "triangle";
    o.frequency.value = f;
    const detune = ctx.createOscillator();
    detune.frequency.value = 0.07 + i * 0.03;
    const detAmt = ctx.createGain();
    detAmt.gain.value = 6;
    detune.connect(detAmt);
    detAmt.connect(o.detune);
    const g = ctx.createGain();
    g.gain.value = 0.22 / freqs.length;
    o.connect(g).connect(filter);
    o.start();
    detune.start();
    oscs.push(o);
  });

  // Slow swell in
  master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 3.0);

  return {
    stop: () => {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(0, now + 0.6);
      setTimeout(() => {
        oscs.forEach((o) => o.stop());
        ctx.close();
      }, 700);
    },
  };
}

/* clamp helper: scale-with-viewport sizes for the canvas-rasterized text */
function vmin(vminUnits: number, min: number, max: number) {
  if (typeof window === "undefined") return (min + max) / 2;
  const v = (Math.min(window.innerWidth, window.innerHeight) * vminUnits) / 100;
  return Math.max(min, Math.min(max, v));
}
