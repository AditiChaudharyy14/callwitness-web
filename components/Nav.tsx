"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { LogoMark, Wordmark } from "./Logo";

const links = [
  { href: "#mechanism", label: "Mechanism", n: "03" },
  { href: "#evidence", label: "Evidence", n: "04" },
  { href: "#review", label: "Review", n: "06" },
  { href: "#limits", label: "Limits", n: "07" },
];

const GITHUB = "https://github.com/AditiChaudharyy14/callwitness";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const lenis = useLenis();

  // Lock page scroll while the mobile menu is open; close on Escape.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, lenis]);

  const close = () => setOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#18223B]">
        <nav className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 md:px-10">
          <Link href="/" onClick={close} className="flex items-center gap-3 text-[#E3D2BC]" aria-label="Callwitness home">
            <LogoMark className="h-8 w-auto" dotColor="#CFAD6E" />
            <Wordmark className="h-[12px] w-auto" />
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="group relative font-mono text-[11px] uppercase tracking-[0.14em] text-[#E3D2BC]/75 transition-colors hover:text-[#E3D2BC]"
                >
                  {l.label}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-5">
            <a
              href={GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-[#E3D2BC]/75 transition-colors hover:text-[#E3D2BC] lg:inline"
            >
              GitHub <span aria-hidden>&#8599;</span>
            </a>
            <a
              href="#review"
              className="hidden border border-[#E3D2BC]/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#E3D2BC] transition-colors hover:bg-[#E3D2BC] hover:text-[#18223B] sm:inline-block"
            >
              Request a review
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <span className={`h-px w-5 bg-[#E3D2BC] transition-transform duration-300 ${open ? "translate-y-[3px] rotate-45" : ""}`} />
              <span className={`h-px w-5 bg-[#E3D2BC] transition-transform duration-300 ${open ? "-translate-y-[3px] -rotate-45" : ""}`} />
            </button>
          </div>
        </nav>
      </header>

      {/* mobile menu: outside the header, because backdrop-blur traps fixed children */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto bg-[#18223B] transition-opacity duration-300 md:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ul className="px-6 pt-6">
          {links.map((l) => (
            <li key={l.href} className="border-b border-white/10">
              <a href={l.href} onClick={close} className="flex items-baseline justify-between py-5">
                <span className="font-serif text-3xl tracking-[-0.01em] text-[#E3D2BC]">{l.label}</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] tabular-nums text-[#E3D2BC]/50">{l.n}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 px-6 pt-8 pb-10">
          <a
            href="#review"
            onClick={close}
            className="flex items-center justify-between bg-[#E3D2BC] px-5 py-4 text-[#18223B]"
          >
            Request an evidence review <span className="text-[#9E8340]" aria-hidden>&rarr;</span>
          </a>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="flex items-center justify-between border border-white/15 px-5 py-4 font-mono text-[13px] text-[#E3D2BC]"
          >
            GitHub <span aria-hidden>&#8599;</span>
          </a>
        </div>
      </div>
    </>
  );
}
