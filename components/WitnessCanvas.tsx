"use client";

import { useEffect, useRef, type RefObject } from "react";
import { onPointerMove } from "@/lib/pointer";

// Witzy assembling from ink: particles sampled from the mascot image (each keeping its pixel's colour)
// spiral in over ~2.2s, then the canvas fades out and the crisp <img> takes over (onSettle). While the
// hero is scrolled, the particles return and flow away as a stream of ink (onDissolve).
// Targets are stored relative to the slot element (0..1), so resizes only rescale them.

const COUNT = 4000;
const COUNT_SMALL = 1600;
const ALPHA_MIN = 200;

// Physics, per 60 Hz step (scaled by the real frame time).
const K = 0.045;
const DAMPING = 0.86;
const BREATH = 0.4;
const SWIRL = 0.9;
const REPEL_RADIUS = 70;
const REPEL_FORCE = 3.2;

// Timing, in seconds.
const ENTRANCE = 2.2;
const MAX_DELAY = 0.35;
const SETTLE_AT = ENTRANCE + MAX_DELAY + 0.35;
const FADE_MS = 500; // matches the canvas's CSS opacity transition

const PAPER = "#E8DCC8";
const PAPER_TRAIL = "rgba(232, 220, 200, 0.28)"; // repainting at low alpha leaves a faint ink bleed
const INK_ALPHA = 0.9;
const TAU = Math.PI * 2;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (v: number) => v * v * (3 - 2 * v);

/** Samples opaque pixels of the image drawn at display size. Colours are bucketed so each draws in one fill. */
function sampleImage(img: HTMLImageElement, size: number, count: number) {
  const w = Math.max(1, Math.round(size));
  const off = document.createElement("canvas");
  off.width = w;
  off.height = w;
  const g = off.getContext("2d", { willReadFrequently: true });
  const u = new Float32Array(count);
  const v = new Float32Array(count);
  if (!g) return { u, v, colours: [] as string[], lists: [] as Uint32Array[] };
  g.drawImage(img, 0, 0, w, w);
  const px = g.getImageData(0, 0, w, w).data;

  const filled: number[] = [];
  for (let i = 3, p = 0; i < px.length; i += 4, p++) if (px[i] > ALPHA_MIN) filled.push(p);

  const buckets = new Map<number, { r: number; g: number; b: number; idx: number[] }>();
  for (let i = 0; i < count && filled.length; i++) {
    // Partial Fisher-Yates: an even spread without repeats (repeats only if the image is tiny).
    const j = i < filled.length ? i + ((Math.random() * (filled.length - i)) | 0) : (Math.random() * filled.length) | 0;
    const p = filled[j];
    if (i < filled.length) [filled[i], filled[j]] = [filled[j], filled[i]];
    u[i] = ((p % w) + Math.random()) / w;
    v[i] = (((p / w) | 0) + Math.random()) / w;
    const r = px[p * 4];
    const gg = px[p * 4 + 1];
    const b = px[p * 4 + 2];
    // 2 bits per channel: few enough fills to stay cheap, close enough since the crisp image takes over.
    const key = ((r >> 6) << 4) | ((gg >> 6) << 2) | (b >> 6);
    let bucket = buckets.get(key);
    if (!bucket) buckets.set(key, (bucket = { r: 0, g: 0, b: 0, idx: [] }));
    bucket.r += r;
    bucket.g += gg;
    bucket.b += b;
    bucket.idx.push(i);
  }
  const all = [...buckets.values()];
  return {
    u,
    v,
    colours: all.map(
      (c) => `rgb(${Math.round(c.r / c.idx.length)}, ${Math.round(c.g / c.idx.length)}, ${Math.round(c.b / c.idx.length)})`
    ),
    lists: all.map((c) => Uint32Array.from(c.idx)),
  };
}

type Particles = ReturnType<typeof createParticles>;

function createParticles(sample: ReturnType<typeof sampleImage>, width: number, height: number) {
  const n = sample.u.length;
  const p = {
    n,
    ...sample,
    x: new Float32Array(n),
    y: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    r: new Float32Array(n),
    size: new Float32Array(n),
    delay: new Float32Array(n),
    phase: new Float32Array(n),
    freq: new Float32Array(n),
    wobble: new Float32Array(n),
    flow: new Float32Array(n),
  };
  for (let i = 0; i < n; i++) {
    p.x[i] = Math.random() * width;
    p.y[i] = Math.random() * height;
    p.r[i] = 0.8 + Math.random();
    p.size[i] = 1;
    p.delay[i] = Math.random() * MAX_DELAY;
    p.phase[i] = Math.random() * TAU;
    p.freq[i] = 0.6 + Math.random() * 0.8;
    p.wobble[i] = Math.random() * 2 - 1;
    p.flow[i] = Math.random();
  }
  return p;
}

