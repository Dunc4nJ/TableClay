import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "About | Table Clay",
  description:
    "Emily's love of ceramics sparked Table Clay. What began as a small studio now includes a dozen artisans and craft shows across the country.",
}

export default function AboutPage() {
  return (
    <div className="pb-16">
      <section className="relative overflow-hidden bg-cream-100">
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_12%_0%,rgba(212,165,116,0.25),transparent_60%),radial-gradient(700px_420px_at_92%_-10%,rgba(160,130,109,0.18),transparent_55%)]" />
        <div className="content-container relative py-16 sm:py-20">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-700">
            About
          </p>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl text-ui-fg-base">
            A quiet love for clay, a studio with a wide journey
          </h1>
          <p className="mt-6 text-lg text-ui-fg-subtle max-w-2xl">
            Table Clay began with Emily&apos;s love of ceramics and the calm ritual of
            shaping each piece by hand. What started small has grown into a
            studio of a dozen artisans, sharing new work at craft shows around
            the country.
          </p>
        </div>
      </section>

      <section className="content-container py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <h2 className="font-display text-3xl text-ui-fg-base">
              The studio today
            </h2>
            <p className="text-ui-fg-subtle text-lg leading-relaxed">
              We focus on warm, functional pieces that feel good in the hand and
              live beautifully on the table. Every form starts with a thoughtful
              sketch, a careful mix of clay and glaze, and a patient firing.
            </p>
            <p className="text-ui-fg-subtle text-lg leading-relaxed">
              Our team works in small batches to keep the process intimate and
              the quality consistent. We believe a mug should carry a quiet
              story, and a vase should feel like a small ceremony.
            </p>
          </div>

          <div className="rounded-3xl border border-cream-300 bg-cream-50 p-7 shadow-sm">
            <h3 className="text-sm uppercase tracking-[0.25em] text-brand-700">
              Studio Notes
            </h3>
            <ul className="mt-5 space-y-4 text-ui-fg-subtle">
              <li>
                A team of a dozen artisans shaping, glazing, and finishing each
                batch with care.
              </li>
              <li>
                Regular craft shows across the country, bringing the studio to
                new tables and homes.
              </li>
              <li>
                Limited drops that keep the work fresh, intentional, and
                personal.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="content-container">
        <div className="rounded-3xl bg-brand-900 text-cream-100 p-8 sm:p-10 shadow-lg">
          <h2 className="font-display text-3xl">See what we&apos;re making</h2>
          <p className="mt-3 text-cream-100/80 text-lg max-w-2xl">
            Explore the latest collections and find the piece that feels like
            it was made for your table.
          </p>
          <div className="mt-6">
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center justify-center rounded-full bg-cream-100 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand-900 transition hover:bg-cream-200"
            >
              Shop the collection
            </LocalizedClientLink>
          </div>
        </div>
      </section>
    </div>
  )
}
