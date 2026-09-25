"use client";

import { useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { sha256Hex } from "@/lib/sha256";

// Illustrative session. Each record's hash is SHA-256(prev + tool + content).
const RECORDS = [
  { tool: "search_orders", content: 'query: "order 1182"' },
  { tool: "get_order", content: "order: 1182, total: $40.00" },
  { tool: "refund_order", content: "order: 1182, amount: $40.00" },
  { tool: "send_email", content: 'to: customer, "Refund of $40 issued"' },
  { tool: "update_ticket", content: "ticket: 5521, status: resolved" },
];
const GENESIS = "0".repeat(64);
// Precomputed with the same formula so the first paint needs no async work. Edits are hashed live.
const ORIGINAL = [
  "a3c0ccab76d3c849ed80699ad432e7c8cf3e7892434ad9ab4ef61223e4089a92",
  "b53419f3cbb3a5d2948d2c5e0dd6e9323c6cf3a9edb971b1817d0b98f4048c60",
  "c9e3ac9e1a51596f65ffa698d08da82dbc309d21d2699442a05d5d462ddf71a3",
  "73831b15b2dd0c6897eaecb3d173008cd40e83270e6388fff7b7451a870bf3c4",
  "4f64d1a3e5c44cc6a68c858d1cf2b2537a53603868379969d2828ffabd734553",
];
// What each record stores as "prev": the previous record's hash as originally written.
const PREV = [GENESIS, ...ORIGINAL.slice(0, -1)];
const HEAD = ORIGINAL[ORIGINAL.length - 1];
const LAST = RECORDS.length - 1;
const HEX = "0123456789abcdef";

const short = (h: string) => h.slice(0, 12);
const num = (i: number) => String(i + 1).padStart(2, "0");
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Chain segments pull apart over 0.35s with power2.out (easeOutQuad).
const SEGMENT =
  "absolute left-[20px] h-1/2 w-px transition-[translate,background-color] duration-[350ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]";

function scramble(target: string, progress: number) {
  const settled = Math.floor(target.length * progress);
  let out = target.slice(0, settled);
  for (let i = settled; i < target.length; i++) out += HEX[(Math.random() * 16) | 0];
  return out;
}

function Seal({ broken }: { broken: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 100 100" className={`h-full w-full ${broken ? "text-fail" : "text-gold"}`}>
      <defs>
        <path id={id} d="M 50 50 m -34 0 a 34 34 0 1 1 68 0 a 34 34 0 1 1 -68 0" />
      </defs>
      <circle cx="50" cy="50" r="48" className="fill-paper" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="44.5" fill="none" stroke="currentColor" strokeWidth="0.75" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" strokeWidth="0.75" />
      {/* Smaller glyphs within the same textLength = wider letter-spacing around the ring. */}
      <text fill="currentColor" fontSize="9.6" style={{ fontFamily: "var(--font-mono)" }}>
        <textPath href={`#${id}`} textLength="212" lengthAdjust="spacing">
          {broken ? "TAMPERED · CALLWITNESS · " : "VERIFIED · CALLWITNESS · "}
        </textPath>
      </text>
      <path
        d={broken ? "M43 43 L57 57 M57 43 L43 57" : "M41 50.5 L47.5 57 L60 43.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
      />
    </svg>
  );
}

export default function Ledger() {
  const root = useRef<HTMLDivElement>(null);
  const seal = useRef<HTMLDivElement>(null);
  const intro = useRef<gsap.core.Timeline | null>(null);
  const tweens = useRef<(gsap.core.Tween | undefined)[]>([]);
  const seq = useRef(RECORDS.map(() => 0));
  const cancelEdit = useRef(false);

  const [contents, setContents] = useState(() => RECORDS.map((r) => r.content));
  const [hashes, setHashes] = useState(ORIGINAL);
  const [shown, setShown] = useState(() => ORIGINAL.map(short));
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const setShownAt = (i: number, v: string) => setShown((s) => s.map((x, j) => (j === i ? v : x)));

  useGSAP(
    () => {
      const killEdits = () => tweens.current.forEach((t) => t?.kill());
      if (reducedMotion()) return killEdits; // Final state is already rendered in the markup.

      const rows = gsap.utils.toArray<HTMLElement>("[data-row]");
      const tl = gsap.timeline({ delay: 0.9 });
      intro.current = tl;

      gsap.set(rows, { autoAlpha: 0, y: 8 });
      gsap.set("[data-check]", { autoAlpha: 0 });
      gsap.set("[data-head]", { autoAlpha: 0 });
      gsap.set("[data-seal]", { autoAlpha: 0 });

      rows.forEach((row, i) => {
        const target = short(ORIGINAL[i]);
        const state = { p: 0 };
        const at = i * 0.35;
        tl.to(row, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, at)
          .to(
            state,
            {
              p: 1,
              duration: 0.7,
              ease: "power1.inOut",
              onUpdate: () => setShownAt(i, scramble(target, state.p)),
            },
            at + 0.1
          )
          .to(row.querySelector("[data-check]"), { autoAlpha: 1, duration: 0.3 }, at + 0.75);
      });

      // clearProps leaves the head bar fully opaque once revealed.
      tl.to("[data-head]", { autoAlpha: 1, duration: 0.6, ease: "power2.out", clearProps: "opacity,visibility" }, "+=0.2")
        // The seal is stamped once the whole chain has been checked.
        .fromTo(
          "[data-seal]",
          { autoAlpha: 0, scale: 1.25, rotation: -14 },
          { autoAlpha: 1, scale: 1, rotation: -8, duration: 0.3, ease: "back.out", clearProps: "opacity,visibility" },
          "-=0.2"
        );
      return killEdits;
    },
    { scope: root }
  );

  // Show the recomputed hash settling in, then commit it (which updates the chain state).
  function reveal(i: number, hash: string) {
    tweens.current[i]?.kill();
    const done = () => {
      setShownAt(i, short(hash));
      setHashes((h) => h.map((x, j) => (j === i ? hash : x)));
    };
    if (reducedMotion()) return done();
    const state = { p: 0 };
    tweens.current[i] = gsap.to(state, {
      p: 1,
      duration: 0.6,
      ease: "power1.inOut",
      onUpdate: () => setShownAt(i, scramble(short(hash), state.p)),
      onComplete: done,
    });
  }

  function startEdit(i: number) {
    intro.current?.progress(1);
    cancelEdit.current = false;
    setDraft(contents[i]);
    setEditing(i);
  }

  async function commit(i: number, value: string) {
    setEditing(null);
    if (value === contents[i]) return;
    const id = ++seq.current[i];
    setContents((c) => c.map((x, j) => (j === i ? value : x)));
    const hash = await sha256Hex(PREV[i] + RECORDS[i].tool + value);
    if (id === seq.current[i]) reveal(i, hash);
  }

  function reset() {
    seq.current = seq.current.map((n) => n + 1);
    tweens.current.forEach((t) => t?.kill());
    setContents(RECORDS.map((r) => r.content));
    setHashes(ORIGINAL);
    setShown(ORIGINAL.map(short));
    setEditing(null);
  }

  const firstBad = hashes.findIndex((h, i) => h !== ORIGINAL[i]);
  const intact = firstBad === -1;
  const dirty = !intact || contents.some((c, i) => c !== RECORDS[i].content);
  // The link after record k: the next record's stored prev, or (after the last record) the saved head hash.
  const linkAfterBroken = (k: number) => (k === LAST ? hashes[LAST] !== HEAD : PREV[k + 1] !== hashes[k]);

  // Stamp the seal when the chain breaks. Reset swaps it back without a stamp.
  useEffect(() => {
    if (intact || !seal.current || reducedMotion()) return;
    const t = gsap.fromTo(
      seal.current,
      { scale: 1.25, rotation: -14 },
      { scale: 1, rotation: -8, duration: 0.3, ease: "back.out" }
    );
    return () => {
      t.progress(1).kill();
    };
  }, [intact]);

  const status = intact
    ? `Chain intact · ${RECORDS.length}/${RECORDS.length}`
    : firstBad === LAST
      ? `Head hash mismatch · record ${num(LAST)}`
      : `Chain broken at record ${num(firstBad)}`;

  const caption =
    firstBad === LAST
      ? `The edit changed the hash. No record comes after ${num(LAST)}, so only a copy of the head hash kept somewhere else catches this. External anchoring is next.`
      : "The edit changed the hash. Every later record still points to the old one. That's how callwitness verify catches it.";

  return (
    <div ref={root} className="relative mr-2 mb-2">
      {/* the sheet underneath: the ledger reads as the top document on a stack */}
      <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-2 border border-rule bg-[#EFE6D6]" />

      {/* notary seal, overlapping the top-right corner */}
      <div
        ref={seal}
        data-seal
        aria-hidden
        style={{ transform: "rotate(-8deg)" }}
        className="pointer-events-none absolute -top-8 -right-5 z-10 h-[84px] w-[84px] max-[380px]:hidden sm:-right-8 sm:h-24 sm:w-24"
      >
        <Seal broken={!intact} />
      </div>

      <div className="relative border border-rule bg-bone">
        {/* header */}
        <div className="flex items-center justify-between border-b border-rule px-4 py-3 sm:px-5">
          <span className="label">
            Ledger &middot; example<span className="max-sm:hidden"> session</span>
          </span>
          <span className="mr-12 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted max-[380px]:mr-0 sm:mr-14">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
            Recording
          </span>
        </div>

        {/* hint */}
        <div className="flex items-center justify-between gap-4 border-b border-rule px-4 py-2 font-mono text-[11px] text-muted sm:px-5">
          <span>Try it: click a record and change it.</span>
          {dirty && (
            <button
              type="button"
              onClick={reset}
              className="uppercase tracking-[0.14em] text-navy underline sm:mr-8 decoration-rule underline-offset-4 hover:decoration-navy"
            >
              Reset
            </button>
          )}
        </div>

        {/* column heads */}
        <div className="grid grid-cols-[1.5rem_1fr_auto] gap-x-3 border-b border-rule py-2 pr-4 pl-10 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:pr-5">
          <span>#</span>
          <span className="max-sm:hidden">Tool call &middot; content &middot; hash</span>
          <span className="sm:hidden">Record</span>
          <span className="text-right">Chain</span>
        </div>

        {/* rows, threaded on the chain */}
        <ol>
          {RECORDS.map((r, i) => {
            const modified = hashes[i] !== ORIGINAL[i];
            const linkBroken = i > 0 && linkAfterBroken(i - 1);
            const nextBroken = linkAfterBroken(i);
            const nodeFail = !intact && i > firstBad;
            return (
              <li
                key={r.tool}
                data-row
                className={`relative grid grid-cols-[1.5rem_1fr] gap-x-3 border-b border-rule py-2.5 pr-4 pl-10 font-mono tabular-nums transition-colors last:border-b-0 sm:pr-5 ${
                  modified ? "bg-fail/6" : "hover:bg-paper/50"
                }`}
              >
                {/* chain: upper half joins the previous record, lower half the next (or the head) */}
                <span aria-hidden className={`${SEGMENT} top-0 ${linkBroken ? "translate-y-[3px] bg-fail" : "bg-gold"}`} />
                <span aria-hidden className={`${SEGMENT} top-1/2 ${nextBroken ? "-translate-y-[3px] bg-fail" : "bg-gold"}`} />
                <span
                  aria-hidden
                  className={`absolute top-1/2 left-[20.5px] h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-[350ms] ${
                    nodeFail ? "bg-fail" : "bg-gold"
                  }`}
                />

                <span className="text-[12px] leading-[18px] text-muted">{num(i)}</span>
                <span className="min-w-0">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[13px] leading-[18px] text-navy">{r.tool}</span>
                    <span
                      data-check
                      className={`shrink-0 text-[11px] leading-[18px] uppercase tracking-[0.14em] ${linkBroken ? "text-fail" : "text-gold-deep"}`}
                    >
                      {linkBroken ? <>&#10005; Broken</> : <>&#10003; Linked</>}
                    </span>
                  </span>
                  {editing === i ? (
                    <input
                      autoFocus
                      value={draft}
                      maxLength={80}
                      spellCheck={false}
                      autoComplete="off"
                      aria-label={`Content of record ${num(i)}`}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") {
                          cancelEdit.current = true;
                          e.currentTarget.blur();
                        }
                      }}
                      onBlur={() => {
                        if (cancelEdit.current) setEditing(null);
                        else commit(i, draft);
                      }}
                      className="mt-0.5 block w-full border-b border-navy bg-paper/60 px-1 font-mono text-[16px] leading-[18px] text-ink pointer-fine:text-[12px]"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(i)}
                      aria-label={`Edit record ${num(i)}: ${contents[i]}`}
                      className="mt-0.5 block max-w-full text-left text-[12px] leading-[18px] break-words text-ink underline decoration-transparent decoration-dotted decoration-1 underline-offset-4 transition-colors hover:decoration-navy/40 pointer-coarse:decoration-navy/40"
                    >
                      {contents[i]}
                    </button>
                  )}
                  <span className="mt-0.5 block text-[11px] leading-4 text-muted">
                    <span className={modified ? "text-fail" : undefined}>{shown[i]}</span>
                    {" "}&larr;{" "}
                    <span className={linkBroken ? "text-fail" : undefined}>{short(PREV[i])}</span>
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        {/* head hash */}
        <div
          data-head
          className={`px-4 py-4 transition-colors duration-500 sm:px-5 ${intact ? "bg-[#18223B]" : "bg-fail"}`}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/60">Head hash</span>
            <span
              role="status"
              className={`text-right font-mono text-[10px] uppercase tracking-[0.14em] ${intact ? "text-gold" : "text-bone"}`}
            >
              {status}
            </span>
          </div>
          <p className="mt-2 font-mono text-[11px] leading-relaxed break-all text-bone/90">{HEAD}</p>
        </div>

        {!intact && (
          <p className="border-t border-rule px-4 py-3 font-mono text-[11px] leading-relaxed text-fail sm:px-5">{caption}</p>
        )}
      </div>
    </div>
  );
}
