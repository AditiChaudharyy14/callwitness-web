"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import WitnessCanvas from "./WitnessCanvas";
import WitnessStatic from "./WitnessStatic";

const FACTS = [
  { k: "Added latency", v: "0.34 ms", note: "p50, small call" },
  { k: "Dependencies", v: "0", note: "pure Python" },
  { k: "Tests", v: "338", note: "v0.4.7" },
  { k: "Licence", v: "MIT", note: "open source" },
];

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLSpanElement>(null);
  const [copied, setCopied] = useState(false);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.from("[data-line]", { yPercent: 110, duration: 1.2, stagger: 0.12 })
        .from("[data-fade]", { autoAlpha: 0, y: 12, duration: 0.8, stagger: 0.08 }, "-=0.7");
    },
    { scope: root }
  );

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
      {/* the first screen (viewport minus the 72px nav and its 1px border); the Witness canvas sits behind it */}
      <div
        ref={stage}
        className="group/stage relative isolate flex min-h-[calc(100svh-73px)] flex-col md:min-h-[max(640px,calc(100svh-73px))]"
      >
        <WitnessCanvas stageRef={stage} slotRef={slot} />

        <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-6 md:px-10">
          {/* masthead strip */}
          <div data-fade className="flex items-center justify-between border-b border-rule py-4">
            <span className="label">Exhibit 01 / The record</span>
            <span className="label hidden sm:inline">Open source &middot; v0.4.7 &middot; Kathmandu</span>
          </div>

          <div className="flex flex-1 flex-col justify-center py-6 md:py-2">
            {/* mobile: both lines, then the mark. md+: the headline splits around the mark. */}
            <h1 className="flex flex-col text-center font-serif text-[clamp(2.5rem,5.2vw,5.5rem)] leading-[1] tracking-[-0.02em] text-navy md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8">
              <span className="block overflow-hidden pb-[0.08em] md:col-start-1 md:row-start-1 md:text-right">
                <span data-line className="block">Every action,</span>
              </span>
              <span className="block overflow-hidden pb-[0.08em] md:col-start-3 md:row-start-1 md:text-left">
                <span data-line className="block italic">on the record.</span>
              </span>
              <span
                ref={slot}
                aria-hidden
                className="relative mx-auto mt-5 block aspect-[410/322] w-[80vw] max-w-full md:col-start-2 md:row-start-1 md:mt-0 md:w-[min(60vh,560px,40vw)]"
              >
                <WitnessStatic />
              </span>
            </h1>

            <p data-fade className="mx-auto mt-6 max-w-[36rem] text-center text-[16px] leading-relaxed text-ink/80 md:mt-4 md:text-[17px]">
              Callwitness records every tool call your AI agent makes into a hash-chained ledger that nobody can
              quietly rewrite. When a customer, an auditor or a partner asks what happened, you hand them proof, not a
              claim.
            </p>

            <div data-fade className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:mt-4">
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

          {/* scroll indicator */}
          <div data-fade className="hidden flex-col items-center gap-1.5 pb-2 md:flex" aria-hidden>
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
