"use client";

import { useEffect, useRef, type RefObject } from "react";
import { MARK } from "./Logo";
import { RESET_EVENT, TAMPER_EVENT, isChainBroken } from "@/lib/chain";

// "The Witness": the CW mark drawn as ink particles on a 2D canvas that covers the hero stage.
// Particle targets live in the logo's viewBox units and are mapped onto the slot element every frame,
// so layout shifts and resizes never reshuffle them.

// Geometry, in viewBox units.
const VB_X = 299;
const VB_Y = 112;
const VB_W = 410;
const VB_H = 322;
const PUPIL_X = 504;
const PUPIL_Y = 266;
const PUPIL_R = 14;
const EYE_RX = 70;
const EYE_RY = 30;
const LOOK_MAX = 18;

// Counts.
const MARK_COUNT = 3500;
const MARK_COUNT_SMALL = 1400;
const PUPIL_COUNT = 120;

// Physics, per 60 Hz step (scaled by the real frame time).
const K = 0.045;
const DAMPING = 0.86;
const BREATH = 0.4; // px of drift around each target
const SWIRL = 0.9; // tangential push during the entrance
const REPEL_RADIUS = 70;
const REPEL_FORCE = 3.2;

// Timing, in seconds unless noted.
const ENTRANCE = 2.2;
const PUPIL_DELAY = 0.6;
const BLINK_MS = 120;
const TAMPER_NARROW = 0.55;

// Look.
const PAPER = "#E8DCC8";
const PAPER_TRAIL = "rgba(232, 220, 200, 0.28)"; // repainting at low alpha leaves a faint ink bleed
const NAVY: RGB = [31, 42, 68];
const GOLD: RGB = [198, 167, 94];
const FAIL: RGB = [155, 59, 46];
const NAVY_CSS = "rgb(31, 42, 68)";
const ALPHA_BINS = [0.6, 0.7, 0.8, 0.9]; // alpha 0.55-0.95, binned so each colour draws in 4 fills
const TAU = Math.PI * 2;

type RGB = [number, number, number];
const GROUP_INK = 0; // navy mark particles
const GROUP_PUPIL = 1; // gold, fail colour when tampered
const GROUP_EYE_FAIL = 2; // navy eye particles that turn fail colour when tampered

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (v: number) => v * v * (3 - 2 * v);
const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(a[1] + (b[1] - a[1]) * t)}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;

/** Rasterises the mark at display size and returns `count` random filled points, in viewBox units. */
function sampleMark(width: number, count: number): Float32Array {
  const scale = width / VB_W;
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(VB_H * scale));
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const g = off.getContext("2d", { willReadFrequently: true });
  const out = new Float32Array(count * 2);
  if (!g) return out;
  g.setTransform(scale, 0, 0, scale, -VB_X * scale, -VB_Y * scale);
  g.fill(new Path2D(MARK), "evenodd");
  const alpha = g.getImageData(0, 0, w, h).data;

  const filled: number[] = [];
  for (let i = 3, p = 0; i < alpha.length; i += 4, p++) if (alpha[i] > 127) filled.push(p);
  if (!filled.length) return out;

  // Partial Fisher-Yates: an even spread without repeats (repeats only if the shape is tiny).
  for (let i = 0; i < count; i++) {
    const j = i < filled.length ? i + ((Math.random() * (filled.length - i)) | 0) : (Math.random() * filled.length) | 0;
    const p = filled[j];
    if (i < filled.length) [filled[i], filled[j]] = [filled[j], filled[i]];
    out[i * 2] = VB_X + ((p % w) + Math.random()) / scale;
    out[i * 2 + 1] = VB_Y + (((p / w) | 0) + Math.random()) / scale;
  }
  return out;
}

type Particles = ReturnType<typeof createParticles>;

