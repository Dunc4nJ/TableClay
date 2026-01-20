"use client"

import Image from "next/image"

/**
 * Payment card brand icons for checkout
 * Uses PNG images for consistent styling with product pages
 */

const PAYMENT_ICONS = [
  { src: "/images/payment-icons/VISA.png", alt: "Visa" },
  { src: "/images/payment-icons/Card_2.png", alt: "Mastercard" },
  { src: "/images/payment-icons/AMEX.png", alt: "American Express" },
]

/**
 * PayPal icon for checkout (kept as SVG for PayPal-specific display)
 */
const PayPalIcon = () => (
  <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-label="PayPal">
    <rect fill="#fff" x="0" y="0" width="38" height="24" rx="3" />
    <rect fill="#fff" x="0.5" y="0.5" width="37" height="23" rx="2.5" stroke="#E5E7EB" strokeWidth="1" />
    <path
      fill="#003087"
      d="M23.458 8.543c.168-.995.008-1.672-.546-2.285C22.285 5.545 21.19 5.25 19.743 5.25H14.13a.724.724 0 00-.715.612l-2.32 14.71a.435.435 0 00.43.503h3.126l.785-4.976-.024.157a.723.723 0 01.714-.612h1.488c2.916 0 5.199-1.185 5.866-4.61.02-.101.038-.2.053-.296l.022-.121-.098-.074z"
    />
    <path
      fill="#009CDE"
      d="M23.458 8.543a5.437 5.437 0 01-.098.491c-.667 3.425-2.95 4.61-5.866 4.61h-1.488a.723.723 0 00-.714.612l-.96 6.082a.38.38 0 00.375.437h2.631a.633.633 0 00.625-.535l.026-.133.498-3.153.032-.174a.633.633 0 01.625-.535h.394c2.548 0 4.543-1.036 5.126-4.032.243-1.252.117-2.298-.527-3.034a2.515 2.515 0 00-.68-.536z"
    />
  </svg>
)

interface PaymentIconsProps {
  showAll?: boolean
  className?: string
}

const PaymentIcons: React.FC<PaymentIconsProps> = ({
  showAll = false,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {PAYMENT_ICONS.map((icon) => (
        <div
          key={icon.alt}
          className="bg-ui-bg-component rounded-md border border-ui-border-base p-0.5 flex items-center justify-center shadow-sm overflow-hidden"
        >
          <Image
            src={icon.src}
            alt={icon.alt}
            width={36}
            height={24}
            className="object-contain"
          />
        </div>
      ))}
    </div>
  )
}

export { PaymentIcons, PayPalIcon }
export default PaymentIcons
