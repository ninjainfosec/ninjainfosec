"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ParticleStage, { ParticleStageHandle } from "./canvas/ParticleStage";
import PerfumeBottle from "./scenes/PerfumeBottle";
import MaisonNoxMark from "./marks/MaisonNoxMark";
import TheMaisonWorldMark from "./marks/TheMaisonWorldMark";

/*
 * MASTER TIMELINE (20s) — restrained, cinematic, real brand identity.
 *
 *   ▢ 0  – 2.5  · VOID       · gold dust drifts in pure black
 *   ▢ 2.5– 8    · REVEAL     · MAISON NOX shield mark + wordmark trace in
 *   ▢ 8  – 13   · FLACON     · particles disperse, the flacon rises
 *   ▢ 13 – 16   · STATEMENT  · "NOT A PERFUME. A PRESENCE."
 *   ▢ 16 – 20   · LEGACY     · settles on THE MAISON WORLD shield · HOUSE OF DISTINCTION
 */

const LUX_EASE: [number, number, number, number] = [0.22, 0.8, 0.2, 1];
const TOTAL = 20;

type SceneKey = "void" | "reveal" | "flacon" | "statement" | "legacy";

const SCENES: { key: SceneKey; start: number; end: number }[] = [
  { key: "void", start: 0, end: 2.5 },
  { key: "reveal", start: 2.5, end: 8 },
  { key: "flacon", start: 8, end: 13 },
  { key: "statement", start: 13, end: 16 },
  { key: "legacy", start: 16, end: TOTAL },
];

function sceneAt(t: number): SceneKey {
  for (const s of SCENES) if (t >= s.start && t < s.end) return s.key;
  return "legacy";
}

