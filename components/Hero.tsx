"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import WitnessCanvas from "./WitnessCanvas";
import WitzyBubble from "./WitzyBubble";
import { RESET_EVENT, TAMPER_EVENT, type TamperDetail } from "@/lib/chain";
import { onPointerMove } from "@/lib/pointer";
import { setSound, speak, useSound, useSpeechSupported } from "@/lib/witzy-voice";

const FACTS = [
  { k: "Added latency", v: "0.34 ms", note: "p50, small call" },
  { k: "Dependencies", v: "0", note: "pure Python" },
  { k: "Tests", v: "338", note: "v0.4.7" },
  { k: "Licence", v: "MIT", note: "open source" },
];

const TIPS = [
  "Hi! I'm Witzy. I watch what your AI agent does, and write it all down.",
  "Your AI just clicked 'refund'. Can you prove how much?",
  "Every note I take is chained to the one before. Nobody can quietly change them.",
  "Change one of my notes and I'll know. Try it below!",
  "I never slow your agent down. Less than a millisecond, promise.",
  "Your data stays on your computer. I just keep the receipts.",
];
const TIP_MS = 6500;

// Witzy's eyes, measured from witzy.png, in % of the image (centre x/y, width/height), slightly
// oversized so a closed lid covers the rim. Order: left, right, forehead.
const EYES = [
  { x: 39.3, y: 46.5, w: 18.6, h: 18.2 },
  { x: 71.0, y: 42.5, w: 17.0, h: 17.4 },
  { x: 52.3, y: 27.4, w: 11.6, h: 9.6 },
];

