import { useSyncExternalStore } from "react";

// Witzy's voice and mouth.
// - Lines with a recording (LINE_AUDIO / TEXT_AUDIO) play through a plain <audio> element, so the sound never
//   depends on a Web Audio context being "running". Lip-sync reads a loudness envelope that is
//   decoded from the same file ahead of time and follows audio.currentTime.
// - Lines without a recording "fake talk": the mouth moves at a natural, irregular rhythm while the text types.
// - Browsers only allow sound after a user gesture, so the recorded greeting plays after the visitor
//   clicks Witzy or turns sound on. Sound is off by default; the preference is remembered in localStorage.
// - Add ?witzydebug to the URL to log every step to the console.

export type Frame = "closed" | "half" | "open" | "wave";
export type Line = { id: string; text: string };

export const HELLO: Line = {
  id: "hello",
  text: "Hi! I'm Witzy. I watch what your AI agent does, and write it all down.",
};

/** Recorded audio per line id. Add an entry here when a line gets its own recording. */
export const LINE_AUDIO: Partial<Record<string, string>> = {
  hello: "/brand/witzy/witzy-hello.mp3",
};

/**
 * Recorded audio per line text, so every card is read out loud whatever id the card uses.
 * Matching ignores case, punctuation and quote styles. To add a line: generate its mp3 into
 * public/brand/witzy/ and add the exact card text here.
 */
const TEXT_AUDIO: Record<string, string> = {
  "Hi! I'm Witzy. I watch what your AI agent does, and write it all down.": "/brand/witzy/witzy-hello.mp3",
  "Your AI just clicked 'refund'. Can you prove how much?": "/brand/witzy/witzy-refund.mp3",
  "Every note I take is chained to the one before. Nobody can quietly change them.": "/brand/witzy/witzy-chain.mp3",
  "Change one of my notes and I'll know. Try it below!": "/brand/witzy/witzy-try.mp3",
  "I never slow your agent down. Less than a millisecond, promise.": "/brand/witzy/witzy-fast.mp3",
  "Your data stays on your computer. I just keep the receipts.": "/brand/witzy/witzy-local.mp3",
};

const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "");
const TEXT_AUDIO_NORM = new Map(Object.entries(TEXT_AUDIO).map(([t, src]) => [norm(t), src]));

function audioSrc(line: Line): string | undefined {
  return LINE_AUDIO[line.id] ?? TEXT_AUDIO_NORM.get(norm(line.text));
}

const TYPE_CPS = 28; // matches the bubble's typing speed
const GREETING_WAVE_MS = 900;
const MIN_HOLD_MS = 60;
const HOP_S = 0.02; // envelope resolution: 20ms
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const debugOn = () => {
  try {
    return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("witzydebug");
  } catch {
    return false;
  }
};
function dbg(...args: unknown[]) {
  if (debugOn()) console.log("[witzy]", ...args);
}

// ---- Small stores ------------------------------------------------------------------------------

function store<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      if (next === value) return;
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

const mouth = store<Frame>("closed");
const waving = store(false);
const soundOn = store(false);
let soundLoaded = false;
let greeted = false;

const frameSnapshot = () => (waving.get() ? "wave" : mouth.get());
const subscribeFrame = (l: () => void) => {
  const a = mouth.subscribe(l);
  const b = waving.subscribe(l);
  return () => {
    a();
    b();
  };
};

/** The frame Witzy should show right now. */
export function useWitzyFrame(): Frame {
  return useSyncExternalStore(subscribeFrame, frameSnapshot, () => "closed");
}

function loadSound() {
  if (soundLoaded || typeof window === "undefined") return;
  soundLoaded = true;
  try {
    soundOn.set(window.localStorage.getItem("witzy-sound") === "on");
  } catch {
    /* storage unavailable: stay off */
  }
}

export function useSound() {
  return useSyncExternalStore(
    soundOn.subscribe,
    () => {
      loadSound();
      return soundOn.get();
    },
    () => false
  );
}

export function setSound(on: boolean) {
  soundLoaded = true;
  soundOn.set(on);
  try {
    window.localStorage.setItem("witzy-sound", on ? "on" : "off");
  } catch {
    /* not persisted; still applies for this visit */
  }
  if (!on) stopAudio();
}

