"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ParticleStage, { ParticleStageHandle } from "./canvas/ParticleStage";
import PerfumeBottle from "./scenes/PerfumeBottle";
import RoyalCrest from "./scenes/RoyalCrest";
import MNSigil from "./scenes/MNSigil";
import LegacyFrame from "./scenes/LegacyFrame";

/*
 * MASTER TIMELINE (25.5s)
 *
 *   ▢ 0.0  – 2.5  · PREROLL    · "A MAISON NOX FILM — presented by THE MAISON WORLD"
 *   ▢ 2.5  – 5.0  · VOID       · gold dust drifts in pure black
 *   ▢ 5.0  – 9.5  · MONOGRAM   · particles converge into the MN sigil, SVG mark blooms over them
 *   ▢ 9.5  – 12.5 · WORDMARK   · sigil dissolves; particles flow into MAISON NOX
 *   ▢ 12.5 – 16.5 · FLACON     · particles disperse, the bottle rises into the cleared stage
 *   ▢ 16.5 – 19.5 · STATEMENT  · particles reform as "NOT A PERFUME. A PRESENCE."
 *   ▢ 19.5 – 25.5 · LEGACY     · ornamental frame draws in, crest descends, lockup settles
 *
 * Audio (when AMBIENT is on): a procedural drone underneath, plus a soft
 * filtered bell sting on every act break.
 */

const LUX_EASE: [number, number, number, number] = [0.22, 0.8, 0.2, 1];
const TOTAL = 25.5;

type SceneKey =
  | "preroll"
  | "void"
  | "monogram"
  | "wordmark"
  | "flacon"
  | "statement"
  | "legacy";

const SCENES: { key: SceneKey; start: number; end: number }[] = [
  { key: "preroll", start: 0, end: 2.5 },
  { key: "void", start: 2.5, end: 5.0 },
  { key: "monogram", start: 5.0, end: 9.5 },
  { key: "wordmark", start: 9.5, end: 12.5 },
  { key: "flacon", start: 12.5, end: 16.5 },
  { key: "statement", start: 16.5, end: 19.5 },
  { key: "legacy", start: 19.5, end: TOTAL },
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

  /* ── master clock — always animates, ignores prefers-reduced-motion
        (this IS the experience; users opted in by visiting). ────────── */
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
      case "preroll":
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
    // Audio sting on every scene transition (cheap procedural bell)
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
      {/* Volumetric backdrop — amber pool below, gold flare at center,
          and a discreet oxblood wash for richness */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 105%, rgba(184,134,11,0.16) 0%, rgba(184,134,11,0.04) 40%, rgba(0,0,0,0) 70%), radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212,175,55,0.08) 0%, rgba(0,0,0,0) 60%), radial-gradient(ellipse 90% 70% at 50% 80%, rgba(72,18,18,0.18) 0%, rgba(72,18,18,0) 60%)",
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
        {/* Particle field — the living medium */}
        <ParticleStage ref={stageRef} />

        {/* Center awakening glow — peaks during transitions */}
        <motion.div
          key={`glow-${runId}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: "78vmin",
            height: "78vmin",
            background:
              "radial-gradient(circle, rgba(244,225,164,0.32) 0%, rgba(212,175,55,0.10) 30%, rgba(0,0,0,0) 65%)",
            filter: "blur(28px)",
            mixBlendMode: "screen",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 0.15, 0.0, 0.55, 0.7, 0.45, 0.55, 0.35, 0.4],
            scale: [0.5, 0.6, 0.7, 1.0, 1.1, 0.95, 1.0, 0.95, 1.05],
          }}
          transition={{
            duration: TOTAL,
            ease: "easeInOut",
            // preroll, void, mono start, mono peak, word, flacon, statement, legacy start, end
            // 0, 2.5, 5, 7.25, 9.5, 12.5, 16.5, 19.5, 25.5
            times: [0, 0.098, 0.196, 0.284, 0.373, 0.49, 0.647, 0.765, 1],
          }}
        />

        {/* Anamorphic horizontal volumetric pass */}
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

        {/* Scene 1 — preroll title card */}
        <AnimatePresence>
          {scene === "preroll" && (
            <motion.div
              key="preroll"
              className="absolute inset-0 flex items-center justify-center text-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 1.2, ease: LUX_EASE }}
            >
              <div>
                <motion.p
                  className="font-sans text-[9px] tracking-[0.7em] text-[#8c6f1e]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 0.3, ease: LUX_EASE }}
                >
                  A&nbsp;&nbsp;MAISON&nbsp;&nbsp;NOX&nbsp;&nbsp;FILM
                </motion.p>
                <motion.div
                  className="mt-6 h-px w-32 mx-auto bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 1.0, delay: 0.7, ease: LUX_EASE }}
                />
                <motion.p
                  className="mt-5 font-serif gold-foil-soft text-[clamp(0.9rem,1.7vmin,1.1rem)] tracking-[0.5em]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, delay: 1.0, ease: LUX_EASE }}
                >
                  PRESENTED BY
                </motion.p>
                <motion.p
                  className="mt-2 font-serif gold-foil text-[clamp(1.3rem,3vmin,2rem)] tracking-[0.42em]"
                  initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 1.4, delay: 1.2, ease: LUX_EASE }}
                >
                  THE MAISON WORLD
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene 3 — MN sigil overlays the particle convergence */}
        <AnimatePresence>
          {scene === "monogram" && (
            <motion.div
              key="sigil"
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: "blur(8px)", scale: 1.06 }}
              transition={{ duration: 1.3, ease: LUX_EASE }}
            >
              <MNSigil active />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene 5 — flacon */}
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

        {/* Scene 7 — ornamental frame + crest */}
        <AnimatePresence>
          {scene === "legacy" && (
            <>
              <motion.div
                key="frame"
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.0, ease: LUX_EASE }}
              >
                <LegacyFrame active />
              </motion.div>
              <motion.div
                key="crest"
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                style={{ top: "22%" }}
                initial={{ opacity: 0, y: 14, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, delay: 0.4, ease: LUX_EASE }}
              >
                <RoyalCrest active />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Aperture wipe between scenes */}
        <ApertureWipe trigger={scene} />

        {/* Anamorphic horizontal lens flare on each act break */}
        <LensFlare t={t} />
      </motion.div>

      {/* Letterbox bars breathe through the reel */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-black"
        initial={{ height: "14vh" }}
        animate={{ height: ["14vh", "9vh", "6vh", "8vh", "10vh"] }}
        transition={{ duration: TOTAL, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-black"
        initial={{ height: "14vh" }}
        animate={{ height: ["14vh", "9vh", "6vh", "8vh", "10vh"] }}
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
  // Don't show the rail during pre-roll — let the title card breathe.
  const idx = SCENES.findIndex((s) => s.key === scene);
  if (scene === "preroll") return null;
  return (
    <div className="pointer-events-none absolute bottom-[2.6vh] left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 opacity-70">
      {SCENES.slice(1).map((s, i) => {
        const realIdx = i + 1;
        return (
          <motion.span
            key={s.key}
            className="block h-px"
            style={{
              width: realIdx === idx ? 32 : 14,
              background: realIdx <= idx ? "#d4af37" : "rgba(212,175,55,0.22)",
            }}
            animate={{ width: realIdx === idx ? 32 : 14 }}
            transition={{ duration: 0.7, ease: LUX_EASE }}
          />
        );
      })}
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
  const beats = useMemo(() => [2.6, 5.1, 9.6, 12.6, 16.6, 19.6], []);
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

  // Procedural bell sting — filtered sine with quick exponential decay
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
