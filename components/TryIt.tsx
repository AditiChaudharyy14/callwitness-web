import Ledger from "./Ledger";

export default function TryIt() {
  return (
    <section data-witzy="tryit" className="relative overflow-x-clip">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="flex items-center justify-between border-b border-rule py-4">
          <span className="label">Exhibit 02 / Try to break it</span>
        </div>

        <div className="grid grid-cols-1 gap-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <h2 className="font-serif text-[clamp(2.25rem,5vw,4.25rem)] leading-[1.02] tracking-[-0.02em] text-navy">
              Change one record. Watch the chain break.
            </h2>
            <p className="mt-6 max-w-[30rem] text-[17px] leading-relaxed text-ink/80">
              Every record carries the hash of the one before it. Edit any of them and the chain no longer adds up.
            </p>
          </div>

          <div className="lg:col-span-7 lg:pt-3">
            <Ledger />
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Fig. 2: Illustration. Real SHA-256, recomputed in your browser when you edit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
