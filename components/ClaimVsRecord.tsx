"use client";

import { useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const CASES = [
  {
    n: "i.",
    title: "A customer dispute",
    body: "A partner blames your agent for what happened, and a CSV export is your word against theirs.",
  },
  {
    n: "ii.",
    title: "A compliance review",
    body: "An outside reviewer has to sign off, and “the engineers say nothing was edited” isn’t an answer.",
  },
  {
    n: "iii.",
    title: "An incident postmortem",
    body: "Agents fail softly and explain themselves confidently, so you need what they did, not what they said.",
  },
];

const RECORD: { k: string; v: React.ReactNode }[] = [
  { k: "tool", v: "refund_order" },
  {
    k: "args",
    v: (
      <>
        {"{ order: 1182, amount: "}
        <mark className="bg-fail px-1 text-bone">400.00</mark>
        {" }"}
      </>
    ),
  },
  { k: "response_sha256", v: "9f2c…" },
  { k: "recorded", v: "12:14:11.203" },
  { k: "chain", v: <span className="text-gold">linked</span> },
];

const clamp = (v: number) => Math.min(100, Math.max(0, v));

export default function ClaimVsRecord() {
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const pos = useRef(50);
  const dragging = useRef(false);
  const touchedRef = useRef(false);
  const hint = useRef<gsap.core.Tween | null>(null);
  const [touched, setTouched] = useState(false);

  // The divider position lives in a CSS variable so dragging never re-renders React.
  function apply(v: number) {
    pos.current = clamp(v);
    card.current?.style.setProperty("--pos", `${pos.current}%`);
    handle.current?.setAttribute("aria-valuenow", String(Math.round(pos.current)));
    handle.current?.setAttribute("aria-valuetext", `${Math.round(pos.current)}% of the agent's claim shown`);
  }

  function markTouched() {
    hint.current?.kill();
    if (touchedRef.current) return;
    touchedRef.current = true;
    setTouched(true);
  }

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Once, on first view: sweep the divider from 85% to 50% to show it can be dragged.
      apply(85);
      const state = { v: 85 };
      ScrollTrigger.create({
        trigger: card.current,
        start: "top 70%",
        once: true,
        onEnter: () => {
          if (touchedRef.current) return;
          hint.current = gsap.to(state, {
            v: 50,
            duration: 1.2,
            delay: 0.2,
            ease: "power2.out",
            onUpdate: () => apply(state.v),
          });
        },
      });
    },
    { scope: root }
  );

  function fromPointer(clientX: number) {
    const rect = card.current?.getBoundingClientRect();
    if (rect && rect.width) apply(((clientX - rect.left) / rect.width) * 100);
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    markTouched();
    // Touch waits for movement, so a vertical scroll that starts on the card doesn't jump the divider.
    if (e.pointerType === "mouse") fromPointer(e.clientX);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragging.current) fromPointer(e.clientX);
  }

  function endDrag() {
    dragging.current = false;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 2;
    const next: Record<string, number> = {
      ArrowLeft: pos.current - step,
      ArrowRight: pos.current + step,
      Home: 0,
      End: 100,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    markTouched();
    apply(next[e.key]);
  }

  return (
    <section data-witzy="claim" ref={root} className="relative">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="flex items-center justify-between border-b border-rule py-4">
          <span className="label">Exhibit 03 / The claim and the record</span>
        </div>

        <h2 className="max-w-[18ch] py-16 font-serif text-[clamp(2.25rem,5.5vw,4.75rem)] leading-[1.02] tracking-[-0.02em] text-navy md:py-24">
          An agent&rsquo;s account of what it did is a <em>claim</em>.
        </h2>

        <div className="mx-auto max-w-[1000px]">
          <p className="label mb-3">Illustration</p>

          <div
            ref={card}
            style={{ "--pos": "50%" } as CSSProperties}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="relative aspect-[3/4] cursor-ew-resize touch-pan-y overflow-hidden border border-rule select-none sm:aspect-[4/3] md:aspect-video"
          >
            {/* bottom layer: the record */}
            <div className="absolute inset-0 bg-[#18223B] text-bone">
              <span className="absolute top-4 right-4 font-mono text-[10px] uppercase tracking-[0.14em] text-bone/60 sm:top-5 sm:right-6 sm:text-[11px]">
                What Callwitness recorded
              </span>
              <div className="absolute inset-y-0 right-0 flex w-1/2 items-center px-4 sm:px-8 md:px-12">
                <dl className="grid w-full grid-cols-1 gap-x-5 gap-y-1 font-mono text-[11px] leading-relaxed tabular-nums sm:grid-cols-[auto_1fr] sm:gap-y-2 md:text-[13px]">
                  {RECORD.map(({ k, v }, i) => (
                    <div key={k} className="contents">
                      <dt className={`text-bone/50 ${i > 0 ? "mt-2 sm:mt-0" : ""}`}>{k}</dt>
                      <dd className="break-words">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* top layer: the claim, clipped to the left of the divider */}
            <div
              className="absolute inset-0 bg-bone"
              style={{ clipPath: "inset(0 calc(100% - var(--pos)) 0 0)" }}
            >
              <span className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:top-5 sm:left-6 sm:text-[11px]">
                What the agent said
              </span>
              <div className="absolute inset-y-0 left-0 flex w-1/2 items-center px-4 sm:px-8 md:px-12">
                <div>
                  <span className="label">Agent</span>
                  <p className="mt-2 rounded-2xl rounded-tl-sm bg-paper px-4 py-3 text-[14px] leading-snug text-ink sm:px-5 sm:py-4 md:text-[17px]">
                    Done! I&rsquo;ve refunded $40.00 to order #1182 and emailed the customer.
                  </p>
                </div>
              </div>
            </div>

            {/* divider */}
            <div className="pointer-events-none absolute inset-y-0 left-[var(--pos)] w-px -translate-x-1/2 bg-gold" />
            <div
              ref={handle}
              role="slider"
              tabIndex={0}
              aria-label="Compare the agent's claim with the record"
              aria-orientation="horizontal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={50}
              aria-valuetext="50% of the agent's claim shown"
              onKeyDown={onKeyDown}
              className="absolute top-1/2 left-[var(--pos)] flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold bg-[#18223B] text-[15px] text-bone"
            >
              <span aria-hidden>&harr;</span>
            </div>
            {!touched && (
              <span
                aria-hidden
                className="pointer-events-none absolute top-[calc(50%+30px)] left-[var(--pos)] -translate-x-1/2 bg-[#18223B] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-bone"
              >
                Drag
              </span>
            )}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 border-t border-rule pb-24 md:mt-20 md:grid-cols-3 md:pb-32">
          {CASES.map((c, i) => (
            <div
              key={c.n}
              className={`py-8 md:pr-8 ${i > 0 ? "border-t border-rule md:border-t-0 md:border-l md:pl-8" : ""}`}
            >
              <span className="font-mono text-[12px] text-muted">{c.n}</span>
              <h3 className="mt-3 font-serif text-2xl tracking-[-0.01em] text-navy">{c.title}</h3>
              <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-ink/80">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
