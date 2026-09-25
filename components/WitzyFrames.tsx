"use client";

import Image from "next/image";
import { useWitzyFrame, type Frame } from "@/lib/witzy-voice";

const FRAMES: Frame[] = ["closed", "half", "open", "wave"];

// All four frames stacked in one box and loaded up front; the current one is shown by an instant
// opacity swap, so the mouth can change many times a second without flicker or reloads.
// The parent must be `relative` and sized.
export default function WitzyFrames({ size }: { size: 800 | 400 }) {
  const frame = useWitzyFrame();
  return (
    <>
      {FRAMES.map((f) => (
        <Image
          key={f}
          src={`/brand/witzy/witzy-${f}-${size}.webp`}
          alt=""
          width={size}
          height={size}
          priority={size === 800}
          loading={size === 800 ? undefined : "eager"}
          draggable={false}
          className={`pointer-events-none absolute inset-0 h-full w-full select-none ${f === frame ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </>
  );
}
