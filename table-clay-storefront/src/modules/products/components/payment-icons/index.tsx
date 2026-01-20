"use client"

import Image from "next/image"
import { clx } from "@medusajs/ui"

type PaymentMethod =
  | "visa"
  | "mastercard"
  | "amex"
  | "apple-pay"
  | "google-pay"
  | "paypal"
  | "maestro"

interface PaymentIconsProps {
  methods?: PaymentMethod[]
  size?: "sm" | "md" | "lg"
  className?: string
}

const DEFAULT_METHODS: PaymentMethod[] = [
  "visa",
  "mastercard",
  "amex",
  "apple-pay",
  "google-pay",
  "paypal",
  "maestro",
]

/**
 * Map payment methods to their image files
 */
const PAYMENT_IMAGES: Record<PaymentMethod, string> = {
  visa: "/images/payment-icons/VISA.png",
  mastercard: "/images/payment-icons/Card_2.png",
  amex: "/images/payment-icons/AMEX.png",
  "apple-pay": "/images/payment-icons/Apple_Pay.png",
  "google-pay": "/images/payment-icons/Google_Pay.png",
  paypal: "/images/payment-icons/PayPal.png",
  maestro: "/images/payment-icons/Card_1.png",
}

/**
 * Human-readable names for alt text
 */
const PAYMENT_NAMES: Record<PaymentMethod, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  "apple-pay": "Apple Pay",
  "google-pay": "Google Pay",
  paypal: "PayPal",
  maestro: "Maestro",
}

/**
 * PaymentIcons - Display accepted payment method icons
 * Shows customers their preferred payment method is accepted
 */
const PaymentIcons = ({
  methods = DEFAULT_METHODS,
  size = "md",
  className = "",
}: PaymentIconsProps) => {
  const dimensions = {
    sm: { width: 36, height: 24 },
    md: { width: 48, height: 32 },
    lg: { width: 60, height: 40 },
  }

  const { width, height } = dimensions[size]

  return (
    <div className={clx("flex flex-col gap-2", className)}>
      {/* Payment icons row */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {methods.map((method) => (
          <div
            key={method}
            className="bg-ui-bg-component rounded-md border border-ui-border-base p-1 flex items-center justify-center shadow-sm overflow-hidden"
          >
            <Image
              src={PAYMENT_IMAGES[method]}
              alt={PAYMENT_NAMES[method]}
              width={width}
              height={height}
              className="object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default PaymentIcons