function createParticles(marks: Float32Array, width: number, height: number) {
  const markCount = marks.length / 2;
  const n = markCount + PUPIL_COUNT;
  const p = {
    n,
    x: new Float32Array(n),
    y: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    tx: new Float32Array(n), // target, viewBox units
    ty: new Float32Array(n),
    r: new Float32Array(n), // radius, CSS px
    size: new Float32Array(n), // per-frame radius multiplier (shrinks at the ends of the ink stream)
    delay: new Float32Array(n),
    phase: new Float32Array(n),
    freq: new Float32Array(n),
    wobble: new Float32Array(n),
    flow: new Float32Array(n),
    pupil: new Uint8Array(n),
    eye: new Uint8Array(n),
    lists: [] as Uint32Array[], // particle indices per (group, alpha bin)
  };
  const buckets: number[][] = Array.from({ length: 3 * ALPHA_BINS.length }, () => []);

  for (let i = 0; i < n; i++) {
    const isPupil = i >= markCount;
    if (isPupil) {
      const a = Math.random() * TAU;
      const d = Math.sqrt(Math.random()) * PUPIL_R;
      p.tx[i] = PUPIL_X + Math.cos(a) * d;
      p.ty[i] = PUPIL_Y + Math.sin(a) * d;
    } else {
      p.tx[i] = marks[i * 2];
      p.ty[i] = marks[i * 2 + 1];
    }
    const ex = (p.tx[i] - PUPIL_X) / EYE_RX;
    const ey = (p.ty[i] - PUPIL_Y) / EYE_RY;
    p.pupil[i] = isPupil ? 1 : 0;
    p.eye[i] = ex * ex + ey * ey <= 1 ? 1 : 0;
    p.x[i] = Math.random() * width;
    p.y[i] = Math.random() * height;
    p.r[i] = 0.8 + Math.random();
    p.size[i] = 1;
    p.delay[i] = isPupil ? PUPIL_DELAY + Math.random() * 0.2 : Math.random() * 0.35;
    p.phase[i] = Math.random() * TAU;
    p.freq[i] = 0.6 + Math.random() * 0.8;
    p.wobble[i] = Math.random() * 2 - 1;
    p.flow[i] = Math.random();

    const group = isPupil ? GROUP_PUPIL : p.eye[i] && Math.random() < 0.25 ? GROUP_EYE_FAIL : GROUP_INK;
    buckets[group * ALPHA_BINS.length + ((Math.random() * ALPHA_BINS.length) | 0)].push(i);
  }
  p.lists = buckets.map((b) => Uint32Array.from(b));
  return p;
}

