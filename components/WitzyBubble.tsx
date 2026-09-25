"use client";

import { useEffect, useState } from "react";

const CHARS_PER_SECOND = 28;

// right-to-down-right: pointing right below lg; from lg, pointing down from the bubble's right end
type Tail = "down" | "right" | "right-to-down-right";

// Witzy's speech bubble. The line types in; screen readers get the whole line once via aria-live.
export default function WitzyBubble({
  text,
  tone = "normal",
  tail,
  size = "lg",
  className = "",
}: {
  text: string;
  tone?: "normal" | "fail";
  tail: Tail;
  size?: "lg" | "sm";
  className?: string;
}) {
  const border = tone === "fail" ? "border-fail" : "border-navy/15";
  const tailBase = `absolute h-3 w-3 rotate-45 bg-bone ${border}`;
  const down = `${tailBase} -bottom-[7px] left-1/2 -translate-x-1/2 border-r border-b`;
  const right = `${tailBase} top-1/2 -right-[7px] -translate-y-1/2 border-t border-r`;

  return (
    <div className={`relative rounded-2xl border bg-bone text-navy transition-colors ${border} ${size === "lg" ? "px-4 py-3" : "px-3 py-2"} ${className}`}>
      <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Witzy</span>
      <p aria-hidden className={size === "lg" ? "mt-1 text-[15px] leading-snug" : "mt-0.5 text-[13px] leading-snug"}>
        <Typed key={text} text={text} />
      </p>
      <span className="sr-only" aria-live="polite">
        {text}
      </span>
      {tail === "down" && <span aria-hidden className={down} />}
      {tail === "right" && <span aria-hidden className={right} />}
      {tail === "right-to-down-right" && (
        <>
          <span aria-hidden className={`${right} lg:hidden`} />
          <span aria-hidden className={`${tailBase} -bottom-[7px] right-6 hidden border-r border-b lg:block`} />
        </>
      )}
    </div>
  );
}

// Types the line in. The untyped rest is rendered invisibly so the bubble never changes size mid-line.
function Typed({ text }: { text: string }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let count = 0;
    let timer = 0;
    const step = () => {
      count = instant ? text.length : count + 1;
      setShown(count);
      if (count < text.length) timer = window.setTimeout(step, 1000 / CHARS_PER_SECOND);
    };
    timer = window.setTimeout(step, instant ? 0 : 1000 / CHARS_PER_SECOND);
    return () => window.clearTimeout(timer);
  }, [text]);

  return (
    <>
      {text.slice(0, shown)}
      <span className="invisible">{text.slice(shown)}</span>
    </>
  );
}
