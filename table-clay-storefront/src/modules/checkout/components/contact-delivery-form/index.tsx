"use client"

import { setAddresses, updateCartSilent } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { useToggleState } from "@medusajs/ui"
import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  useRef,
  useCallback,
} from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import AddressSelect from "../address-select"
import AddressAutocomplete from "../address-autocomplete"
import StaticFormField from "../static-form-field"
import StaticSelectField from "../static-select-field"
import { Container } from "@medusajs/ui"
import { mapKeys, debounce } from "lodash"
import { useRouter } from "next/navigation"
import { identifyOmnisendContact } from "@lib/analytics/omnisend"

// US State options for dropdown
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
]

interface ContactDeliveryFormProps {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}

interface FormErrors {
  email?: string
  first_name?: string
  last_name?: string
  address_1?: string
  city?: string
  province?: string
  postal_code?: string
  phone?: string
}

interface TouchedFields {
  email?: boolean
  first_name?: boolean
  last_name?: boolean
  address_1?: boolean
  city?: boolean
  province?: boolean
  postal_code?: boolean
  phone?: boolean
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
      cart?.shipping_address?.country_code || "us",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<TouchedFields>({})

  const [message, formAction] = useActionState(setAddresses, null)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const lastSavedAddressRef = useRef<string>("")
  const lastIdentifiedEmailRef = useRef<string>("")

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "Please enter a valid email address"
    return undefined
  }

  const validateRequired = (
    value: string,
    fieldName: string
  ): string | undefined => {
    if (!value || !value.trim()) return `${fieldName} is required`
    return undefined
  }

  const validatePostalCode = (
    postalCode: string,
    countryCode: string
  ): string | undefined => {
    if (!postalCode) return "ZIP code is required"
    if (countryCode === "us") {
      const usZipRegex = /^\d{5}(-\d{4})?$/
      if (!usZipRegex.test(postalCode)) return "Please enter a valid ZIP code"
    }
    return undefined
  }

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return undefined // Phone is optional
    // Basic phone validation - allows various formats
    const phoneRegex = /^[\d\s\-\(\)\+\.]{7,20}$/
    if (!phoneRegex.test(phone)) return "Please enter a valid phone number"
    return undefined
  }

  // Validate a single field
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "email":
        return validateEmail(value)
      case "shipping_address.first_name":
        return validateRequired(value, "First name")
      case "shipping_address.last_name":
        return validateRequired(value, "Last name")
      case "shipping_address.address_1":
        return validateRequired(value, "Address")
      case "shipping_address.city":
        return validateRequired(value, "City")
      case "shipping_address.province":
        return validateRequired(value, "State")
      case "shipping_address.postal_code":
        return validatePostalCode(
          value,
          formData["shipping_address.country_code"]
        )
      case "shipping_address.phone":
        return validatePhone(value)
      default:
        return undefined
    }
  }

  // Handle blur - validate field
  const handleBlur = (fieldName: string) => {
    const shortName = fieldName.replace("shipping_address.", "")
    setTouched((prev) => ({ ...prev, [shortName]: true }))

    const error = validateField(fieldName, formData[fieldName] || "")
    setErrors((prev) => ({
      ...prev,
      [shortName]: error,
    }))

    // Identify OmniSend contact when email is valid and not already identified
    if (fieldName === "email" && !error) {
      const email = formData[fieldName]?.trim()
      if (email && email !== lastIdentifiedEmailRef.current) {
        lastIdentifiedEmailRef.current = email
        identifyOmnisendContact(email)
      }
    }
  }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSaveAddress = useCallback(
    debounce(async (data: Record<string, any>) => {
      if (!cart?.id || !hasMinimumAddressFields(data)) return

      const addressHash = JSON.stringify({
        address_1: data["shipping_address.address_1"],
        city: data["shipping_address.city"],
        postal_code: data["shipping_address.postal_code"],
        country_code: data["shipping_address.country_code"],
        province: data["shipping_address.province"],
      })

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
        router.refresh()
      } catch (error) {
        console.error(
          "[ContactDeliveryForm] Failed to auto-save address:",
          error
        )
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
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error if user starts typing
    const shortName = name.replace("shipping_address.", "")
    if (errors[shortName as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [shortName]: undefined,
      }))
    }
  }

  // Handle address autocomplete selection
  const handleAddressSelect = (address: {
    address_1: string
    address_2: string
    city: string
    state: string
    postal_code: string
    country_code: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      "shipping_address.address_1": address.address_1,
      "shipping_address.company": address.address_2 || prev["shipping_address.company"],
      "shipping_address.city": address.city,
      "shipping_address.province": address.state,
      "shipping_address.postal_code": address.postal_code,
      "shipping_address.country_code": address.country_code || "us",
    }))

    // Clear errors for auto-filled fields
    setErrors((prev) => ({
      ...prev,
      address_1: undefined,
      city: undefined,
      province: undefined,
      postal_code: undefined,
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
        "shipping_address.country_code": address?.country_code || "us",
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

  // Check if current country is US for state dropdown
  const isUS = formData["shipping_address.country_code"] === "us"

  // Helper to get error for a field
  const getFieldError = (fieldName: string): string | undefined => {
    const shortName = fieldName.replace("shipping_address.", "")
    return touched[shortName as keyof TouchedFields]
      ? errors[shortName as keyof FormErrors]
      : undefined
  }

  // Helper to check if field is touched
  const isFieldTouched = (fieldName: string): boolean => {
    const shortName = fieldName.replace("shipping_address.", "")
    return Boolean(touched[shortName as keyof TouchedFields])
  }

  // Country options from region
  const countryOptions = (cart?.region?.countries || [])
    .filter((country) => country.iso_2 && country.display_name)
    .map((country) => ({
      value: country.iso_2!,
      label: country.display_name!,
    }))

  return (
    <form action={formAction}>
      {/* Email */}
      <div className="mb-4">
        <StaticFormField
          name="email"
          label="Email"
          type="email"
          value={formData.email || ""}
          onChange={handleChange}
          onBlur={() => handleBlur("email")}
          required
          error={getFieldError("email")}
          touched={isFieldTouched("email")}
          autoComplete="email"
          testId="contact-email-input"
        />
      </div>

      {/* Country/Region Dropdown */}
      <div className="mb-4">
        <StaticSelectField
          name="shipping_address.country_code"
          label="Country/Region"
          value={formData["shipping_address.country_code"] || "us"}
          onChange={handleChange}
          onBlur={() => handleBlur("shipping_address.country_code")}
          options={countryOptions}
          required
          testId="shipping-country-select"
        />
      </div>

      {/* Saved Addresses Selector */}
      {customer && addressesInRegion.length > 0 && (
        <Container className="mb-4 flex flex-col gap-y-4 p-5 bg-ui-bg-subtle rounded-lg">
          <p className="text-sm text-ui-fg-subtle">
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

      {/* First name / Last name - side by side */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <StaticFormField
          name="shipping_address.first_name"
          label="First name"
          value={formData["shipping_address.first_name"] || ""}
          onChange={handleChange}
          onBlur={() => handleBlur("shipping_address.first_name")}
          required
          error={getFieldError("shipping_address.first_name")}
          touched={isFieldTouched("shipping_address.first_name")}
          autoComplete="given-name"
          testId="shipping-first-name-input"
        />
        <StaticFormField
          name="shipping_address.last_name"
          label="Last name"
          value={formData["shipping_address.last_name"] || ""}
          onChange={handleChange}
          onBlur={() => handleBlur("shipping_address.last_name")}
          required
          error={getFieldError("shipping_address.last_name")}
          touched={isFieldTouched("shipping_address.last_name")}
          autoComplete="family-name"
          testId="shipping-last-name-input"
        />
      </div>

      {/* Address with Google Places Autocomplete */}
      <div className="mb-4">
        <AddressAutocomplete
          value={formData["shipping_address.address_1"] || ""}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              "shipping_address.address_1": value,
            }))
          }
          onAddressSelect={handleAddressSelect}
          name="shipping_address.address_1"
          label="Address"
          required
          error={
            touched.address_1 ? errors.address_1 : undefined
          }
          onBlur={() => handleBlur("shipping_address.address_1")}
          data-testid="shipping-address-input"
        />
      </div>

      {/* Apartment, suite, etc. (optional) */}
      <div className="mb-4">
        <StaticFormField
          name="shipping_address.company"
          label="Apartment, suite, etc. (optional)"
          value={formData["shipping_address.company"] || ""}
          onChange={handleChange}
          autoComplete="address-line2"
          testId="shipping-company-input"
        />
      </div>

      {/* City / State / ZIP - three columns */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* City */}
        <StaticFormField
          name="shipping_address.city"
          label="City"
          value={formData["shipping_address.city"] || ""}
          onChange={handleChange}
          onBlur={() => handleBlur("shipping_address.city")}
          required
          error={getFieldError("shipping_address.city")}
          touched={isFieldTouched("shipping_address.city")}
          autoComplete="address-level2"
          testId="shipping-city-input"
        />

        {/* State - Dropdown for US, text input for others */}
        {isUS ? (
          <StaticSelectField
            name="shipping_address.province"
            label="State"
            value={formData["shipping_address.province"] || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("shipping_address.province")}
            options={US_STATES}
            required
            error={getFieldError("shipping_address.province")}
            touched={isFieldTouched("shipping_address.province")}
            placeholder="Select state"
            testId="shipping-province-input"
          />
        ) : (
          <StaticFormField
            name="shipping_address.province"
            label="State / Province"
            value={formData["shipping_address.province"] || ""}
            onChange={handleChange}
            onBlur={() => handleBlur("shipping_address.province")}
            required
            error={getFieldError("shipping_address.province")}
            touched={isFieldTouched("shipping_address.province")}
            autoComplete="address-level1"
            testId="shipping-province-input"
          />
        )}

        {/* ZIP/Postal Code */}
        <StaticFormField
          name="shipping_address.postal_code"
          label="ZIP code"
          value={formData["shipping_address.postal_code"] || ""}
          onChange={handleChange}
          onBlur={() => handleBlur("shipping_address.postal_code")}
          required
          error={getFieldError("shipping_address.postal_code")}
          touched={isFieldTouched("shipping_address.postal_code")}
          autoComplete="postal-code"
          testId="shipping-postal-code-input"
        />
      </div>

      {/* Phone (optional) */}
      <div className="mb-4">
        <StaticFormField
          name="shipping_address.phone"
          label="Phone (optional)"
          type="tel"
          value={formData["shipping_address.phone"] || ""}
          onChange={handleChange}
          onBlur={() => handleBlur("shipping_address.phone")}
          error={getFieldError("shipping_address.phone")}
          touched={isFieldTouched("shipping_address.phone")}
          autoComplete="tel"
          testId="shipping-phone-input"
        />
      </div>

      {/* Billing Address Checkbox */}
      <div className="my-6">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              name="same_as_billing_checkbox"
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              className="sr-only peer"
              data-testid="billing-address-checkbox"
            />
            <div
              className={`
                w-5 h-5 border-2 rounded
                transition-colors duration-200
                ${
                  sameAsBilling
                    ? "bg-brand-700 border-brand-700"
                    : "bg-ui-bg-component border-ui-border-base group-hover:border-ui-border-strong"
                }
              `}
            >
              {sameAsBilling && (
                <svg
                  className="w-full h-full text-white p-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-ui-fg-subtle">
            Use shipping address as billing address
          </span>
        </label>
      </div>

      {/* Billing Address (if different) */}
      {!sameAsBilling && (
        <div className="mt-6 pt-6 border-t border-ui-border-base">
          <h3 className="text-base font-medium text-ui-fg-base mb-4">
            Billing address
          </h3>
          <BillingAddress cart={cart} />
        </div>
      )}

      <ErrorMessage error={message} data-testid="address-error-message" />

      {/* Hidden submit - form submits via footer button */}
      <input
        type="hidden"
        name="same_as_billing"
        value={sameAsBilling ? "on" : ""}
      />
    </form>
  )
}

export default ContactDeliveryForm
