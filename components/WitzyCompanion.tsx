"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import gsap from "gsap";
import WitzyBubble from "./WitzyBubble";
import WitzyFrames from "./WitzyFrames";
import { RESET_EVENT, TAMPER_EVENT, type TamperDetail } from "@/lib/chain";
import { HELLO, greet, hasGreeted, talk, wave, type Line } from "@/lib/witzy-voice";

// Once the hero has scrolled away, a small Witzy keeps the visitor company in the bottom-right corner
// with one line about the section in view. Hidden over the hero (the big Witzy is there), in the
// footer, and for the rest of the session once dismissed.

const LINES: Record<string, string> = {
  tryit: "Go on, change a record. I dare you.",
  claim: "Drag the line. What it said vs what it did.",
  mechanism: "I sit in the middle and copy everything. I never block anything.",
  evidence: "One command gives you this page. Hand it to anyone.",
  measurements: "Told you I'm fast.",
  review: "Want me to watch your agent for a week?",
  limits: "I'm honest about what I can't do yet.",
};
const SHOW_MS = 5000;

// Session dismissal, read through useSyncExternalStore so server and first client render agree.
const DISMISS_KEY = "witzy-companion-dismissed";
const dismissListeners = new Set<() => void>();
const readDismissed = () => {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};
const subscribeDismissed = (l: () => void) => {
  dismissListeners.add(l);
  return () => dismissListeners.delete(l);
};

type Say = Line & { tone: "normal" | "fail" };

// Line ids key optional recordings (LINE_AUDIO in lib/witzy-voice.ts).
const sectionLine = (key: string): Say => ({ id: `companion-${key}`, text: LINES[key], tone: "normal" });

export default function WitzyCompanion() {
  const figure = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dismissed = useSyncExternalStore(subscribeDismissed, readDismissed, () => false);
  const [heroIn, setHeroIn] = useState(true);
  const [footerIn, setFooterIn] = useState(false);
  const [say, setSay] = useState<Say | null>(null);
  const [open, setOpen] = useState(false);
  const [covered, setCovered] = useState(false);
  const [opened, setOpened] = useState(0); // bumps each time the bubble opens, restarting the auto-hide

  const visible = !heroIn && !footerIn && !dismissed;
  // Observer callbacks can fire in the same frame, before React re-renders, so they read these
  // synchronously updated values rather than `visible`.
  const state = useRef({ heroIn: true, footerIn: false, section: "", waved: false });
  const isVisible = () => !state.current.heroIn && !state.current.footerIn && !readDismissed();

  function show(next: Say) {
    setSay(next);
    setOpen(true);
    setOpened((n) => n + 1);
    talk(next);
  }

  // Where are we? Hero and footer hide the companion; the section across the middle of the screen picks the line.
  useEffect(() => {
    const stage = document.querySelector("[data-witzy-stage]");
    const footer = document.querySelector("footer");
    const edges = new IntersectionObserver((entries) => {
      const wasVisible = isVisible();
      for (const e of entries) {
        if (e.target === stage) {
          state.current.heroIn = e.isIntersecting;
          setHeroIn(e.isIntersecting);
        } else {
          state.current.footerIn = e.isIntersecting;
          setFooterIn(e.isIntersecting);
        }
      }
      // Just appeared (e.g. scrolled past the hero): wave the first time, and say something about wherever we are.
      if (!wasVisible && isVisible()) {
        if (!state.current.waved) {
          state.current.waved = true;
          wave(1200);
        }
        if (state.current.section) show(sectionLine(state.current.section));
      }
    });
    if (stage) edges.observe(stage);
    if (footer) edges.observe(footer);

    const sections = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const key = (e.target as HTMLElement).dataset.witzy ?? "";
          if (!e.isIntersecting || key === state.current.section || !LINES[key]) continue;
          state.current.section = key;
          if (isVisible()) show(sectionLine(key));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    document.querySelectorAll("[data-witzy]").forEach((el) => sections.observe(el));
    return () => {
      edges.disconnect();
      sections.disconnect();
    };
  }, []);

  // The bubble tucks itself away after 5s.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => setOpen(false), SHOW_MS);
    return () => window.clearTimeout(id);
  }, [open, opened]);

  // Never cover a main call to action: hide the bubble while it overlaps one.
  useEffect(() => {
    if (!open || !visible) return;
    let raf = 0;
    const check = () => {
      raf = 0;
      const b = bubbleRef.current?.getBoundingClientRect();
      if (!b) return;
      const hit = [...document.querySelectorAll("[data-cta]")].some((el) => {
        const r = el.getBoundingClientRect();
        return r.left < b.right && b.left < r.right && r.top < b.bottom && b.top < r.bottom;
      });
      setCovered(hit);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, visible]);

  // React to the ledger, if this is the Witzy on screen.
  useEffect(() => {
    const shake = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.to(figure.current, { keyframes: { x: [-6, 6, -4, 4, 0] }, duration: 0.4, ease: "none" });
    };
    const onTamper = (e: Event) => {
      if (!isVisible()) return;
      const row = (e as CustomEvent<TamperDetail>).detail.row;
      shake();
      show({ id: "tamper", text: `Hey! Someone changed record ${String(row + 1).padStart(2, "0")}!`, tone: "fail" });
    };
    const onReset = () => {
      if (isVisible()) show({ id: "reset", text: "Phew. Everything matches again.", tone: "normal" });
    };
    window.addEventListener(TAMPER_EVENT, onTamper);
    window.addEventListener(RESET_EVENT, onReset);
    return () => {
      window.removeEventListener(TAMPER_EVENT, onTamper);
      window.removeEventListener(RESET_EVENT, onReset);
    };
  }, []);

  function onWitzyClick() {
    // The first click anywhere on Witzy plays the recorded greeting (the click lets the browser start audio).
    if (!hasGreeted()) {
      setSay({ ...HELLO, tone: "normal" });
      setOpen(true);
      setOpened((n) => n + 1);
      return greet();
    }
    const again = say ?? (state.current.section ? sectionLine(state.current.section) : null);
    if (again) show(again);
  }

  function dismiss() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* not persisted; hidden for this page view */
    }
    dismissListeners.forEach((l) => l());
    setOpen(false);
  }

  return (
    <div
      inert={!visible}
      className={`pointer-events-none fixed right-[max(16px,env(safe-area-inset-right))] bottom-[max(16px,env(safe-area-inset-bottom))] z-30 flex items-end gap-2 transition-[translate,opacity] duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-[calc(100%+32px)] opacity-0"
      }`}
    >
      <div
        ref={bubbleRef}
        className={`mb-9 w-max max-w-[min(180px,calc(100vw-140px))] transition-opacity duration-300 sm:max-w-[240px] ${
          open && !covered && say ? "pointer-events-auto opacity-100" : "opacity-0"
        }`}
      >
        {say && <WitzyBubble text={say.text} tone={say.tone} tail="right" size="sm" />}
      </div>

      <div className="pointer-events-auto relative h-[84px] w-[84px] shrink-0">
        <button
          ref={figure}
          type="button"
          onClick={onWitzyClick}
          aria-label="Witzy. Show what he's saying."
          className="relative block h-full w-full cursor-pointer rounded-full"
        >
          <WitzyFrames size={400} />
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide Witzy for this visit"
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-navy/15 bg-bone font-mono text-[11px] leading-none text-navy hover:border-navy"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
