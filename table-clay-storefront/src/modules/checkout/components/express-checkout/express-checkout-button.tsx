"use client"

import {
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import {
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent,
  StripeExpressCheckoutElementOptions,
} from "@stripe/stripe-js"
import { useState, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import { placeOrder, updateCart, setShippingMethod } from "@lib/data/cart"
import { isStripeLike } from "@lib/constants"
import { listCartShippingMethods } from "@lib/data/fulfillment"

interface ExpressCheckoutButtonProps {
  cart: HttpTypes.StoreCart
  notReady?: boolean
  onAvailabilityChange?: (available: boolean) => void
}

// Map Stripe address format to Medusa address format
const mapStripeAddressToMedusa = (
  stripeAddress: any,
  name?: string
): Partial<HttpTypes.StoreCartAddress> | undefined => {
  if (!stripeAddress) return undefined

  const nameParts = name?.split(" ") || []
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""

  return {
    first_name: firstName,
    last_name: lastName,
    address_1: stripeAddress.line1 || "",
    address_2: stripeAddress.line2 || "",
    city: stripeAddress.city || "",
    province: stripeAddress.state || "",
    postal_code: stripeAddress.postal_code || "",
    country_code: stripeAddress.country?.toLowerCase() || "",
  }
}

// Map Stripe error codes to user-friendly messages
const getErrorMessage = (stripeError: any): string => {
  switch (stripeError.code) {
    case "card_declined":
      return "Your card was declined. Please try a different payment method."
    case "expired_card":
      return "Your card has expired. Please use a different card."
    case "incorrect_cvc":
      return "The security code is incorrect. Please check and try again."
    case "processing_error":
      return "An error occurred while processing. Please try again."
    case "insufficient_funds":
      return "Insufficient funds. Please try a different payment method."
    case "payment_intent_authentication_failure":
      return "Authentication failed. Please try again."
    default:
      return stripeError.message || "Payment failed. Please try again."
  }
}

const ExpressCheckoutButton: React.FC<ExpressCheckoutButtonProps> = ({
  cart,
  notReady,
  onAvailabilityChange,
}) => {
  const stripe = useStripe()
  const elements = useElements()

  const [isAvailable, setIsAvailable] = useState(false)
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Get client_secret from payment session
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending" && isStripeLike(s.provider_id)
  )
  const clientSecret = paymentSession?.data?.client_secret as string | undefined

  // Called when Express Checkout Element is ready
  const onReady = useCallback(
    ({ availablePaymentMethods }: StripeExpressCheckoutElementReadyEvent) => {
      // Show component only if at least one express method is available
      const hasExpressMethods = !!availablePaymentMethods &&
        Object.values(availablePaymentMethods).some(Boolean)

      setIsAvailable(!!hasExpressMethods)
      setHasCheckedAvailability(true)
      onAvailabilityChange?.(!!hasExpressMethods)

      if (!hasExpressMethods) {
        console.log("No express payment methods available for this browser/device")
      }
    },
    [onAvailabilityChange]
  )

  // Called when user clicks a payment button (before payment sheet opens)
  const onClick = useCallback(
    ({ resolve }: StripeExpressCheckoutElementClickEvent) => {
      // Configure the payment sheet
      const options = {
        emailRequired: !cart.email,
        phoneNumberRequired: false,
        // Only require shipping if not already set
        shippingAddressRequired: !cart.shipping_address?.address_1,
        // Allowed shipping countries
        allowedShippingCountries: (cart.region?.countries?.map(
          (c) => c.iso_2?.toUpperCase()
        ) || ["US"]) as any[],
        // Show line items in payment sheet
        lineItems: cart.items?.map((item) => ({
          name: item.product_title || item.title || "Item",
          amount: item.unit_price || 0,
        })),
      }

      resolve(options)
    },
    [cart]
  )

  // Handle when user changes shipping address in payment sheet
  const onShippingAddressChange = useCallback(
    async ({ address, resolve, reject }: any) => {
      try {
        // Map Stripe address format to Medusa format
        const medusaAddress = mapStripeAddressToMedusa(address, address.name)

        if (!medusaAddress) {
          reject()
          return
        }

        // Update cart with new shipping address
        await updateCart({
          shipping_address: medusaAddress as any,
        })

        // Get available shipping options for this address
        const shippingOptions = await listCartShippingMethods(cart.id)

        // Format shipping options for Stripe payment sheet
        const shippingRates = shippingOptions?.map((option) => ({
          id: option.id,
          displayName: option.name || "Standard Shipping",
          amount: option.amount || 0,
        })) || []

        if (shippingRates.length === 0) {
          // No shipping available to this address
          reject()
          return
        }

        // Return available shipping rates to payment sheet
        resolve({
          shippingRates,
        })
      } catch (error) {
        console.error("Shipping address change error:", error)
        reject()
      }
    },
    [cart.id]
  )

  // Handle when user selects a shipping rate in payment sheet
  const onShippingRateChange = useCallback(
    async ({ shippingRate, resolve, reject }: any) => {
      try {
        // Update cart with selected shipping method
        await setShippingMethod({
          cartId: cart.id,
          shippingMethodId: shippingRate.id,
        })

        resolve()
      } catch (error) {
        console.error("Shipping rate change error:", error)
        reject()
      }
    },
    [cart.id]
  )

  // Called when user confirms payment in the payment sheet
  const onConfirm = useCallback(
    async (event: StripeExpressCheckoutElementConfirmEvent) => {
      if (!stripe || !elements || !clientSecret) {
        setErrorMessage("Payment system not ready. Please refresh and try again.")
        return
      }

      setIsProcessing(true)
      setErrorMessage(null)

      try {
        const { billingDetails } = event

        // Confirm the payment with Stripe
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/${cart.region?.countries?.[0]?.iso_2 || "us"}/order/confirmed`,
            payment_method_data: {
              billing_details: billingDetails,
            },
          },
          redirect: "if_required",
        })

        if (error) {
          setErrorMessage(getErrorMessage(error))
          setIsProcessing(false)
          return
        }

        // Check payment status
        if (
          paymentIntent?.status === "succeeded" ||
          paymentIntent?.status === "requires_capture"
        ) {
          // Place the order in Medusa
          await placeOrder()
        } else {
          setErrorMessage("Payment was not completed. Please try again.")
          setIsProcessing(false)
        }
      } catch (err: any) {
        console.error("Express checkout error:", err)

        // Check for network errors
        if (err.name === "NetworkError" || !navigator.onLine) {
          setErrorMessage("Network error. Please check your connection and try again.")
        } else if (err.message?.includes("timeout")) {
          setErrorMessage("Request timed out. Please try again.")
        } else {
          setErrorMessage(err.message || "An unexpected error occurred.")
        }
        setIsProcessing(false)
      }
    },
    [stripe, elements, clientSecret, cart]
  )

  // Called when user cancels the payment sheet
  const onCancel = useCallback(() => {
    setErrorMessage(null)
    setIsProcessing(false)
  }, [])

  // Don't render if not ready or no client secret
  if (notReady || !clientSecret) {
    console.log("[ExpressCheckout] Not rendering:", { notReady, hasClientSecret: !!clientSecret })
    return null
  }

  // Hide if no express methods available (after onReady has been called)
  if (hasCheckedAvailability && !isAvailable) {
    return null
  }

  const expressCheckoutOptions: StripeExpressCheckoutElementOptions = {
    buttonTheme: {
      applePay: "black",
      googlePay: "black",
    },
    buttonType: {
      applePay: "buy",
      googlePay: "buy",
    },
    buttonHeight: 52,
    layout: {
      maxColumns: 2,
      maxRows: 2,
    },
    paymentMethods: {
      applePay: "auto",
      googlePay: "auto",
      link: "auto",
      amazonPay: "auto",
      paypal: "never",
      klarna: "never",
    },
  }

  return (
    <div className="w-full">
      <ExpressCheckoutElement
        options={expressCheckoutOptions}
        onReady={onReady}
        onClick={onClick}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onShippingAddressChange={onShippingAddressChange}
        onShippingRateChange={onShippingRateChange}
      />

      {errorMessage && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm text-center">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-sm text-blue-600 hover:underline mt-1 w-full text-center"
          >
            Try again
          </button>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          <p className="text-ui-fg-muted text-sm">Processing payment...</p>
        </div>
      )}
    </div>
  )
}

export default ExpressCheckoutButton
