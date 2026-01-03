"use client"

import { setAddresses, updateCartSilent } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { useToggleState } from "@medusajs/ui"
import { useActionState, useEffect, useState, useTransition, useRef, useCallback } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import Input from "@modules/common/components/input"
import Checkbox from "@modules/common/components/checkbox"
import CountrySelect from "../country-select"
import AddressSelect from "../address-select"
import { Container } from "@medusajs/ui"
import { mapKeys, debounce } from "lodash"
import { useRouter } from "next/navigation"

interface ContactDeliveryFormProps {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}

const ContactDeliveryForm: React.FC<ContactDeliveryFormProps> = ({
  cart,
  customer,
}) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const [formData, setFormData] = useState<Record<string, any>>({
    email: cart?.email || customer?.email || "",
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code":
      cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
  })

  const [message, formAction] = useActionState(setAddresses, null)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const lastSavedAddressRef = useRef<string>("")

  // Check if minimum required address fields are filled for shipping lookup
  const hasMinimumAddressFields = useCallback((data: Record<string, any>) => {
    return !!(
      data["shipping_address.address_1"] &&
      data["shipping_address.city"] &&
      data["shipping_address.postal_code"] &&
      data["shipping_address.country_code"]
    )
  }, [])

  // Debounced function to save shipping address to cart
  // Uses updateCartSilent to avoid automatic revalidation, then manually refreshes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSaveAddress = useCallback(
    debounce(async (data: Record<string, any>) => {
      if (!cart?.id || !hasMinimumAddressFields(data)) return

      // Create a hash of current address to check if it changed
      const addressHash = JSON.stringify({
        address_1: data["shipping_address.address_1"],
        city: data["shipping_address.city"],
        postal_code: data["shipping_address.postal_code"],
        country_code: data["shipping_address.country_code"],
        province: data["shipping_address.province"],
      })

      // Skip if address hasn't changed
      if (addressHash === lastSavedAddressRef.current) return
      lastSavedAddressRef.current = addressHash

      setIsSavingAddress(true)
      try {
        await updateCartSilent({
          email: data.email || undefined,
          shipping_address: {
            first_name: data["shipping_address.first_name"] || "",
            last_name: data["shipping_address.last_name"] || "",
            address_1: data["shipping_address.address_1"] || "",
            address_2: "",
            company: data["shipping_address.company"] || "",
            postal_code: data["shipping_address.postal_code"] || "",
            city: data["shipping_address.city"] || "",
            country_code: data["shipping_address.country_code"] || "",
            province: data["shipping_address.province"] || "",
            phone: data["shipping_address.phone"] || "",
          },
        })
        // Trigger client-side refresh to fetch updated cart with shipping address
        router.refresh()
      } catch (error) {
        console.error("[ContactDeliveryForm] Failed to auto-save address:", error)
      } finally {
        setIsSavingAddress(false)
      }
    }, 800),
    [cart?.id, hasMinimumAddressFields, router]
  )

  // Auto-save address when form data changes
  useEffect(() => {
    if (hasMinimumAddressFields(formData)) {
      debouncedSaveAddress(formData)
    }
    // Cleanup debounce on unmount
    return () => {
      debouncedSaveAddress.cancel()
    }
  }, [formData, debouncedSaveAddress, hasMinimumAddressFields])

  // Countries available in the cart's region
  const countriesInRegion = cart?.region?.countries?.map((c) => c.iso_2) || []

  // Check if customer has saved addresses in the current region
  const addressesInRegion =
    customer?.addresses?.filter(
      (a) => a.country_code && countriesInRegion.includes(a.country_code)
    ) || []

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    if (address) {
      setFormData((prev) => ({
        ...prev,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))
    }

    if (email) {
      setFormData((prev) => ({
        ...prev,
        email: email,
      }))
    }
  }

  // Auto-populate from cart/customer on mount
  useEffect(() => {
    if (cart?.shipping_address) {
      setFormAddress(cart.shipping_address, cart.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart?.id])

  return (
    <form action={formAction}>
      {/* Email/Contact at top */}
      <div className="mb-6">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="contact-email-input"
        />
      </div>

      {/* Saved Addresses Selector */}
      {customer && addressesInRegion.length > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            {`Hi ${customer.first_name}, would you like to use a saved address?`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}

      {/* Delivery Address Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CountrySelect
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-country-select"
        />
        <div className="hidden sm:block"></div>

        <Input
          label="First name"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="Last name"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />

        <div className="sm:col-span-2">
          <Input
            label="Address"
            name="shipping_address.address_1"
            autoComplete="address-line1"
            value={formData["shipping_address.address_1"]}
            onChange={handleChange}
            required
            data-testid="shipping-address-input"
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Apartment, suite, etc. (optional)"
            name="shipping_address.company"
            value={formData["shipping_address.company"]}
            onChange={handleChange}
            autoComplete="organization"
            data-testid="shipping-company-input"
          />
        </div>

        <Input
          label="City"
          name="shipping_address.city"
          autoComplete="address-level2"
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          required
          data-testid="shipping-city-input"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="State / Province"
            name="shipping_address.province"
            autoComplete="address-level1"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            data-testid="shipping-province-input"
          />
          <Input
            label="ZIP code"
            name="shipping_address.postal_code"
            autoComplete="postal-code"
            value={formData["shipping_address.postal_code"]}
            onChange={handleChange}
            required
            data-testid="shipping-postal-code-input"
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Phone (optional)"
            name="shipping_address.phone"
            autoComplete="tel"
            value={formData["shipping_address.phone"]}
            onChange={handleChange}
            data-testid="shipping-phone-input"
          />
        </div>
      </div>

      {/* Billing Address Checkbox */}
      <div className="my-6">
        <Checkbox
          label="Use shipping address as billing address"
          name="same_as_billing"
          checked={sameAsBilling}
          onChange={toggleSameAsBilling}
          data-testid="billing-address-checkbox"
        />
      </div>

      {/* Billing Address (if different) */}
      {!sameAsBilling && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-base font-medium text-gray-900 mb-4">
            Billing address
          </h3>
          <BillingAddress cart={cart} />
        </div>
      )}

      <ErrorMessage error={message} data-testid="address-error-message" />

      {/* Hidden submit - form submits via footer button */}
      <input type="hidden" name="same_as_billing" value={sameAsBilling ? "on" : ""} />
    </form>
  )
}

export default ContactDeliveryForm
