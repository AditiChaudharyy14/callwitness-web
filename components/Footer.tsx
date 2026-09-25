import Image from "next/image";
import Reveal from "./Reveal";

const LINK = "transition-colors hover:text-bone";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "GitHub", href: "https://github.com/AditiChaudharyy14/callwitness", external: true },
      { label: "PyPI", href: "https://pypi.org/project/callwitness/", external: true },
      { label: "Evidence report", href: "#evidence" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Evidence review", href: "#review" },
      { label: "Contact", href: "mailto:callwitness.dev@gmail.com" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#18223B] text-[#E3D2BC]">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="flex flex-col gap-8 border-b border-bone/15 py-16 md:flex-row md:items-end md:justify-between md:py-20">
          <p className="font-serif text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.02em]">
            Every action,
            <br />
            <em>on the record.</em>
          </p>
          <a href="#review" className="self-start border-b border-gold pb-1 text-[15px] transition-colors hover:text-bone md:self-auto">
            Request an evidence review <span aria-hidden>&rarr;</span>
          </a>
        </div>

        {/* the original logo artwork, unchanged; the crop hides a faint line along its bottom edge */}
        <Reveal className="flex justify-center py-20 md:py-28">
          <div className="aspect-[1008/660] w-full max-w-[260px] overflow-hidden md:max-w-[520px]">
            <Image
              src="/brand/callwitness-logo.jpg"
              alt="Callwitness"
              width={1008}
              height={678}
              className="h-full w-full object-cover object-top"
            />
          </div>
        </Reveal>

        <div className="grid grid-cols-2 border-t border-bone/15 md:grid-cols-4">
          {COLUMNS.map((col, i) => (
            <div key={col.title} className={`py-8 pr-6 ${i === 1 ? "border-l border-bone/15 pl-6" : ""}`}>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] opacity-60">{col.title}</h3>
              <ul className="mt-4 space-y-2 text-[15px]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className={LINK}
                      {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {l.label}
                      {l.external && <span aria-hidden> &#8599;</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="border-t border-bone/15 py-8 pr-6 md:border-t-0 md:border-l md:pl-6">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] opacity-60">Install</h3>
            <code className="mt-4 inline-block max-w-full bg-[#0F1729] px-3 py-2 font-mono text-[12px] break-all">
              pip install callwitness
            </code>
          </div>

          <div className="border-t border-l border-bone/15 py-8 pl-6 md:border-t-0">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] opacity-60">Status</h3>
            <ul className="mt-4 space-y-2 font-mono text-[13px] tabular-nums">
              <li>v0.4.7</li>
              <li>338 tests</li>
              <li>MIT licence</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-bone/15 py-6 font-mono text-[11px] opacity-50 sm:flex-row sm:justify-between">
          <span>&copy; 2026 Callwitness. Built in Kathmandu.</span>
          <span>Verifiable records of AI agent tool interactions.</span>
        </div>
      </div>
    </footer>
  );
}