// The greeting plays once per visit (this browser session). Marked only once audio actually plays.
const GREETED_KEY = "witzy-greeted";
export function hasGreeted() {
  if (greeted) return true;
  try {
    greeted = window.sessionStorage.getItem(GREETED_KEY) === "1";
  } catch {
    /* storage unavailable: once per page view instead */
  }
  return greeted;
}
function markGreeted() {
  greeted = true;
  try {
    window.sessionStorage.setItem(GREETED_KEY, "1");
  } catch {
    /* not persisted */
  }
}

// ---- Audio elements and loudness envelopes -----------------------------------------------------

const elements = new Map<string, HTMLAudioElement>();
const envelopes = new Map<string, Float32Array>();
const envelopeJobs = new Map<string, Promise<void>>();

function audioFor(src: string) {
  let el = elements.get(src);
  if (!el) {
    el = new Audio(src);
    el.preload = "auto";
    el.addEventListener("error", () => dbg("audio error", src, el?.error?.code, el?.error?.message));
    elements.set(src, el);
  }
  return el;
}

/** Decodes the file once and stores its loudness per 20ms, normalised to 0..1. Needs no user gesture. */
function loadEnvelope(src: string): Promise<void> {
  const existing = envelopeJobs.get(src);
  if (existing) return existing;
  const job = (async () => {
    try {
      const OAC =
        window.OfflineAudioContext ??
        (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
      if (!OAC) return;
      const bytes = await (await fetch(src)).arrayBuffer();
      const decoder = new OAC(1, 1, 44100);
      const audio = await decoder.decodeAudioData(bytes);
      const data = audio.getChannelData(0);
      const hop = Math.max(1, Math.round(audio.sampleRate * HOP_S));
      const n = Math.ceil(data.length / hop);
      const env = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let sum = 0;
        const start = i * hop;
        const end = Math.min(data.length, start + hop);
        for (let j = start; j < end; j++) sum += data[j] * data[j];
        env[i] = Math.sqrt(sum / Math.max(1, end - start));
      }
      const sorted = Array.from(env).sort((a, b) => a - b);
      const ref = sorted[Math.floor(sorted.length * 0.95)] || 1;
      for (let i = 0; i < n; i++) env[i] = Math.min(1, env[i] / ref);
      envelopes.set(src, env);
      dbg("envelope ready", src, n, "frames");
    } catch (err) {
      dbg("envelope failed (mouth will fake-talk while the audio plays)", err);
    }
  })();
  envelopeJobs.set(src, job);
  return job;
}

/** Start decoding recordings early so lip-sync is ready by the first click. Safe to call anytime. */
export function preloadVoice() {
  if (typeof window === "undefined") return;
  for (const src of new Set([...Object.values(LINE_AUDIO), ...Object.values(TEXT_AUDIO)])) {
    if (!src) continue;
    audioFor(src);
    void loadEnvelope(src);
  }
}

// ---- Talking ---------------------------------------------------------------------------------

let job = 0; // bumps to cancel whatever the mouth was doing
let timer = 0;
let raf = 0;
let playing: { id: string; el: HTMLAudioElement } | null = null;
let waveTimer = 0;
let hiddenHooked = false;

function stopMouth() {
  job++;
  window.clearTimeout(timer);
  cancelAnimationFrame(raf);
  if (playing && !playing.el.paused) {
    dbg("stopped", playing.id);
    playing.el.pause();
  }
  playing = null;
  mouth.set("closed");
}

function stopAudio() {
  if (playing) stopMouth();
}

function hookVisibility() {
  if (hiddenHooked) return;
  hiddenHooked = true;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopMouth();
  });
}

/** Shows the wave frame for `ms` over whatever the mouth is doing. */
export function wave(ms = 1200) {
  if (reducedMotion()) return;
  window.clearTimeout(waveTimer);
  waving.set(true);
  waveTimer = window.setTimeout(() => waving.set(false), ms);
}

/** Irregular closed/half/open changes, about 10 a second, for `ms`. */
function fakeTalk(ms: number) {
  if (reducedMotion()) return;
  const id = job;
  const end = performance.now() + ms;
  const step = () => {
    if (id !== job) return;
    if (performance.now() >= end) return mouth.set("closed");
    const options: Frame[] = (["closed", "half", "open"] as Frame[]).filter((f) => f !== mouth.get());
    mouth.set(options[(Math.random() * options.length) | 0]);
    timer = window.setTimeout(step, 60 + Math.random() * 40 + (Math.random() < 0.1 ? 60 : 0));
  };
  step();
}

