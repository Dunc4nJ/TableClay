import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping & Returns | Table Clay",
  description:
    "Shipping and returns details for Table Clay. 24-hour handling, 5-7 business day shipping, and 14-day returns on unused items in original packaging.",
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
            <p className="mt-3 text-ui-fg-subtle">
              We want you to love your handcrafted pieces. If something
              isn&apos;t right, we&apos;re here to help.
            </p>

            <h3 className="mt-5 font-medium text-ui-fg-base">
              Return Requirements
            </h3>
            <p className="mt-1 text-sm text-ui-fg-subtle">
              To qualify for a return, please ensure your items meet these
              requirements:
            </p>
            <ul className="mt-3 space-y-2 text-ui-fg-subtle">
              <li className="flex items-start gap-2">
                <span className="text-brand-500 font-medium">✓</span>
                <span>
                  Returned within <strong>14 days</strong> of delivery
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-500 font-medium">✓</span>
                <span>In original, unused, and resalable condition</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-500 font-medium">✓</span>
                <span>In original packaging with all tags attached</span>
              </li>
            </ul>

            <h3 className="mt-5 font-medium text-ui-fg-base">
              Non-Returnable Items
            </h3>
            <ul className="mt-2 space-y-2 text-ui-fg-subtle">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-medium">✗</span>
                <span>
                  Custom or personalized pieces made to your specifications
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-medium">✗</span>
                <span>Items marked as final sale or clearance</span>
              </li>
            </ul>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-medium text-amber-800">
                Damaged or Defective Items
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                If your piece arrives broken or damaged, please email us photos
                within <strong>3 days of receipt</strong>. Include images of the
                packaging and the damage. We&apos;ll arrange a{" "}
                <strong>full refund or free replacement</strong> — your choice.
              </p>
            </div>

            <div className="mt-5 text-sm text-ui-fg-muted space-y-2">
              <p>
                <strong>Return shipping:</strong> Customer is responsible for
                return shipping costs. We recommend using a trackable, insured
                service.
              </p>
              <p>
                <strong>Refund timing:</strong> Refunds are processed within
                7-14 business days after we receive your return.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-cream-300 bg-cream-100 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-brand-700">
                Return Address
              </p>
              <address className="mt-2 not-italic text-ui-fg-subtle leading-relaxed">
                Table Clay Returns
                <br />
                155 E 31st St Apt 21G
                <br />
                New York, NY 10016
              </address>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
