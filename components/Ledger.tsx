"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Real records from `callwitness demo` (session a6fb8a70, 0.4.7).
const ROWS = [
  { n: "01", time: "12:14:11", tool: "echo", bytes: "65 B", ms: "9 ms", hash: "2b0a722cd6268335" },
  { n: "02", time: "12:14:11", tool: "get-annotated-message", bytes: "133 B", ms: "3 ms", hash: "642720fb7a44d957" },
  { n: "03", time: "12:14:11", tool: "get-resource-links", bytes: "617 B", ms: "206 ms", hash: "47718fa34e91d749" },
];
const HEAD = "b9bec89a4e7280958a4bbade7ab4ee51e3a282419439c524a20dfe0a946ad783";
const HEX = "0123456789abcdef";

function scramble(target: string, progress: number) {
  const settled = Math.floor(target.length * progress);
  let out = target.slice(0, settled);
  for (let i = settled; i < target.length; i++) out += HEX[(Math.random() * 16) | 0];
  return out;
}

export default function Ledger() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return; // Final state is already rendered in the markup.

      const rows = gsap.utils.toArray<HTMLElement>("[data-row]");
      const tl = gsap.timeline({ delay: 0.9 });

      gsap.set(rows, { autoAlpha: 0, y: 8 });
      gsap.set("[data-check]", { autoAlpha: 0 });
      gsap.set("[data-head]", { autoAlpha: 0 });

      rows.forEach((row, i) => {
        const hashEl = row.querySelector<HTMLElement>("[data-hash]")!;
        const target = ROWS[i].hash;
        const state = { p: 0 };
        tl.to(row, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" })
          .to(
            state,
            {
              p: 1,
              duration: 0.9,
              ease: "power1.inOut",
              onUpdate: () => {
                hashEl.textContent = scramble(target, state.p);
              },
            },
            "<0.1"
          )
          .to(row.querySelector("[data-check]"), { autoAlpha: 1, duration: 0.3 }, ">-0.05");
      });

      tl.to("[data-head]", { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, "+=0.2");
    },
    { scope: root }
  );

  return (
    <div ref={root} className="border border-rule bg-bone">
      {/* header */}
      <div className="flex items-center justify-between border-b border-rule px-5 py-3">
        <span className="label">Ledger &middot; a6fb8a70</span>
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
          </span>
          Recording
        </span>
      </div>

      {/* column heads */}
      <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 border-b border-rule px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:grid-cols-[2rem_4.5rem_1fr_auto]">
        <span>#</span>
        <span className="hidden sm:block">Time</span>
        <span>Tool call &middot; response hash</span>
        <span className="text-right">Chain</span>
      </div>

      {/* rows */}
      <ol>
        {ROWS.map((r) => (
          <li
            key={r.n}
            data-row
            className="grid grid-cols-[2rem_1fr_auto] items-start gap-x-4 border-b border-rule px-5 py-4 font-mono text-[12px] tabular-nums text-ink transition-colors last:border-b-0 hover:bg-paper/50 sm:grid-cols-[2rem_4.5rem_1fr_auto]"
          >
            <span className="text-muted">{r.n}</span>
            <span className="hidden text-muted sm:block">{r.time}</span>
            <span className="min-w-0">
              <span className="block truncate text-navy">{r.tool}</span>
              <span className="mt-1 block text-[11px] text-muted">
                sha256 <span data-hash className="text-ink">{r.hash}</span>&hellip;
              </span>
              <span className="mt-0.5 block text-[11px] text-muted">
                {r.bytes} &middot; {r.ms}
              </span>
            </span>
            <span data-check className="text-right text-[11px] uppercase tracking-[0.14em] text-gold-deep">
              &#10003; Linked
            </span>
          </li>
        ))}
      </ol>

      {/* head hash */}
      <div data-head className="border-t border-navy/40 bg-navy px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/60">Head hash</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-gold">Chain intact &middot; 6/6</span>
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-bone/90">
          {HEAD.slice(0, 32)}
          <br />
          {HEAD.slice(32)}
        </p>
      </div>
    </div>
  );
}