/** Plays the recording and moves the mouth with its loudness at audio.currentTime. */
function lipSync(line: Line, src: string, onStart?: () => void) {
  const id = job;
  const el = audioFor(src);
  void loadEnvelope(src);
  playing = { id: line.id, el };
  el.muted = false;
  el.volume = 1;
  try {
    el.currentTime = 0;
  } catch {
    /* not seekable yet: plays from the start anyway */
  }

  let started = false;
  el.onplaying = () => {
    if (id !== job || started) return;
    started = true;
    dbg("playing", src);
    if (line.id === HELLO.id) markGreeted();
    onStart?.();
  };
  el.onended = () => {
    if (id !== job) return;
    dbg("ended", src);
    playing = null;
    cancelAnimationFrame(raf);
    mouth.set("closed");
  };

  dbg("play()", src, "readyState", el.readyState, "networkState", el.networkState);
  el.play().then(
    () => dbg("play() resolved"),
    (err: unknown) => {
      dbg("play() rejected", err);
      if (id !== job) return;
      playing = null;
      cancelAnimationFrame(raf);
      onStart?.();
      fakeTalk((line.text.length / TYPE_CPS) * 1000);
    }
  );

  let level = 0;
  let shown: Frame = "closed";
  let since = 0;
  let fakeLevel = 0;
  let fakeUntil = 0;
  const tick = (now: number) => {
    if (id !== job) return;
    if (!el.paused && !el.ended) {
      const env = envelopes.get(src);
      let target: number;
      if (env) {
        const i = Math.min(env.length - 1, Math.max(0, Math.floor(el.currentTime / HOP_S)));
        target = env[i];
      } else {
        // Envelope not decoded yet: an irregular stand-in so the mouth still moves while he speaks.
        if (now >= fakeUntil) {
          fakeLevel = Math.random();
          fakeUntil = now + 70 + Math.random() * 60;
        }
        target = fakeLevel;
      }
      level += (target - level) * (target > level ? 0.5 : 0.25); // attack 0.5, release 0.25
      const want: Frame = level < 0.15 ? "closed" : level < 0.45 ? "half" : "open";
      if (want !== shown && now - since >= MIN_HOLD_MS) {
        shown = want;
        since = now;
        mouth.set(want);
      }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

/**
 * Says a line: real audio + lip-sync if it has a recording and sound is on (or `force`, for a user
 * gesture), otherwise fake talk while it types. Replaces whatever Witzy was saying.
 */
export function talk(line: Line, { force = false, onStart }: { force?: boolean; onStart?: () => void } = {}) {
  if (typeof window === "undefined") return;
  hookVisibility();
  loadSound();
  preloadVoice();
  if (playing?.id === line.id && !playing.el.paused) return; // already saying exactly this
  const src = audioSrc(line);
  // A recording is still playing and this line has no recording of its own: let the voice finish
  // instead of cutting it off. The bubble can move on; the mouth keeps following the voice.
  if (playing && !playing.el.paused && !playing.el.ended && !force && !src) {
    dbg("kept voice playing over", line.id);
    onStart?.();
    return;
  }
  stopMouth();
  // Browsers refuse sound until the visitor has clicked or tapped the page. Don't even try before
  // that (it would only fail); fake-talk now, and the first click on Witzy plays the real voice.
  const activated = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  if (src && !force && activated && !activated.hasBeenActive) {
    dbg("no click yet; waiting before playing", line.id);
    onStart?.();
    fakeTalk((line.text.length / TYPE_CPS) * 1000);
    return;
  }
  // The greeting's recording is heard once per visit; after that the line (if shown) just fake-talks.
  const once = line.id === HELLO.id && hasGreeted() && !force;
  if (src && !once && (soundOn.get() || force)) {
    lipSync(line, src, onStart);
  } else {
    onStart?.();
    fakeTalk((line.text.length / TYPE_CPS) * 1000);
  }
}

/**
 * The recorded greeting. Call from a click (that's what lets the browser play it); turns sound on.
 * Witzy waves from the click until 0.9s after the audio actually starts.
 */
export function greet() {
  setSound(true);
  const motion = !reducedMotion();
  if (motion) {
    window.clearTimeout(waveTimer);
    waving.set(true);
    waveTimer = window.setTimeout(() => waving.set(false), 4000); // safety net if the audio never starts
  }
  talk(HELLO, {
    force: true,
    onStart: () => {
      if (!motion) return;
      window.clearTimeout(waveTimer);
      waveTimer = window.setTimeout(() => waving.set(false), GREETING_WAVE_MS);
    },
  });
}
