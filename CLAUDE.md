@AGENTS.md

# callwitness.tech: design and build rules

Marketing site for Callwitness: verifiable records of AI agent tool interactions.
Stack: Next.js (App Router, TypeScript), Tailwind CSS v4, GSAP (+ ScrollTrigger, @gsap/react), Lenis.
Deploy: Vercel, custom domain callwitness.tech.

## Art direction: "the case file"
Apple's restraint + Bloomberg's information density + an editorial magazine + forensic technology.
The page reads like a dossier: numbered exhibits (01, 02...), hairline rules, monospace evidence, a serif voice.
It must NOT look like a generic AI-startup landing page.

## Colour: strict proportions
- Warm Beige  #E8DCC8  (`bg-paper`)  ~60%. The identity, and the default canvas.
- Navy        #1F2A44  (`bg-navy`)   ~25%. Heavy blocks only (mechanism section, offer, footer). Never the whole page.
- Near-white  #F6F1E7  (`bg-bone`) and Ink #12151C (`text-ink`)  ~10%
- Soft Gold   #C6A75E  (`gold`)      ~5%. The SIGNAL. Use only for: verified states, the live/current hash, a single primary CTA, focus rings.
- Never use gold for body text on beige (fails contrast). Gold text is fine on navy or ink.
- Hairlines: `border-rule` (navy at ~18% opacity). Prefer 1px rules over boxes and shadows.

## Type
- Display and headlines: Newsreader (`font-serif`), tight tracking, large sizes, sentence case.
- Body and UI: Geist Sans (`font-sans`).
- Data, hashes, code, labels: Geist Mono (`font-mono`) with `tabular-nums`.
- Section labels: mono, uppercase, 11-12px, letter-spacing 0.14em, e.g. "EXHIBIT 03 / MECHANISM".

## Banned (these make it look AI-generated)
- Gradients, glows, blurred blobs, glassmorphism, neon, purple.
- Emoji, sparkle icons, generic icon grids of three cards with icons.
- Words: "revolutionary", "seamless", "unlock", "supercharge", "cutting-edge", "AI-powered".
- Stock 3D shapes. No Three.js unless a specific, approved idea needs it.
- Fake testimonials, fake logos, invented numbers. Every number on the site must be real.

## Motion (GSAP + Lenis)
- Purposeful and slow: ease "power2.out" or "expo.out", 0.6-1.2s. Nothing bounces.
- Motion reveals information (a hash computing, a chain linking, a record failing verification). It is never decoration.
- Respect `prefers-reduced-motion`: show the final state and skip the animation.
- Always use `useGSAP` with a scope ref so animations clean up.

## Layout
- 12-column grid, max width 1280px, generous margins (px-6 mobile, px-10 desktop).
- Bloomberg density in data areas: small mono type and tight rows. Editorial calm everywhere else: big serif, lots of space.
- Mobile first. No horizontal scroll at 360px.

## Copy (facts only: do not invent)
- Tagline: "Verifiable records of AI agent tool interactions."
- What it is: an open-source MCP proxy that forwards every byte, blocks nothing, and hash-chains every tool call.
- Commands: `pip install callwitness`, `callwitness demo`, `callwitness verify`, `callwitness report`.
- Real numbers (0.4.7, local stub server, p50 added latency): ~200 B 0.34 ms Â· 20 KB 1.8 ms Â· 500 KB 14 ms. 338 tests. Zero runtime dependencies. MIT.
- Honest limits: MCP only; chains are per session (deleting a whole session isn't caught unless the head hash was kept elsewhere; external anchoring is next); under extreme bursts a few percent of records can drop, and the report says so; it records, it doesn't block.
- Contact: callwitness.dev@gmail.com. GitHub: https://github.com/AditiChaudharyy14/callwitness