export default function WitnessCanvas({
  stageRef,
  slotRef,
  src,
  onSettle,
  onDissolve,
}: {
  stageRef: RefObject<HTMLElement | null>;
  slotRef: RefObject<HTMLElement | null>;
  src: string;
  /** Called once: `animated` is false when particles are skipped (reduced motion, no canvas, image failed). */
  onSettle: (animated: boolean) => void;
  /** Called when the particles take over from the image (scrolling away) and hand back (scrolled home). */
  onDissolve: (active: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef({ onSettle, onDissolve });
  useEffect(() => {
    callbacks.current = { onSettle, onDissolve };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const slot = slotRef.current;
    if (!canvas || !stage || !slot) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !ctx) {
      canvas.style.opacity = "0";
      callbacks.current.onSettle(false);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
    const img = new Image();
    let disposed = false;
    let width = 0;
    let height = 0;
    let small = false;
    let parts: Particles | null = null;
    let start = 0;
    let last = 0;
    let raf = 0;
    let onScreen = false;
    let settled = false;
    let dissolving = false;
    let resting = false; // settled, image showing, loop parked until the visitor scrolls
    let lastActive = 0;

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

    function build() {
      small = width < 768 || lowPower;
      parts = createParticles(sampleImage(img, slot!.getBoundingClientRect().width, small ? COUNT_SMALL : COUNT), width, height);
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
      const lx = slotRect.left - stageRect.left;
      const ly = slotRect.top - stageRect.top;
      const sw = slotRect.width;
      const sh = slotRect.height;
      const cx = lx + sw / 2;
      const cy = ly + sh / 2;
      const dissolve = smoothstep(clamp01(-stageRect.top / stageRect.height));

      // Hand-offs between particles and the crisp image.
      if (!settled && t > SETTLE_AT) {
        settled = true;
        canvas!.style.opacity = "0";
        callbacks.current.onSettle(true);
      }
      if (settled) {
        const active = dissolve > 0.01;
        if (active !== dissolving) {
          dissolving = active;
          canvas!.style.opacity = active ? "1" : "0";
          callbacks.current.onDissolve(active);
        }
        if (active) lastActive = now;
        else if (now - lastActive > FADE_MS + 100) {
          resting = true; // faded out and still: park the loop
          updateLoop();
          return;
        }
      }

      const mx = pointerX - stageRect.left;
      const my = pointerY - stageRect.top;
      const inside = pointerActive && mx >= 0 && my >= 0 && mx <= width && my <= height;
      const damp = Math.pow(DAMPING, dt);
      const flowT = t * 0.05;
      const r2 = REPEL_RADIUS * REPEL_RADIUS;

      for (let i = 0; i < p.n; i++) {
        const ph = p.phase[i];
        let gx = lx + p.u[i] * sw + Math.sin(t * p.freq[i] + ph) * BREATH;
        let gy = ly + p.v[i] * sh + Math.cos(t * p.freq[i] * 1.3 + ph) * BREATH;

        if (dissolve > 0) {
          // A narrow river of ink from Witzy down to the bottom centre of the hero.
          const u = (p.flow[i] + flowT) % 1;
          const sx = cx + (width / 2 - cx) * u + p.wobble[i] * (6 + 10 * u) + Math.sin(t * 1.5 + u * 9 + ph) * 2;
          const sy = cy + u * (height - cy);
          gx += (sx - gx) * dissolve;
          gy += (sy - gy) * dissolve;
          p.size[i] = 1 - dissolve * (1 - Math.sin(Math.PI * u));
        } else {
          p.size[i] = 1;
        }

        // The spring ramps up over the entrance, so particles spiral in rather than snap.
        const e = clamp01((t - p.delay[i]) / ENTRANCE);
        const k = K * (0.04 + 0.96 * e * e);
        let ax = (gx - p.x[i]) * k;
        let ay = (gy - p.y[i]) * k;

        if (e < 1) {
          const dx = p.x[i] - cx;
          const dy = p.y[i] - cy;
          const d = Math.hypot(dx, dy) + 1;
          const s = SWIRL * (1 - e);
          ax -= (dy / d) * s;
          ay += (dx / d) * s;
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

      const c = ctx!;
      c.globalAlpha = 1;
      c.fillStyle = PAPER_TRAIL;
      c.fillRect(0, 0, width, height);
      c.globalAlpha = INK_ALPHA * (1 - 0.7 * dissolve);
      for (let g = 0; g < p.lists.length; g++) {
        const list = p.lists[g];
        c.fillStyle = p.colours[g];
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

    // Run only while the stage is on screen, the tab is visible, and there is something to animate.
    function updateLoop() {
      const run = !!parts && onScreen && !document.hidden && !resting;
      if (run && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    // Scrolling away from a resting Witzy wakes the particles for the dissolve.
    const onScroll = () => {
      if (resting && stage.getBoundingClientRect().top < -1) {
        resting = false;
        updateLoop();
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      updateLoop();
    });

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!parts) return;
        const wasSmall = small;
        resizeCanvas();
        // Targets are relative to the slot, so a resize only rescales them. Re-sample when the
        // particle budget changes (crossing the 768px breakpoint).
        if ((width < 768 || lowPower) !== wasSmall) build();
      }, 150);
    });

    const offPointer = onPointerMove((e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      pointerActive = true;
    });
    const onEnd = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") pointerActive = false; // a finger lifting shouldn't leave a dent
    };
    const onLeave = () => {
      pointerActive = false;
    };

    img.src = src;
    img
      .decode()
      .then(() => {
        if (disposed) return;
        resizeCanvas();
        build();
        start = performance.now();
        io.observe(stage);
        ro.observe(stage);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("pointerup", onEnd, { passive: true });
        window.addEventListener("pointercancel", onEnd, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        document.addEventListener("visibilitychange", updateLoop);
      })
      .catch(() => {
        if (disposed) return;
        canvas.style.opacity = "0";
        callbacks.current.onSettle(false);
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.clearTimeout(resizeTimer);
      offPointer();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", updateLoop);
    };
  }, [stageRef, slotRef, src]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-500"
    />
  );
}
