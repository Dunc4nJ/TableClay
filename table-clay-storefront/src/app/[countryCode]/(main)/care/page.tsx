import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Care Guide | Table Clay",
  description:
    "Simple care tips for Table Clay pieces, from mugs to vases. Treat with care and enjoy for years.",
}

export default function CareGuidePage() {
  return (
    <div className="pb-16">
      <section className="relative overflow-hidden bg-cream-100">
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_14%_0%,rgba(212,165,116,0.22),transparent_60%),radial-gradient(700px_420px_at_90%_-10%,rgba(160,130,109,0.18),transparent_55%)]" />
        <div className="content-container relative py-16 sm:py-20">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-700">
            Care Guide
          </p>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl text-ui-fg-base">
            Keep your pieces warm, lasting, and loved
          </h1>
          <p className="mt-6 text-lg text-ui-fg-subtle max-w-2xl">
            A little care goes a long way. Follow these simple tips to keep your
            ceramics looking their best for years to come.
          </p>
        </div>
      </section>

      <section className="content-container py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-cream-300 bg-cream-50 p-7 shadow-sm">
            <h2 className="font-display text-2xl text-ui-fg-base">
              Everyday care
            </h2>
            <ul className="mt-4 space-y-3 text-ui-fg-subtle">
              <li>Hand wash is best for all pieces.</li>
              <li>Treat each piece with care when stacking or storing.</li>
              <li>Dry thoroughly before putting away.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-cream-300 bg-cream-50 p-7 shadow-sm">
            <h2 className="font-display text-2xl text-ui-fg-base">Mugs</h2>
            <ul className="mt-4 space-y-3 text-ui-fg-subtle">
              <li>All mugs are dishwasher safe.</li>
              <li>Place with space to avoid chips during cycles.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-cream-300 bg-cream-50 p-7 shadow-sm">
            <h2 className="font-display text-2xl text-ui-fg-base">Vases</h2>
            <ul className="mt-4 space-y-3 text-ui-fg-subtle">
              <li>Vases should be hand cleaned only.</li>
              <li>Use a soft cloth or sponge to protect the glaze.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="content-container">
        <div className="rounded-3xl bg-brand-900 text-cream-100 p-8 sm:p-10 shadow-lg">
          <h2 className="font-display text-3xl">Questions about care?</h2>
          <p className="mt-3 text-cream-100/80 text-lg max-w-2xl">
            We are happy to help with specific pieces or custom recommendations.
          </p>
          <div className="mt-6">
            <a
              href="mailto:Emily@tableclay.com"
              className="inline-flex items-center justify-center rounded-full bg-cream-100 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand-900 transition hover:bg-cream-200"
            >
              Email Emily
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
