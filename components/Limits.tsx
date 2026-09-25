const COLUMNS = [
  {
    title: "Privacy",
    items: [
      { lead: "Local by default", body: "The log lives on your machine." },
      { lead: "Secrets redacted", body: "Keys, tokens, passwords and cookies are removed from stored previews." },
      {
        lead: "Reports carry no contents",
        body: "No arguments or response bodies, only hashes, timings and destinations.",
      },
      { lead: "Open source", body: "MIT licensed, so you can read every line." },
    ],
  },
  {
    title: "Current limits",
    items: [
      { lead: "MCP only", body: "Tool calls that don’t go through MCP aren’t covered yet." },
      {
        lead: "Chains are per session",
        body: "Edits inside a session are caught; deleting a whole session isn’t, unless you kept its head hash. External anchoring is next.",
      },
      {
        lead: "It never blocks",
        body: "Under an extreme burst (1,000 calls at once) a few percent of records can drop, and the report says so.",
      },
      { lead: "Records, not controls", body: "It proves what happened; it doesn’t stop anything." },
    ],
  },
];

export default function Limits() {
  return (
    <section id="limits" className="scroll-mt-[72px]">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="flex items-center justify-between border-b border-rule py-4">
          <span className="label">Exhibit 08 / On the record</span>
        </div>

        <h2 className="max-w-[22ch] py-16 font-serif text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.02em] text-navy md:py-24">
          What it stores, and what it doesn&rsquo;t do yet.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {COLUMNS.map((col, i) => (
            <div key={col.title} className={i === 0 ? "md:pr-10" : "mt-12 md:mt-0 md:border-l md:border-rule md:pl-10"}>
              <h3 className="label border-b border-navy/40 pb-3">{col.title}</h3>
              <dl>
                {col.items.map((it) => (
                  <div key={it.lead} className="border-b border-rule py-5">
                    <dt className="font-serif text-xl tracking-[-0.01em] text-navy">{it.lead}</dt>
                    <dd className="mt-1.5 max-w-[34rem] text-[15px] leading-relaxed text-ink/80">{it.body}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <figure className="mt-20 border-t border-rule pt-12 pb-24 md:mt-28 md:pb-32">
          <blockquote className="max-w-[38rem] font-serif text-[clamp(1.375rem,2.4vw,1.75rem)] leading-snug text-navy italic">
            I started Callwitness because agents were doing things nobody could reconstruct afterwards. The logs said
            one thing, the agent said another, and there was no way to settle it. This is my attempt at a record that
            doesn&rsquo;t depend on trusting whoever holds it.
          </blockquote>
          <figcaption className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Aditi Chaudhary, founder. Kathmandu.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