type Say = { text: string; tone: "normal" | "fail" };
type Motion = {
  onSettle: (animated: boolean) => void;
  onDissolve: (active: boolean) => void;
  setActive: (active: boolean) => void;
  twirl: (then: () => void) => void;
  shake: () => void;
};

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const figure = useRef<HTMLDivElement>(null); // fades in over the particles
  const look = useRef<HTMLDivElement>(null); // leans toward the cursor
  const idle = useRef<HTMLDivElement>(null); // breathing and floating
  const action = useRef<HTMLButtonElement>(null); // hop, wiggle, twirl, shake
  const motion = useRef<Motion | null>(null);
  const heroVisible = useRef(false);

  const [copied, setCopied] = useState(false);
  const [started, setStarted] = useState(false); // Witzy has landed and is talking
  const [visible, setVisible] = useState(false);
  const [tip, setTip] = useState(0);
  const [override, setOverride] = useState<Say | null>(null);
  const sound = useSound();
  const canSpeak = useSpeechSupported();

  const say: Say = override ?? { text: TIPS[tip], tone: "normal" };

  useGSAP(
    (_context, contextSafe) => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce) {
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .from("[data-line]", { yPercent: 110, duration: 1.2, stagger: 0.12 })
          .from("[data-fade]", { autoAlpha: 0, y: 12, duration: 0.8, stagger: 0.08 }, "-=0.7");
      }
      if (!contextSafe) return;

      const loops: gsap.core.Animation[] = [];
      let blink: gsap.core.Tween | null = null;
      let offPointer = () => {};
      let offLeave = () => {};
      let landed = false;

      // Every 4-7s, navy lids close over all three eyes for 140ms.
      const scheduleBlink = contextSafe(() => {
        blink = gsap.delayedCall(4 + Math.random() * 3, () => {
          gsap.fromTo("[data-lid]", { scaleY: 0 }, { scaleY: 1, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.inOut" });
          scheduleBlink();
        });
      });

      const startAlive = contextSafe(() => {
        landed = true;
        loops.push(
          gsap.to(idle.current, { scaleY: 1.025, scaleX: 0.99, duration: 2.6, yoyo: true, repeat: -1, ease: "sine.inOut" }),
          gsap.to(idle.current, { y: -8, duration: 3.4, yoyo: true, repeat: -1, ease: "sine.inOut" })
        );
        scheduleBlink();

        // Lean toward the cursor; back to neutral when it leaves the hero or the window.
        const rot = gsap.quickTo(look.current, "rotation", { duration: 0.6, ease: "power2.out" });
        const qx = gsap.quickTo(look.current, "x", { duration: 0.6, ease: "power2.out" });
        const qy = gsap.quickTo(look.current, "y", { duration: 0.6, ease: "power2.out" });
        const neutral = () => {
          rot(0);
          qx(0);
          qy(0);
        };
        offPointer = onPointerMove((e) => {
          const s = stage.current!.getBoundingClientRect();
          if (e.clientY < s.top || e.clientY > s.bottom) return neutral();
          const b = slot.current!.getBoundingClientRect();
          const nx = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / 400));
          const ny = Math.max(-1, Math.min(1, (e.clientY - (b.top + b.height / 2)) / 400));
          rot(nx * 5);
          qx(nx * 10);
          qy(ny * 10);
        });
        document.documentElement.addEventListener("pointerleave", neutral);
        offLeave = () => document.documentElement.removeEventListener("pointerleave", neutral);
        if (!heroVisible.current) motion.current?.setActive(false);
      });

      motion.current = {
        onSettle: contextSafe((animated: boolean) => {
          if (!animated) {
            gsap.set(figure.current, { opacity: 1 });
            setStarted(true);
            return;
          }
          // Crossfade from the particles, then land: a hop and a wiggle before the first line.
          gsap
            .timeline()
            .to(figure.current, { opacity: 1, duration: 0.5, ease: "power2.out" })
            .to(action.current, { y: -18, duration: 0.25, ease: "power2.out" })
            .to(action.current, { y: 0, duration: 0.25, ease: "back.out(3)" })
            .to(action.current, { keyframes: { rotation: [-6, 6, -4, 0] }, duration: 0.6, ease: "sine.inOut" })
            .add(() => {
              setStarted(true);
              startAlive();
            });
        }),
        onDissolve: contextSafe((active: boolean) => {
          gsap.to(figure.current, { opacity: active ? 0 : 1, duration: 0.5, overwrite: "auto" });
        }),
        setActive: contextSafe((active: boolean) => {
          if (!landed) return;
          loops.forEach((l) => (active ? l.resume() : l.pause()));
          if (active) blink?.resume();
          else blink?.pause();
        }),
        twirl: contextSafe((then: () => void) => {
          if (reduce || !landed || gsap.isTweening(action.current)) return then();
          gsap
            .timeline({ onComplete: then })
            .to(action.current, { rotationY: 360, duration: 0.8, ease: "power2.inOut", transformPerspective: 800 }, 0)
            .to(action.current, { y: -14, duration: 0.4, ease: "power2.out" }, 0)
            .to(action.current, { y: 0, duration: 0.4, ease: "power2.in" }, 0.4)
            .set(action.current, { rotationY: 0 });
        }),
        shake: contextSafe(() => {
          if (reduce) return;
          gsap.to(action.current, { keyframes: { x: [-6, 6, -4, 4, 0] }, duration: 0.4, ease: "none" });
        }),
      };

      return () => {
        offPointer();
        offLeave();
        motion.current = null;
      };
    },
    { scope: root }
  );

  // Visibility drives the tip rotation, the idle loops and the voice.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let intersecting = false;
    const update = () => {
      const v = intersecting && !document.hidden;
      heroVisible.current = v;
      setVisible(v);
      motion.current?.setActive(v);
    };
    const io = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  // Tips rotate every 6.5s while the hero is visible; a tamper/reset line holds for one turn.
  useEffect(() => {
    if (!started || !visible) return;
    const id = window.setTimeout(() => {
      if (override) setOverride(null);
      else setTip((t) => (t + 1) % TIPS.length);
    }, TIP_MS);
    return () => window.clearTimeout(id);
  }, [started, visible, tip, override]);

  // Speak each new line while sound is on and the hero is visible.
  useEffect(() => {
    if (started && heroVisible.current) speak(say.text);
  }, [say.text, started]);

  // React to the ledger in Exhibit 02, if this is the Witzy on screen.
  useEffect(() => {
    const onTamper = (e: Event) => {
      if (!heroVisible.current) return;
      const row = (e as CustomEvent<TamperDetail>).detail.row;
      motion.current?.shake();
      setOverride({ text: `Hey! Someone changed record ${String(row + 1).padStart(2, "0")}!`, tone: "fail" });
    };
    const onReset = () => {
      if (!heroVisible.current) return;
      setOverride({ text: "Phew. Everything matches again.", tone: "normal" });
    };
    window.addEventListener(TAMPER_EVENT, onTamper);
    window.addEventListener(RESET_EVENT, onReset);
    return () => {
      window.removeEventListener(TAMPER_EVENT, onTamper);
      window.removeEventListener(RESET_EVENT, onReset);
    };
  }, []);

  function nextTip() {
    setOverride(null);
    setTip((t) => (t + 1) % TIPS.length);
  }

  function toggleSound() {
    const on = !sound;
    setSound(on);
    if (on) speak(say.text); // inside the click, so the browser allows it
  }

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText("pip install callwitness");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable: ignore */
    }
  }

  return (
    <section ref={root} className="relative overflow-x-clip">
      {/* the first screen (viewport minus the 72px nav and its 1px border); particles draw behind it */}
      <div
        ref={stage}
        data-witzy-stage
        className="relative isolate flex min-h-[calc(100svh-73px)] flex-col lg:min-h-[max(640px,calc(100svh-73px))]"
      >
        <WitnessCanvas
          stageRef={stage}
          slotRef={slot}
          src="/brand/witzy-800.webp"
          onSettle={(animated) => motion.current?.onSettle(animated)}
          onDissolve={(active) => motion.current?.onDissolve(active)}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-6 md:px-10">
          {/* masthead strip */}
          <div data-fade className="flex items-center justify-between border-b border-rule py-4">
            <span className="label">Exhibit 01 / The record</span>
            <span className="label hidden sm:inline">Open source &middot; v0.4.7 &middot; Kathmandu</span>
          </div>

          {/* below lg: headline, Witzy, copy. lg: copy on the left, Witzy's stage on the right. */}
          <div className="grid flex-1 grid-cols-1 content-center gap-y-5 py-5 [grid-template-areas:'head'_'witzy'_'body'] lg:grid-cols-[52fr_48fr] lg:grid-rows-[1fr_1fr] lg:gap-x-10 lg:gap-y-0 lg:[grid-template-areas:'head_witzy'_'body_witzy']">
            <h1 className="font-serif text-[clamp(3rem,6vw,6.25rem)] leading-[1] tracking-[-0.02em] text-navy [grid-area:head] lg:self-end">
              <span className="block overflow-hidden pb-[0.08em]">
                <span data-line className="block">Every action,</span>
              </span>
              <span className="block overflow-hidden pb-[0.08em]">
                <span data-line className="block italic">on the record.</span>
              </span>
            </h1>

            {/* below lg: bubble beside Witzy. lg: this box is exactly Witzy's size, and the bubble floats over
                its transparent top-left corner and the column gap (bottom edge at 20% down, right edge at 34%
                across), clear of his face. Anchored at the bottom, longer lines grow upward. */}
            <div className="flex items-center gap-3 [grid-area:witzy] lg:relative lg:block lg:w-[min(64vh,600px)] lg:self-center lg:justify-self-end">
              <div className="min-w-0 flex-1 lg:absolute lg:right-[66%] lg:bottom-[80%] lg:z-10 lg:w-[280px]">
                <div className={`transition-opacity duration-500 ${started ? "opacity-100" : "invisible opacity-0"}`}>
                  <WitzyBubble text={say.text} tone={say.tone} tail="right-to-down-right" />
                  <div className="mt-2 flex items-center justify-between gap-3 px-1 lg:pr-12">
                    <button
                      type="button"
                      onClick={toggleSound}
                      aria-pressed={sound}
                      className={`shrink-0 font-mono text-[10px] whitespace-nowrap uppercase tracking-[0.14em] text-muted underline decoration-rule underline-offset-4 hover:text-navy ${canSpeak ? "" : "invisible"}`}
                    >
                      {sound ? "Sound on" : "Sound off"}
                    </button>
                    <div className="flex items-center" role="group" aria-label="Witzy's tips">
                      {TIPS.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setOverride(null);
                            setTip(i);
                          }}
                          aria-label={`Tip ${i + 1} of ${TIPS.length}`}
                          aria-current={!override && i === tip}
                          className="flex h-5 w-4 items-center justify-center"
                        >
                          <span className={`h-1.5 w-1.5 rounded-full transition-colors ${!override && i === tip ? "bg-navy" : "bg-navy/25"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Witzy's box is reserved up front, so nothing shifts when he appears */}
              <div
                ref={slot}
                className="relative aspect-square w-[46vw] max-w-[320px] shrink-0 sm:w-[min(60vw,320px)] lg:w-full lg:max-w-none"
              >
                <div ref={figure} className="absolute inset-0 opacity-0 motion-reduce:opacity-100">
                  <div ref={look} className="h-full w-full origin-bottom">
                    <div ref={idle} className="h-full w-full origin-bottom">
                      <button
                        ref={action}
                        type="button"
                        onClick={() => motion.current?.twirl(nextTip)}
                        aria-label="Witzy, the Callwitness mascot. Show the next tip."
                        className="relative block h-full w-full origin-bottom cursor-pointer rounded-full"
                      >
                        <Image
                          src="/brand/witzy-800.webp"
                          alt=""
                          width={800}
                          height={800}
                          priority
                          draggable={false}
                          className="pointer-events-none h-full w-full select-none"
                        />
                        {EYES.map((e, i) => (
                          <span
                            key={i}
                            data-lid
                            aria-hidden
                            className="pointer-events-none absolute rounded-[50%] bg-[#1B2440]"
                            // open by default; GSAP animates this same transform (a Tailwind scale-* class would set
                            // the separate `scale` property and keep the lid shut at zero height)
                            style={{
                              left: `${e.x - e.w / 2}%`,
                              top: `${e.y - e.h / 2}%`,
                              width: `${e.w}%`,
                              height: `${e.h}%`,
                              transform: "scaleY(0)",
                            }}
                          />
                        ))}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="[grid-area:body] lg:self-start lg:pt-6">
              <p data-fade className="max-w-[34rem] text-[16px] leading-relaxed text-ink/80 md:text-[17px]">
                Callwitness records every tool call your AI agent makes into a hash-chained ledger that nobody can
                quietly rewrite. When a customer, an auditor or a partner asks what happened, you hand them proof, not
                a claim.
              </p>

              <div data-fade className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#review"
                  className="group inline-flex items-center justify-between gap-6 bg-navy px-6 py-4 text-[15px] text-bone transition-colors hover:bg-navy-deep"
                >
                  Request an evidence review
                  <span className="text-gold transition-transform group-hover:translate-x-1" aria-hidden>
                    &rarr;
                  </span>
                </a>
                <button
                  type="button"
                  onClick={copyInstall}
                  className="inline-flex items-center justify-between gap-6 border border-rule bg-paper px-5 py-4 font-mono text-[13px] text-navy transition-colors hover:border-navy"
                  aria-label="Copy install command"
                >
                  <span>
                    <span className="text-muted">$</span> pip install callwitness
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                    {copied ? "Copied" : "Copy"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* scroll indicator */}
          <div data-fade className="hidden flex-col items-center gap-1.5 pb-2 lg:flex" aria-hidden>
            <span className="label">Scroll</span>
            <span className="relative h-6 w-px overflow-hidden bg-rule">
              <span className="cw-scroll-line absolute inset-0 bg-navy" />
            </span>
          </div>
        </div>
      </div>

      {/* facts strip */}
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <dl className="grid grid-cols-2 border-t border-rule md:grid-cols-4">
          {FACTS.map((f, i) => (
            <div
              key={f.k}
              className={`py-6 pr-6 ${i % 2 === 1 ? "pl-6 md:pl-6" : ""} ${i > 0 ? "md:border-l md:border-rule md:pl-6" : ""} ${i % 2 === 1 ? "border-l border-rule md:border-l" : ""} ${i > 1 ? "border-t border-rule md:border-t-0" : ""}`}
            >
              <dt className="label">{f.k}</dt>
              <dd className="mt-2 font-serif text-4xl text-navy tabular-nums">{f.v}</dd>
              <dd className="mt-1 font-mono text-[11px] text-muted">{f.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