export default function WitnessCanvas({
  stageRef,
  slotRef,
}: {
  stageRef: RefObject<HTMLElement | null>;
  slotRef: RefObject<HTMLElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const slot = slotRef.current;
    if (!canvas || !stage || !slot) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !ctx || typeof Path2D === "undefined") {
      stage.dataset.witness = "static"; // the static SVG mark takes over
      return;
    }
    stage.dataset.witness = "canvas";

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
    let width = 0;
    let height = 0;
    let small = false;
    let parts: Particles | null = null;
    let start = 0;
    let last = 0;
    let raf = 0;
    let onScreen = false;

    // Eye state.
    let tampered = isChainBroken();
    let tamperMix = tampered ? 1 : 0;
    let lookX = 0;
    let lookY = 0;
    let blinkAt = -Infinity;
    let nextBlink = Infinity;
    let secondQueued = true; // the first blink after the entrance (and after a reset) is single

    // Pointer, in client coordinates.
    let pointerX = 0;
    let pointerY = 0;
    let pointerActive = false;

    function resizeCanvas() {
      const rect = stage!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.fillStyle = PAPER;
      ctx!.fillRect(0, 0, width, height);
    }

    function build(now: number) {
      small = width < 768 || lowPower;
      const marks = sampleMark(slot!.getBoundingClientRect().width, small ? MARK_COUNT_SMALL : MARK_COUNT);
      parts = createParticles(marks, width, height);
      start = now;
      nextBlink = now + (PUPIL_DELAY + 0.2 + ENTRANCE) * 1000 + 300;
      secondQueued = true;
    }

    function blinkSoon(now: number, inMs: number) {
      nextBlink = now + inMs;
      secondQueued = true;
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / (1000 / 60), 3);
      last = now;
      const p = parts;
      if (!p) return;
      const t = (now - start) / 1000;

      const stageRect = stage!.getBoundingClientRect();
      const slotRect = slot!.getBoundingClientRect();
      const s = slotRect.width / VB_W;
      const lx = slotRect.left - stageRect.left;
      const ly = slotRect.top - stageRect.top;
      const cx = lx + slotRect.width / 2;
      const cy = ly + slotRect.height / 2;

      // Scroll dissolve: 0 at the top of the stage, 1 once it has scrolled fully past.
      const dissolve = smoothstep(clamp01(-stageRect.top / stageRect.height));

      // Pointer, in stage coordinates.
      const mx = pointerX - stageRect.left;
      const my = pointerY - stageRect.top;
      const inside = pointerActive && mx >= 0 && my >= 0 && mx <= width && my <= height;

      // Where the pupil looks: at the visitor, lower right when tampered, centred otherwise.
      let wantX = 0;
      let wantY = 0;
      if (tampered) {
        wantX = 13;
        wantY = 9;
      } else if (inside) {
        const dx = mx - (lx + (PUPIL_X - VB_X) * s);
        const dy = my - (ly + (PUPIL_Y - VB_Y) * s);
        const d = Math.hypot(dx, dy) || 1;
        const m = LOOK_MAX * Math.min(d / 240, 1);
        wantX = (dx / d) * m;
        wantY = (dy / d) * m;
      }
      const ease = 1 - Math.pow(0.9, dt);
      lookX += (wantX - lookX) * ease;
      lookY += (wantY - lookY) * ease;
      tamperMix += ((tampered ? 1 : 0) - tamperMix) * ease;

      // Blinks: every 4-7s, sometimes double.
      if (now >= nextBlink) {
        blinkAt = now;
        if (!secondQueued && Math.random() < 0.3) {
          nextBlink = now + 260;
          secondQueued = true;
        } else {
          nextBlink = now + 4000 + Math.random() * 3000;
          secondQueued = false;
        }
      }
      const sinceBlink = now - blinkAt;
      const eyeScale = (tampered ? TAMPER_NARROW : 1) * (sinceBlink < BLINK_MS ? 0.1 : 1);
      const eyeBoost = sinceBlink < BLINK_MS + 200 ? 2.5 : 1; // the lid moves faster than the ink

      const damp = Math.pow(DAMPING, dt);
      const flowT = t * 0.05;
      const streamSpan = height - cy;
      const r2 = REPEL_RADIUS * REPEL_RADIUS;

      for (let i = 0; i < p.n; i++) {
        let bx = p.tx[i];
        let by = p.ty[i];
        if (p.pupil[i]) {
          bx += lookX;
          by += lookY;
        }
        if (p.eye[i]) by = PUPIL_Y + (by - PUPIL_Y) * eyeScale;

        const ph = p.phase[i];
        let gx = lx + (bx - VB_X) * s + Math.sin(t * p.freq[i] + ph) * BREATH;
        let gy = ly + (by - VB_Y) * s + Math.cos(t * p.freq[i] * 1.3 + ph) * BREATH;

        if (dissolve > 0) {
          // A narrow river of ink flowing from the mark down to the bottom centre.
          const u = (p.flow[i] + flowT) % 1;
          const sx = width / 2 + p.wobble[i] * (6 + 10 * u) + Math.sin(t * 1.5 + u * 9 + ph) * 2;
          const sy = cy + u * streamSpan;
          gx += (sx - gx) * dissolve;
          gy += (sy - gy) * dissolve;
          p.size[i] = 1 - dissolve * (1 - Math.sin(Math.PI * u));
        } else {
          p.size[i] = 1;
        }

        // The spring ramps up over the entrance, so particles spiral in rather than snap.
        const e = clamp01((t - p.delay[i]) / ENTRANCE);
        const k = K * (0.04 + 0.96 * e * e) * (p.eye[i] ? eyeBoost : 1);
        let ax = (gx - p.x[i]) * k;
        let ay = (gy - p.y[i]) * k;

        if (e < 1) {
          const dx = p.x[i] - cx;
          const dy = p.y[i] - cy;
          const d = Math.hypot(dx, dy) + 1;
          const sw = SWIRL * (1 - e);
          ax -= (dy / d) * sw;
          ay += (dx / d) * sw;
        }

        if (inside) {
          const dx = p.x[i] - mx;
          const dy = p.y[i] - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / REPEL_RADIUS) ** 2 * REPEL_FORCE;
            ax += (dx / d) * f;
            ay += (dy / d) * f;
          }
        }

        p.vx[i] = (p.vx[i] + ax * dt) * damp;
        p.vy[i] = (p.vy[i] + ay * dt) * damp;
        p.x[i] += p.vx[i] * dt;
        p.y[i] += p.vy[i] * dt;
      }

      // Draw: repaint paper at low alpha (ink bleed), then each colour group in four alpha bins.
      const c = ctx!;
      c.globalAlpha = 1;
      c.fillStyle = PAPER_TRAIL;
      c.fillRect(0, 0, width, height);
      const fade = 1 - 0.7 * dissolve;
      const colours = [NAVY_CSS, mix(GOLD, FAIL, tamperMix), mix(NAVY, FAIL, tamperMix)];
      for (let g = 0; g < 3; g++) {
        c.fillStyle = colours[g];
        for (let b = 0; b < ALPHA_BINS.length; b++) {
          const list = p.lists[g * ALPHA_BINS.length + b];
          if (!list.length) continue;
          c.globalAlpha = ALPHA_BINS[b] * fade;
          c.beginPath();
          for (let j = 0; j < list.length; j++) {
            const i = list[j];
            const rr = p.r[i] * p.size[i];
            if (rr < 0.2) continue;
            c.moveTo(p.x[i] + rr, p.y[i]);
            c.arc(p.x[i], p.y[i], rr, 0, TAU);
          }
          c.fill();
        }
      }
    }

    // Run only while the stage is on screen and the tab is visible.
    function updateLoop() {
      const run = onScreen && !document.hidden;
      if (run && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      updateLoop();
    });
    io.observe(stage);

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const wasSmall = small;
        resizeCanvas();
        // Targets are in viewBox units, so a resize only rescales them. Re-sample when the
        // particle budget changes (crossing the 768px breakpoint).
        if ((width < 768 || lowPower) !== wasSmall) build(performance.now());
      }, 150);
    });
    ro.observe(stage);

    const onMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      pointerActive = true;
    };
    const onEnd = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") pointerActive = false; // a finger lifting shouldn't leave a dent
    };
    const onLeave = () => {
      pointerActive = false;
    };
    const onTamper = () => {
      tampered = true;
    };
    const onReset = () => {
      tampered = false;
      blinkSoon(performance.now(), 250);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onEnd, { passive: true });
    window.addEventListener("pointercancel", onEnd, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener(TAMPER_EVENT, onTamper);
    window.addEventListener(RESET_EVENT, onReset);
    document.addEventListener("visibilitychange", updateLoop);

    resizeCanvas();
    build(performance.now());

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      io.disconnect();
      ro.disconnect();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener(TAMPER_EVENT, onTamper);
      window.removeEventListener(RESET_EVENT, onReset);
      document.removeEventListener("visibilitychange", updateLoop);
      delete stage.dataset.witness;
    };
  }, [stageRef, slotRef]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}
