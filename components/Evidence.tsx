import Reveal from "./Reveal";

// From a real `callwitness demo` run (session a6fb8a70, 0.4.7).
const HEAD = "b9bec89a4e7280958a4bbade7ab4ee51e3a282419439c524a20dfe0a946ad783";
const CALLS = [
  { tool: "echo", status: "ok", time: "9 ms", hash: "2b0a722cd626" },
  { tool: "get-annotated-message", status: "ok", time: "3 ms", hash: "642720fb7a44" },
  { tool: "get-resource-links", status: "ok", time: "206 ms", hash: "47718fa34e91" },
];

// Two columns on mobile (tool | time, hash on its own line); four from sm up.
const ROW = "grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 sm:grid-cols-[minmax(0,1fr)_3.5rem_4rem_8rem]";

export default function Evidence() {
  return (
    <section id="evidence" className="scroll-mt-[72px]">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="flex items-center justify-between border-b border-rule py-4">
          <span className="label">Exhibit 05 / The evidence report</span>
        </div>

        <h2 className="max-w-[20ch] py-16 font-serif text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.02em] text-navy md:py-24">
          One command. One page you can hand to anyone.
        </h2>

        <div className="grid grid-cols-1 gap-12 pb-24 md:pb-32 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <p className="max-w-[34rem] text-[17px] leading-relaxed text-ink/80">
              <span className="font-mono text-[15px] text-navy">callwitness report</span> turns a session into a
              single HTML page: the verdict, the head hash, and every call with its response hash, timing and
              destination. It contains no arguments and no response contents, and nothing is sent anywhere.
            </p>
            <code className="mt-8 inline-block border border-rule px-4 py-3 font-mono text-[13px] text-navy">
              <span className="text-muted">$ </span>callwitness report
            </code>
          </div>

          <div className="lg:col-span-7">
            <Reveal>
              {/* the report, as a printed page on the stack */}
              <div className="relative mr-2 mb-2">
                <div aria-hidden className="absolute inset-0 translate-x-2 translate-y-2 border border-rule bg-[#EFE6D6]" />
                <div className="relative border border-rule bg-bone p-5 sm:p-8 md:p-10">
                  <div className="flex flex-col gap-2 border-b border-rule pb-5 sm:flex-row sm:items-baseline sm:justify-between">
                    <h3 className="font-serif text-2xl tracking-[-0.01em] text-navy">Callwitness evidence report</h3>
                    <span className="font-mono text-[11px] tabular-nums text-muted">
                      session a6fb8a70 &middot; 6 tool calls
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-3 border border-rule bg-paper/40 px-4 py-3">
                    <span
                      aria-hidden
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-[12px] text-ink"
                    >
                      &#10003;
                    </span>
                    <span className="text-[15px] text-ink">
                      <span className="font-medium">Chain intact:</span> 6 of 6 records verified
                    </span>
                  </div>

                  <div className="mt-6">
                    <span className="label">Head hash</span>
                    <p className="mt-2 font-mono text-[11px] leading-relaxed break-all text-ink sm:text-[12px]">
                      {HEAD.slice(0, 32)}
                      <br />
                      {HEAD.slice(32)}
                    </p>
                  </div>

                  <div className="mt-8 font-mono text-[12px] tabular-nums" role="table" aria-label="Recorded tool calls">
                    <div role="row" className={`${ROW} border-b border-rule pb-2 text-[10px] uppercase tracking-[0.14em] text-muted`}>
                      <span role="columnheader">Tool</span>
                      <span role="columnheader" className="hidden sm:block">Status</span>
                      <span role="columnheader" className="text-right sm:text-left">Time</span>
                      <span role="columnheader" className="hidden sm:block">Response hash</span>
                    </div>
                    {CALLS.map((c) => (
                      <div role="row" key={c.tool} className={`${ROW} border-b border-rule py-2.5`}>
                        <span role="cell" className="truncate text-navy">{c.tool}</span>
                        <span role="cell" className="hidden text-ink sm:block">{c.status}</span>
                        <span role="cell" className="text-right text-ink sm:text-left">{c.time}</span>
                        <span role="cell" className="col-span-2 mt-0.5 text-[11px] text-muted sm:col-span-1 sm:mt-0 sm:text-[12px]">
                          {c.hash}&hellip;
                        </span>
                      </div>
                    ))}
                    <div className="py-2.5 text-muted">+ 3 more</div>
                  </div>
                </div>
              </div>
              <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Fig. 5: From <span className="normal-case">callwitness demo</span>, v0.4.7.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
