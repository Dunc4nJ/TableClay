"use client"

import { RadioGroup, Radio } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { PaymentIcons, PayPalIcon } from "../payment-icons"
import MedusaRadio from "@modules/common/components/radio"
import SkeletonCardDetails from "@modules/skeletons/components/skeleton-card-details"
import { CardElement } from "@stripe/react-stripe-js"
import { StripeCardElementOptions } from "@stripe/stripe-js"
import { StripeContext } from "../payment-wrapper/stripe-wrapper"
import { useContext, useMemo, useState, useEffect } from "react"

interface PaymentFormProps {
  cart: any
  availablePaymentMethods: any[]
  onPaymentReady?: (ready: boolean) => void
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  cart,
  availablePaymentMethods,
  onPaymentReady,
}) => {
  const stripeReady = useContext(StripeContext)

  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? availablePaymentMethods?.[0]?.id ?? ""
  )

  // Stripe card element options
  const cardElementOptions: StripeCardElementOptions = useMemo(() => ({
    style: {
      base: {
        fontFamily: "Inter, sans-serif",
        color: "#424270",
        fontSize: "16px",
        "::placeholder": {
          color: "rgb(107 114 128)",
        },
      },
    },
    classes: {
      base: "pt-3 pb-1 block w-full h-11 px-4 mt-0 bg-white border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-gray-300 hover:bg-gray-50 transition-all duration-300 ease-in-out",
    },
  }), [])

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  // Auto-select first payment method on mount
  useEffect(() => {
    if (!selectedPaymentMethod && availablePaymentMethods?.length) {
      setPaymentMethod(availablePaymentMethods[0].id)
    }
  }, [availablePaymentMethods])

  // Notify parent when payment is ready
  useEffect(() => {
    const isReady =
      paidByGiftcard ||
      (selectedPaymentMethod &&
        (!isStripeLike(selectedPaymentMethod) || cardComplete))

    onPaymentReady?.(isReady)
  }, [selectedPaymentMethod, cardComplete, paidByGiftcard, onPaymentReady])

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)

    if (isStripeLike(method)) {
      try {
        await initiatePaymentSession(cart, {
          provider_id: method,
        })
      } catch (err: any) {
        setError(err.message || "Failed to initialize payment")
      }
    }
  }

  if (paidByGiftcard) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800 font-medium">
          Your order is fully covered by gift card!
        </p>
      </div>
    )
  }

  if (!availablePaymentMethods?.length) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-500 text-sm">
          No payment methods available. Please contact support.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Security Notice */}
      <p className="text-sm text-gray-500 mb-4">
        All transactions are secure and encrypted.
      </p>

      <RadioGroup
        value={selectedPaymentMethod}
        onChange={(value: string) => setPaymentMethod(value)}
      >
        <div className="space-y-3">
          {availablePaymentMethods.map((paymentMethod) => {
            const isSelected = selectedPaymentMethod === paymentMethod.id
            const isStripe = isStripeLike(paymentMethod.id)

            return (
              <div
                key={paymentMethod.id}
                className={clx(
                  "border rounded-lg transition-colors overflow-hidden",
                  {
                    "border-tc-terracotta ring-1 ring-tc-terracotta": isSelected,
                    "border-gray-300": !isSelected,
                  }
                )}
              >
                {/* Payment Method Header */}
                <Radio
                  value={paymentMethod.id}
                  className={clx(
                    "flex items-center justify-between w-full p-4 cursor-pointer",
                    {
                      "bg-tc-cream": isSelected,
                      "hover:bg-gray-50": !isSelected,
                    }
                  )}
                >
                  <div className="flex items-center gap-3">
                    <MedusaRadio checked={isSelected} />
                    <span className="font-medium text-gray-900">
                      {paymentInfoMap[paymentMethod.id]?.title ||
                        (isStripe ? "Credit card" : paymentMethod.id)}
                    </span>
                  </div>
                  {isStripe ? (
                    <PaymentIcons showAll />
                  ) : paymentMethod.id.includes("paypal") ? (
                    <PayPalIcon />
                  ) : null}
                </Radio>

                {/* Stripe Card Form (expanded when selected) */}
                {isStripe && isSelected && (
                  <div className="px-4 pb-4 bg-tc-cream">
                    {stripeReady ? (
                      <div className="transition-all duration-150 ease-in-out">
                        <Text className="txt-medium-plus text-gray-700 mb-2">
                          Enter your card details:
                        </Text>
                        <CardElement
                          options={cardElementOptions}
                          onChange={(e) => {
                            setCardBrand(
                              e.brand && e.brand.charAt(0).toUpperCase() + e.brand.slice(1)
                            )
                            setError(e.error?.message || null)
                            setCardComplete(e.complete)
                          }}
                        />
                      </div>
                    ) : (
                      <SkeletonCardDetails />
                    )}
                  </div>
                )}

                {/* Other payment methods (non-stripe) */}
                {!isStripe && isSelected && (
                  <div className="px-4 pb-4 bg-tc-cream">
                    <p className="text-sm text-gray-600">
                      You will be redirected to {paymentInfoMap[paymentMethod.id]?.title || paymentMethod.id} to complete your purchase.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </RadioGroup>

      <ErrorMessage error={error} data-testid="payment-form-error-message" />
    </div>
  )
}

export default PaymentForm
