"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Ledger from "./Ledger";

const FACTS = [
  { k: "Added latency", v: "0.34 ms", note: "p50, small call" },
  { k: "Dependencies", v: "0", note: "pure Python" },
  { k: "Tests", v: "338", note: "v0.4.7" },
  { k: "Licence", v: "MIT", note: "open source" },
];

export default function Hero() {
  const root = useRef<HTMLElement>(null);
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
    <section ref={root} className="relative">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        {/* masthead strip */}
        <div data-fade className="flex items-center justify-between border-b border-rule py-4">
          <span className="label">Exhibit 01 / The record</span>
          <span className="label hidden sm:inline">Open source &middot; v0.4.7 &middot; Kathmandu</span>
        </div>

        <div className="grid grid-cols-1 gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          {/* left: statement */}
          <div className="lg:col-span-7">
            <h1 className="font-serif text-[clamp(3rem,8vw,7.25rem)] leading-[0.95] tracking-[-0.02em] text-navy">
              <span className="block overflow-hidden pb-[0.08em]">
                <span data-line className="block">Every action,</span>
              </span>
              <span className="block overflow-hidden pb-[0.08em]">
                <span data-line className="block italic">on the record.</span>
              </span>
            </h1>

            <p data-fade className="mt-8 max-w-[34rem] text-[17px] leading-relaxed text-ink/80 md:text-lg">
              Callwitness records every tool call your AI agent makes into a hash-chained ledger that
              nobody can quietly rewrite. When a customer, an auditor or a partner asks what happened,
              you hand them proof, not a claim.
            </p>

            <div data-fade className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
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
                className="inline-flex items-center justify-between gap-6 border border-rule px-5 py-4 font-mono text-[13px] text-navy transition-colors hover:border-navy"
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

          {/* right: live ledger */}
          <div data-fade className="lg:col-span-5 lg:pt-4">
            <Ledger />
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Fig. 1: Real records from <span className="normal-case">callwitness demo</span>
            </p>
          </div>
        </div>

        {/* facts strip */}
        <dl data-fade className="grid grid-cols-2 border-t border-rule md:grid-cols-4">
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
