"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const NODES = [
  { kind: "Client", name: "AI agent", proxy: false },
  { kind: "Proxy", name: "Callwitness", proxy: true },
  { kind: "Tools", name: "MCP server", proxy: false },
];

const STEPS = [
  {
    title: "Record",
    body: "Wrap your MCP servers once. Every tool call and response is written to a local SQLite log, hash-chained, with secrets redacted from stored previews.",
    cmd: "pip install callwitness",
  },
  {
    title: "Verify",
    body: "Walks each session's chain and reports any record that was edited, removed, reordered or inserted. Prints each session's head hash so you can keep a copy elsewhere.",
    cmd: "callwitness verify",
  },
  {
    title: "Prove",
    body: "Writes a one-page HTML evidence report: the verdict, the head hash, and every call with its response hash, timing and destination. No arguments or contents. Nothing is sent anywhere.",
    cmd: "callwitness report",
  },
];

export default function Mechanism() {
  const root = useRef<HTMLElement>(null);
  const flow = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Run the travelling dot only while the diagram is on screen.
      ScrollTrigger.create({
        trigger: flow.current,
        start: "top bottom",
        end: "bottom top",
        toggleClass: { targets: flow.current, className: "cw-running" },
      });
    },
    { scope: root }
  );

  return (
    <section data-witzy="mechanism" id="mechanism" ref={root} className="scroll-mt-[72px] bg-[#18223B] text-bone">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="flex items-center justify-between border-b border-bone/15 py-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/60">Exhibit 04 / Mechanism</span>
        </div>

        <div className="grid grid-cols-1 gap-10 py-16 md:py-24 lg:grid-cols-12">
          <h2 className="font-serif text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.02em] lg:col-span-7">
            It sits between your agent and its tools. <em>It changes nothing.</em>
          </h2>
          <p className="max-w-[36rem] text-[17px] leading-relaxed text-bone/75 lg:col-span-5 lg:pt-3">
            Callwitness is a small proxy for MCP servers. It forwards every byte in both directions and blocks
            nothing, so your agent behaves exactly as before. It only writes things down: every call goes into a
            local log, each record carrying the hash of the one before it and a SHA-256 of the full response.
          </p>
        </div>

        {/* flow diagram */}
        <div ref={flow} className="relative flex flex-col items-stretch md:flex-row md:items-center">
          {/* track for the travelling dot; the opaque boxes hide it as it passes behind them */}
          <div className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 overflow-hidden md:inset-x-0 md:inset-y-auto md:top-1/2 md:left-0 md:h-2 md:w-auto md:translate-x-0 md:-translate-y-1/2" aria-hidden>
            <div className="cw-travel absolute inset-0">
              <span className="absolute top-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold md:top-1/2 md:left-0" />
            </div>
          </div>

          {NODES.map((node, i) => (
            <div key={node.name} className="contents">
              {i > 0 && <div className="mx-auto h-10 w-px bg-bone/20 md:mx-0 md:h-px md:w-auto md:flex-1" aria-hidden />}
              <div
                className={`relative z-10 border bg-[#18223B] px-6 py-5 md:min-w-[12rem] ${
                  node.proxy ? "border-gold" : "border-bone/20"
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/50">{node.kind}</span>
                <span className="mt-1 block font-serif text-2xl">{node.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 border-t border-bone/15 pb-24 md:mt-24 md:grid-cols-3 md:pb-32">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className={`py-8 md:pr-8 ${i > 0 ? "border-t border-bone/15 md:border-t-0 md:border-l md:pl-8" : ""}`}
            >
              <span className="font-mono text-[11px] tabular-nums text-bone/50">0{i + 1}</span>
              <h3 className="mt-3 font-serif text-2xl tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-bone/75">{s.body}</p>
              <code className="mt-5 inline-block max-w-full bg-[#0F1729] px-3 py-2 font-mono text-[13px] break-all text-bone">
                <span className="text-bone/40">$ </span>
                {s.cmd}
              </code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
