import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronLeft from "@modules/common/icons/chevron-left"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-tc-cream relative min-h-screen">
      <div className="h-16 bg-white border-b border-cream-300">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/"
            className="text-sm text-ui-fg-subtle flex items-center gap-x-2 flex-1 basis-0 hover:text-ui-fg-base transition-colors"
            data-testid="back-to-cart-link"
          >
            <ChevronLeft size={16} />
            <span className="mt-px hidden small:block">Back to shopping</span>
            <span className="mt-px block small:hidden">Back</span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity"
            data-testid="store-link"
          >
            <Image
              src="/images/logo/table-clay-logo.jpeg"
              alt="Table Clay"
              width={48}
              height={48}
              className="rounded-full object-cover"
              priority
            />
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">{children}</div>
    </div>
  )
}
