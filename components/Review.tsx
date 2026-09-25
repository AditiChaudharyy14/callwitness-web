const STEPS = [
  "We set Callwitness up on your agent together, in your environment.",
  "It records a week of real tool calls. The recording stays on your machines; we go through it together in a review session.",
  "You get the evidence report, verified end to end.",
  "A short findings memo: what your agent called, what failed, what looked unusual.",
  "Head hashes delivered separately, so you hold a copy the machine can’t edit.",
];

const MAILTO = "mailto:callwitness.dev@gmail.com?subject=Evidence%20review%20for%20our%20AI%20agent";

export default function Review() {
  return (
    <section id="review" className="scroll-mt-[72px] bg-[#18223B] text-bone">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="flex items-center justify-between border-b border-bone/15 py-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/60">Exhibit 06 / Evidence review</span>
        </div>

        <div className="grid grid-cols-1 gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h2 className="font-serif text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.02em]">
              One week. One report you can hand over.
            </h2>
            <p className="mt-6 max-w-[30rem] text-[17px] leading-relaxed text-bone/75">
              For teams whose agents touch customer data, money or production systems, and who expect to be asked
              for proof.
            </p>
          </div>

          <div className="lg:col-span-7">
            <ol className="border-b border-bone/15">
              {STEPS.map((s, i) => (
                <li key={s} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-bone/15 py-5">
                  <span className="pt-0.5 font-mono text-[12px] tabular-nums text-bone/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[17px] leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>

            <div className="mt-10">
              <a
                href={MAILTO}
                className="group inline-flex items-center justify-between gap-6 bg-[#E3D2BC] px-6 py-4 text-[15px] text-[#18223B] transition-colors hover:bg-bone"
              >
                Request an evidence review
                <span className="text-gold-deep transition-transform group-hover:translate-x-1" aria-hidden>
                  &rarr;
                </span>
              </a>
              <p className="mt-4 max-w-[30rem] text-[14px] leading-relaxed text-bone/60">
                No sales call required. A short email is enough to start. We usually reply within a day.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
