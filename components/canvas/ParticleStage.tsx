"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/**
 * MorphTarget — what shape the particle field should hold next.
 *
 *  • "drift"      → ambient void, no targets, gentle Brownian drift
 *  • "disperse"   → each particle springs to a point far off-screen
 *                    (clears the stage for the bottle scene)
 *  • "monogram"   → particles compose the MN sigil
 *  • { text }     → particles compose arbitrary text (the wordmark,
 *                    the statement, the legacy lockup, ...)
 */
export type MorphTarget =
  | { kind: "drift" }
  | { kind: "disperse" }
  | { kind: "monogram" }
  | {
      kind: "text";
      lines: { text: string; size: number; weight?: string; letterSpacing?: number }[];
      lineGap?: number;
      yOffset?: number;
    };

export type ParticleStageHandle = {
  morph: (target: MorphTarget) => void;
  pulse: () => void;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  size: number;
  hue: number;
  baseAlpha: number;
  alpha: number;
  twinkle: number; // phase
  hasTarget: boolean;
};

const COUNT = 2200;

const ParticleStage = forwardRef<ParticleStageHandle, { className?: string }>(
  function ParticleStage({ className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const samplerRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
    const rafRef = useRef<number | null>(null);
    const modeRef = useRef<MorphTarget>({ kind: "drift" });
    const pulseRef = useRef(0); // 0..1, decays
    const fontsReadyRef = useRef(false);

    /* ─── deterministic helpers ─────────────────────────────────────── */
    const rand = useRef(mulberry32(0x5e1e));

    /* ─── init particles + canvas ───────────────────────────────────── */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const sampler = document.createElement("canvas");
      samplerRef.current = sampler;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        sizeRef.current = { w, h, dpr };
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        sampler.width = w;
        sampler.height = h;
        // Re-target on resize so the current shape re-rasterizes at the new size.
        applyMorph(modeRef.current);
      };

      const init = () => {
        const { w, h } = sizeRef.current;
        const r = rand.current;
        particlesRef.current = Array.from({ length: COUNT }, () => {
          const size = r() * 1.4 + 0.5;
          return {
            x: r() * w,
            y: r() * h,
            vx: (r() - 0.5) * 0.4,
            vy: (r() - 0.5) * 0.4,
            tx: 0,
            ty: 0,
            size,
            hue: 38 + r() * 14, // gold range
            baseAlpha: r() * 0.5 + 0.35,
            alpha: 0,
            twinkle: r() * Math.PI * 2,
            hasTarget: false,
          };
        });
      };

      resize();
      init();

      // Wait for our display fonts before any text rasterization is meaningful.
      // Fonts may not be loaded on first morph; we re-apply once ready.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          fontsReadyRef.current = true;
          applyMorph(modeRef.current);
        });
      } else {
        fontsReadyRef.current = true;
      }

      window.addEventListener("resize", resize);
      return () => window.removeEventListener("resize", resize);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ─── target generation ─────────────────────────────────────────── */
    const samplePointsFromCanvas = (): { x: number; y: number }[] => {
      const sampler = samplerRef.current!;
      const { w, h } = sizeRef.current;
      const ctx = sampler.getContext("2d", { willReadFrequently: true })!;
      const img = ctx.getImageData(0, 0, w, h).data;
      const points: { x: number; y: number }[] = [];
      const step = Math.max(3, Math.floor(Math.min(w, h) / 320));
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x) * 4;
          if (img[i + 3] > 100) points.push({ x, y });
        }
      }
      return points;
    };

    const drawText = (target: Extract<MorphTarget, { kind: "text" }>) => {
      const sampler = samplerRef.current!;
      const { w, h } = sizeRef.current;
      const ctx = sampler.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const lineGap = target.lineGap ?? 18;
      const totalH = target.lines.reduce((sum, l, i) => sum + l.size + (i > 0 ? lineGap : 0), 0);
      const yStart = h / 2 - totalH / 2 + (target.yOffset ?? 0);
      let y = yStart;
      for (const line of target.lines) {
        const weight = line.weight ?? "500";
        ctx.font = `${weight} ${line.size}px "Cormorant Garamond", "Playfair Display", serif`;
        // letter-spacing via per-char rendering for crisp wide tracking
        const tracking = line.letterSpacing ?? 0;
        if (tracking > 0) {
          const chars = [...line.text];
          // measure each char width
          const widths = chars.map((c) => ctx.measureText(c).width);
          const totalW = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
          let x = w / 2 - totalW / 2;
          for (let i = 0; i < chars.length; i++) {
            ctx.fillText(chars[i], x + widths[i] / 2, y + line.size / 2);
            x += widths[i] + tracking;
          }
        } else {
          ctx.fillText(line.text, w / 2, y + line.size / 2);
        }
        y += line.size + lineGap;
      }
    };

    const drawMonogram = () => {
      const sampler = samplerRef.current!;
      const { w, h } = sizeRef.current;
      const ctx = sampler.getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "white";
      ctx.strokeStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Interlocked MN in a tall serif, drawn TIGHT so the two letters share a spine.
      const size = Math.min(w, h) * 0.55;
      ctx.font = `300 ${size}px "Cormorant Garamond", "Playfair Display", serif`;
      const cx = w / 2;
      const cy = h / 2;

      // Overlap "M" and "N" by a fraction of their width to form a sigil
      const mW = ctx.measureText("M").width;
      const nW = ctx.measureText("N").width;
      const overlap = Math.min(mW, nW) * 0.42;
      ctx.fillText("M", cx - nW / 2 + overlap / 2, cy);
      ctx.fillText("N", cx + mW / 2 - overlap / 2, cy);

      // Hairline serif underline + overline rules — pulls the two letters into one mark
      const ruleW = (mW + nW - overlap) * 0.92;
      const ruleY1 = cy - size * 0.34;
      const ruleY2 = cy + size * 0.34;
      ctx.lineWidth = Math.max(2, size * 0.012);
      ctx.beginPath();
      ctx.moveTo(cx - ruleW / 2, ruleY1);
      ctx.lineTo(cx + ruleW / 2, ruleY1);
      ctx.moveTo(cx - ruleW / 2, ruleY2);
      ctx.lineTo(cx + ruleW / 2, ruleY2);
      ctx.stroke();
    };

    const applyMorph = (target: MorphTarget) => {
      modeRef.current = target;
      const particles = particlesRef.current;
      const { w, h } = sizeRef.current;
      if (!particles.length) return;

      if (target.kind === "drift") {
        for (const p of particles) {
          p.hasTarget = false;
        }
        return;
      }

      if (target.kind === "disperse") {
        // Each particle gets a target deep outside the screen → they fly away.
        for (const p of particles) {
          const angle = Math.atan2(p.y - h / 2, p.x - w / 2) || (Math.random() * Math.PI * 2);
          const radius = Math.max(w, h) * 1.4;
          p.tx = w / 2 + Math.cos(angle) * radius;
          p.ty = h / 2 + Math.sin(angle) * radius;
          p.hasTarget = true;
        }
        return;
      }

      // Text & monogram both rasterize into the sampler canvas, then we pick points.
      if (target.kind === "text") drawText(target);
      if (target.kind === "monogram") drawMonogram();

      const points = samplePointsFromCanvas();
      if (!points.length) {
        for (const p of particles) p.hasTarget = false;
        return;
      }

      // Shuffle target points for an organic assignment
      for (let i = points.length - 1; i > 0; i--) {
        const j = Math.floor(rand.current() * (i + 1));
        [points[i], points[j]] = [points[j], points[i]];
      }

      for (let i = 0; i < particles.length; i++) {
        const tgt = points[i % points.length];
        particles[i].tx = tgt.x + (rand.current() - 0.5) * 1.4;
        particles[i].ty = tgt.y + (rand.current() - 0.5) * 1.4;
        particles[i].hasTarget = true;
      }
    };

    /* ─── ref API ───────────────────────────────────────────────────── */
    useImperativeHandle(
      ref,
      () => ({
        morph: (target) => applyMorph(target),
        pulse: () => {
          pulseRef.current = 1;
        },
      }),
      []
    );

    /* ─── render loop ───────────────────────────────────────────────── */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: true })!;
      let prev = performance.now();

      const loop = (now: number) => {
        const dt = Math.min((now - prev) / 16.6667, 2.5); // normalized to ~60fps frames
        prev = now;
        step(dt);
        draw(ctx);
        rafRef.current = requestAnimationFrame(loop);
      };

      const step = (dt: number) => {
        const { w, h } = sizeRef.current;
        const particles = particlesRef.current;
        pulseRef.current = Math.max(0, pulseRef.current - 0.02 * dt);

        for (const p of particles) {
          if (p.hasTarget) {
            const dx = p.tx - p.x;
            const dy = p.ty - p.y;
            // Spring + damping. Lower stiffness → slower, more luxurious settle.
            p.vx += dx * 0.018 * dt;
            p.vy += dy * 0.018 * dt;
            p.vx *= Math.pow(0.86, dt);
            p.vy *= Math.pow(0.86, dt);
            // Twinkle once near rest
            const distSq = dx * dx + dy * dy;
            const settled = distSq < 12;
            const tgtAlpha = settled ? p.baseAlpha : Math.min(1, p.baseAlpha * 1.4);
            p.alpha += (tgtAlpha - p.alpha) * 0.05 * dt;
          } else {
            // Ambient drift in the void
            p.vx += (Math.random() - 0.5) * 0.04 * dt;
            p.vy += (Math.random() - 0.5) * 0.04 * dt;
            p.vx *= Math.pow(0.98, dt);
            p.vy *= Math.pow(0.98, dt);
            // Slow opacity breathing
            p.twinkle += 0.008 * dt;
            const breathe = 0.4 + Math.sin(p.twinkle) * 0.35;
            p.alpha += (p.baseAlpha * breathe * 0.5 - p.alpha) * 0.04 * dt;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Soft wrap on the drift state so the field never feels empty
          if (!p.hasTarget) {
            if (p.x < -20) p.x = w + 20;
            if (p.x > w + 20) p.x = -20;
            if (p.y < -20) p.y = h + 20;
            if (p.y > h + 20) p.y = -20;
          }
        }
      };

      const draw = (ctx2d: CanvasRenderingContext2D) => {
        const { w, h, dpr } = sizeRef.current;
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Cinematic motion-blur trail: instead of clearing, paint a faint black.
        ctx2d.globalCompositeOperation = "source-over";
        ctx2d.fillStyle = "rgba(0,0,0,0.22)";
        ctx2d.fillRect(0, 0, w, h);

        ctx2d.globalCompositeOperation = "lighter";
        const pulse = pulseRef.current;
        const particles = particlesRef.current;
        for (const p of particles) {
          if (p.alpha < 0.01) continue;
          // Velocity-based bloom — fast-moving particles glow brighter, so
          // transitions feel kinetic. Stationary particles render small + crisp.
          const speed = Math.hypot(p.vx, p.vy);
          const speedBoost = Math.min(2.2, 1 + speed * 0.45);
          const r = p.size * (1 + pulse * 0.6) * speedBoost;
          const a = Math.min(1, p.alpha * (1 + pulse * 0.4));
          // gold radial blob — additive blending creates the luxury bloom
          const g = ctx2d.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
          g.addColorStop(0, `hsla(${p.hue}, 78%, 78%, ${a})`);
          g.addColorStop(0.35, `hsla(${p.hue}, 75%, 55%, ${a * 0.55})`);
          g.addColorStop(1, "hsla(40, 70%, 45%, 0)");
          ctx2d.fillStyle = g;
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, r * 6, 0, Math.PI * 2);
          ctx2d.fill();
        }
      };

      rafRef.current = requestAnimationFrame(loop);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        aria-hidden
      />
    );
  }
);

export default ParticleStage;

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
