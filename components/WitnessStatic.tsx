"use client";

import { LogoMark } from "./Logo";
import { useChainBroken } from "@/lib/chain";

// The Witness without particles: shown for reduced motion or when canvas is unavailable
// (the stage's data-witness="static"). Hidden otherwise, so it never flashes before the particles.
export default function WitnessStatic() {
  const broken = useChainBroken();
  return (
    <LogoMark
      className="h-full w-full text-navy opacity-0 motion-reduce:opacity-100 group-data-[witness=static]/stage:opacity-100"
      dotColor={broken ? "#9B3B2E" : "var(--color-gold)"}
    />
  );
}
