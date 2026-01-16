import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping & Returns | Table Clay",
  description:
    "Shipping and returns details for Table Clay. 24-hour handling, 5-7 business day shipping, and 30-day returns.",
}

export default function ShippingPage() {
  return (
    <div className="pb-16">
      <section className="relative overflow-hidden bg-cream-100">
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_10%_0%,rgba(212,165,116,0.22),transparent_60%),radial-gradient(700px_420px_at_90%_-10%,rgba(160,130,109,0.18),transparent_55%)]" />
        <div className="content-container relative py-16 sm:py-20">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-700">
            Shipping & Returns
          </p>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl text-ui-fg-base">
            Clear, simple policies for every order
          </h1>
          <p className="mt-6 text-lg text-ui-fg-subtle max-w-2xl">
            We keep fulfillment straightforward and transparent, with fast
            handling and dependable tracking.
          </p>
        </div>
      </section>

      <section className="content-container py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-cream-300 bg-cream-50 p-7 shadow-sm">
            <h2 className="font-display text-2xl text-ui-fg-base">Shipping</h2>
            <ul className="mt-4 space-y-3 text-ui-fg-subtle">
              <li>24-hour handling time before shipment.</li>
              <li>5-7 business day shipping after dispatch.</li>
              <li>
                We will send a tracking number once your order has been handed
                off to the carrier.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-cream-300 bg-cream-50 p-7 shadow-sm">
            <h2 className="font-display text-2xl text-ui-fg-base">Returns</h2>
            <ul className="mt-4 space-y-3 text-ui-fg-subtle">
              <li>Returns must be made within 30 days of purchase.</li>
              <li>The customer is responsible for the return label.</li>
            </ul>
            <div className="mt-5 rounded-2xl border border-cream-300 bg-cream-100 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-brand-700">
                Return Address
              </p>
              <address className="mt-2 not-italic text-ui-fg-subtle leading-relaxed">
                155 E 31st St Apt 21G
                <br />
                NY 10016
              </address>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