export default function MaisonNoxReveal() {
  const stageRef = useRef<ParticleStageHandle>(null);
  const droneRef = useRef<DroneHandle | null>(null);
  const [t, setT] = useState(0);
  const [runId, setRunId] = useState(0);
  const [audioOn, setAudioOn] = useState(false);
  const scene = sceneAt(t);

  /* ── master clock ─────────────────────────────────────────────────── */
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      setT(elapsed);
      if (elapsed < TOTAL + 4) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [runId]);

  /* ── particle morph orchestration ─────────────────────────────────── */
  useEffect(() => {
    const s = stageRef.current;
    if (!s) return;
    switch (scene) {
      case "void":
        s.morph({ kind: "drift" });
        break;
      case "reveal":
        // Particles drift toward center as a soft halo behind the shield mark.
        // We don't form letters here — the SVG mark is the hero.
        s.morph({ kind: "drift" });
        s.pulse();
        break;
      case "flacon":
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
        // Hold the final frame — particles drift gently behind the parent mark.
        s.morph({ kind: "drift" });
        break;
    }
    droneRef.current?.sting(scene === "legacy" ? "deep" : "soft");
  }, [scene]);

  /* ── ambient audio toggle ─────────────────────────────────────────── */
  const toggleAudio = useCallback(async () => {
    if (audioOn) {
      droneRef.current?.stop();
      droneRef.current = null;
      setAudioOn(false);
      return;
    }
    try {
      droneRef.current = await startDrone();
      setAudioOn(true);
    } catch {
      // browser blocked autoplay
    }
  }, [audioOn]);

  useEffect(() => () => droneRef.current?.stop(), []);
  const replay = useCallback(() => setRunId((n) => n + 1), []);

  return (
    <section
      className="relative h-[100svh] w-full overflow-hidden bg-nox-black select-none grain"
      key={`stage-${runId}`}
    >
      {/* Volumetric backdrop — amber from below, faint center wash */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 105%, rgba(184,134,11,0.16) 0%, rgba(184,134,11,0.04) 40%, rgba(0,0,0,0) 70%), radial-gradient(ellipse 60% 50% at 50% 45%, rgba(212,175,55,0.07) 0%, rgba(0,0,0,0) 65%)",
        }}
      />

      {/* Cinematic camera drift */}
      <motion.div
        key={`cam-${runId}`}
        className="absolute inset-0"
        initial={{ scale: 1.04, x: -8, y: 6 }}
        animate={{
          scale: [1.04, 1.0, 1.02, 1.0],
          x: [-8, 3, -2, 0],
          y: [6, -2, 4, 0],
        }}
        transition={{ duration: TOTAL, ease: "easeInOut" }}
      >
        {/* Particle field — atmospheric, not flashy */}
        <ParticleStage ref={stageRef} />

        {/* Center glow — gentle, never hot */}
        <motion.div
          key={`glow-${runId}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: "70vmin",
            height: "70vmin",
            background:
              "radial-gradient(circle, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.06) 35%, rgba(0,0,0,0) 65%)",
            filter: "blur(28px)",
            mixBlendMode: "screen",
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{
            opacity: [0, 0.15, 0.5, 0.35, 0.45, 0.55],
            scale: [0.6, 0.7, 1.0, 0.95, 1.0, 1.05],
          }}
          transition={{
            duration: TOTAL,
            ease: "easeInOut",
            times: [0, 0.125, 0.4, 0.65, 0.8, 1],
          }}
        />

        {/* SCENE: Maison Nox reveal */}
        <AnimatePresence>
          {scene === "reveal" && (
            <motion.div
              key="reveal"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: "blur(6px)", scale: 1.03 }}
              transition={{ duration: 1.0, ease: LUX_EASE }}
            >
              <MaisonNoxMark active />
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCENE: Flacon */}
        <AnimatePresence>
          {scene === "flacon" && (
            <motion.div
              key="bottle"
              className="absolute inset-0 flex items-end justify-center pb-[14vh]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.03, filter: "blur(6px)" }}
              transition={{ duration: 1.2, ease: LUX_EASE }}
            >
              <PerfumeBottle active />
            </motion.div>
          )}
        </AnimatePresence>

        {/* SCENE: Legacy — final hold on the parent mark */}
        <AnimatePresence>
          {scene === "legacy" && (
            <motion.div
              key="legacy"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: LUX_EASE }}
            >
              <TheMaisonWorldMark active />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Soft aperture wipe between scenes */}
        <ApertureWipe trigger={scene} />

        {/* Single anamorphic flare fires at each act break */}
        <LensFlare t={t} />
      </motion.div>

      {/* Letterbox bars — breathe gently */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-black"
        initial={{ height: "12vh" }}
        animate={{ height: ["12vh", "7vh", "6vh", "8vh"] }}
        transition={{ duration: TOTAL, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-black"
        initial={{ height: "12vh" }}
        animate={{ height: ["12vh", "7vh", "6vh", "8vh"] }}
        transition={{ duration: TOTAL, ease: "easeInOut" }}
      />

      {/* Outer vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.78) 95%)",
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
        <motion.span
          key={s.key}
          className="block h-px"
          style={{
            width: i === idx ? 28 : 12,
            background: i <= idx ? "#d4af37" : "rgba(212,175,55,0.22)",
          }}
          animate={{ width: i === idx ? 28 : 12 }}
          transition={{ duration: 0.7, ease: LUX_EASE }}
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

function ApertureWipe({ trigger }: { trigger: SceneKey }) {
  return (
    <motion.div
      key={trigger}
      aria-hidden
      className="absolute inset-0 z-10 pointer-events-none"
      style={{
        background:
          "radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.92) 100%)",
        mixBlendMode: "multiply",
      }}
      initial={{ opacity: 1, scale: 0.6 }}
      animate={{ opacity: 0, scale: 1.4 }}
      transition={{ duration: 1.6, ease: LUX_EASE }}
    />
  );
}

function LensFlare({ t }: { t: number }) {
  const beats = useMemo(() => [2.6, 8.1, 13.1, 16.1], []);
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
          animate={{ opacity: [0, 0.85, 0], scaleX: [0.6, 1.2, 1.4] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.5, 0, 0.2, 1] }}
        />
      )}
    </AnimatePresence>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Ambient drone + transition stings                                     */

type DroneHandle = {
  stop: () => void;
  sting: (kind: "soft" | "deep") => void;
};

async function startDrone(): Promise<DroneHandle> {
  const Ctx =
    typeof window !== "undefined"
      ? window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
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

  const freqs = [55, 82.4, 110, 164.8];
  const oscs: OscillatorNode[] = [];
  const lfos: OscillatorNode[] = [];
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
    lfos.push(detune);
  });

  master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 3.0);

  const sting = (kind: "soft" | "deep") => {
    const now = ctx.currentTime;
    const base = kind === "deep" ? 220 : 660;
    [base, base * 1.5, base * 2.0].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.08 / (i + 1), now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0005, now + (kind === "deep" ? 2.4 : 1.4));
      const fil = ctx.createBiquadFilter();
      fil.type = "bandpass";
      fil.frequency.value = f;
      fil.Q.value = 6;
      o.connect(fil).connect(g).connect(master);
      o.start(now);
      o.stop(now + (kind === "deep" ? 2.6 : 1.6));
    });
  };

  return {
    stop: () => {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.linearRampToValueAtTime(0, now + 0.6);
      setTimeout(() => {
        oscs.forEach((o) => o.stop());
        lfos.forEach((o) => o.stop());
        ctx.close();
      }, 700);
    },
    sting,
  };
}

function vmin(units: number, min: number, max: number) {
  if (typeof window === "undefined") return (min + max) / 2;
  const v = (Math.min(window.innerWidth, window.innerHeight) * units) / 100;
  return Math.max(min, Math.min(max, v));
}
