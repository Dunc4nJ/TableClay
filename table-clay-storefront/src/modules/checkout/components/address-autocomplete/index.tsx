"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { debounce } from "lodash"
import { MagnifyingGlass } from "@medusajs/icons"

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

interface AddressSuggestion {
  place_id: string
  description: string
  structured: {
    main_text: string
    secondary_text: string
  }
}

interface AddressDetails {
  address_1: string
  address_2: string
  city: string
  state: string
  postal_code: string
  country_code: string
  formatted_address: string
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onAddressSelect: (address: AddressDetails) => void
  name?: string
  label?: string
  required?: boolean
  error?: string
  onBlur?: () => void
  disabled?: boolean
  "data-testid"?: string
}

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onAddressSelect,
  name = "address",
  label = "Address",
  required = false,
  error,
  onBlur,
  disabled = false,
  "data-testid": testId,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch address suggestions from backend API
  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `${BACKEND_URL}/store/address-autocomplete?input=${encodeURIComponent(input)}`,
        {
          headers: {
            "x-publishable-api-key": PUBLISHABLE_KEY,
          },
        }
      )
      const data = await response.json()

      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions)
        setShowDropdown(data.suggestions.length > 0)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      console.error("Failed to fetch address suggestions:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(
    debounce((input: string) => fetchSuggestions(input), 300),
    []
  )

  // Fetch address details when user selects a suggestion
  const handleSelect = async (suggestion: AddressSuggestion) => {
    setShowDropdown(false)
    setIsLoading(true)

    try {
      const response = await fetch(
        `${BACKEND_URL}/store/address-autocomplete/details?place_id=${encodeURIComponent(suggestion.place_id)}`,
        {
          headers: {
            "x-publishable-api-key": PUBLISHABLE_KEY,
          },
        }
      )
      const data = await response.json()

      if (data.success && data.address) {
        // Update the input with the selected address
        onChange(data.address.address_1)
        // Notify parent with full address details
        onAddressSelect(data.address)
      }
    } catch (error) {
      console.error("Failed to fetch address details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    debouncedFetch(newValue)
    setSelectedIndex(-1)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case "Escape":
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle blur with delay to allow click on dropdown
  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false)
      setSelectedIndex(-1)
      onBlur?.()
    }, 200)
  }

  // Handle focus - show dropdown if suggestions exist
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true)
    }
  }

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedFetch.cancel()
    }
  }, [debouncedFetch])

  const hasError = Boolean(error)

  return (
    <div className="relative w-full">
      {/* Static label above input */}
      <label
        htmlFor={name}
        onClick={() => inputRef.current?.focus()}
        className={`
          block text-sm font-medium mb-1.5
          ${hasError ? "text-rose-500" : "text-gray-700"}
        `}
      >
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {/* Input with search icon */}
      <div className="relative">
        <input
          ref={inputRef}
          id={name}
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          autoComplete="off"
          placeholder="Start typing an address..."
          className={`
            block w-full h-11 px-4 pr-10 py-2
            bg-ui-bg-field border rounded-md appearance-none
            text-ui-fg-base placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-tc-terracotta focus:border-tc-terracotta
            hover:bg-ui-bg-field-hover
            transition-colors duration-150
            ${hasError ? "border-rose-500" : "border-ui-border-base"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
          data-testid={testId}
        />
        {/* Search/loading icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-fg-muted pointer-events-none">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-ui-fg-muted border-t-transparent rounded-full animate-spin" />
          ) : (
            <MagnifyingGlass className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Error message */}
      {hasError && (
        <p className="mt-1 text-sm text-rose-500">{error}</p>
      )}

      {/* Dropdown suggestions - max 5 */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-ui-border-base rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.slice(0, 5).map((suggestion, index, arr) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`
                w-full px-4 py-3 text-left hover:bg-ui-bg-subtle transition-colors
                ${index === selectedIndex ? "bg-ui-bg-subtle" : ""}
                ${index !== arr.length - 1 ? "border-b border-ui-border-base" : ""}
              `}
            >
              <div className="text-sm font-medium text-ui-fg-base">
                {suggestion.structured.main_text}
              </div>
              <div className="text-xs text-ui-fg-muted">
                {suggestion.structured.secondary_text}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default AddressAutocomplete
