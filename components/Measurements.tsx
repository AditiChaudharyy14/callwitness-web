"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

// Callwitness 0.4.7, direct vs proxied, local stub server. p50 added latency.
const LATENCY = [
  { size: "~200 B", ms: 0.34, decimals: 2 },
  { size: "20 KB", ms: 1.8, decimals: 1 },
  { size: "500 KB", ms: 14, decimals: 0 },
];

// Renders the final value; on first view (motion allowed) it counts up from zero.
function Count({ value, decimals }: { value: number; decimals: number }) {
  return (
    <span data-count={value} data-decimals={decimals}>
      {value.toFixed(decimals)}
    </span>
  );
}

export default function Measurements() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const target = Number(el.dataset.count);
        const decimals = Number(el.dataset.decimals);
        if (!target) return;
        const state = { v: 0 };
        const render = () => (el.textContent = state.v.toFixed(decimals));
        render();
        gsap.to(state, {
          v: target,
          duration: 1.2,
          ease: "expo.out",
          onUpdate: render,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });
    },
    { scope: root }
  );

  return (
    <section data-witzy="measurements" ref={root} className="bg-bone">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="flex items-center justify-between border-b border-rule py-4">
          <span className="label">Exhibit 06 / Measured, not promised</span>
        </div>

        <div className="grid grid-cols-1 gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          <h2 className="font-serif text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.02em] text-navy lg:col-span-5">
            Built to stay out of the way.
          </h2>

          <div className="lg:col-span-7">
            <table className="w-full font-mono tabular-nums">
              <thead>
                <tr className="border-b border-navy/40 text-left text-[10px] uppercase tracking-[0.14em] text-muted">
                  <th scope="col" className="py-2 font-normal">Response size</th>
                  <th scope="col" className="py-2 text-right font-normal">Added latency (p50)</th>
                </tr>
              </thead>
              <tbody>
                {LATENCY.map((r) => (
                  <tr key={r.size} className="border-b border-rule text-[15px] transition-colors hover:bg-paper/40">
                    <td className="py-3 text-ink">{r.size}</td>
                    <td className="py-3 text-right text-navy">
                      <Count value={r.ms} decimals={r.decimals} /> ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Callwitness 0.4.7, direct vs proxied, local stub server.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
