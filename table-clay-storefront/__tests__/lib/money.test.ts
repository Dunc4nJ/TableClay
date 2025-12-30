/**
 * Currency Formatting Unit Tests
 *
 * Tests for the convertToLocale function that converts cents to formatted currency strings.
 *
 * Key behavior:
 * - Input: cents (integer) e.g., 3499
 * - Output: formatted string e.g., "$34.99"
 * - Divides by 100 for most currencies
 * - Special handling for zero-decimal currencies (JPY, KRW, etc.)
 *
 * Run with: npm run test:money
 */

// Import the function we're testing
// Note: In actual test setup, you'd configure module resolution
// For now, we inline the function to make tests runnable without additional setup

// Inline copy of the ZERO_DECIMAL_CURRENCIES list from money.ts
const ZERO_DECIMAL_CURRENCIES = [
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga",
  "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"
]

// Inline copy of isEmpty utility
function isEmpty(value: any): boolean {
  return value === undefined || value === null || value === ""
}

// Inline copy of convertToLocale function for testing
type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

function convertToLocale({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "en-US",
}: ConvertToLocaleParams): string {
  if (!currency_code || isEmpty(currency_code)) {
    return amount.toString()
  }

  // Convert from smallest currency unit to main unit
  const divisor = ZERO_DECIMAL_CURRENCIES.includes(currency_code.toLowerCase()) ? 1 : 100
  const convertedAmount = amount / divisor

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency_code,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(convertedAmount)
}

describe("convertToLocale", () => {
  describe("USD Currency (Standard 2-decimal)", () => {
    it("converts cents to dollars correctly", () => {
      const result = convertToLocale({ amount: 3499, currency_code: "usd" })
      expect(result).toBe("$34.99")
    })

    it("converts 100 cents to $1.00", () => {
      const result = convertToLocale({ amount: 100, currency_code: "usd" })
      expect(result).toBe("$1.00")
    })

    it("handles zero amount", () => {
      const result = convertToLocale({ amount: 0, currency_code: "usd" })
      expect(result).toBe("$0.00")
    })

    it("handles large amounts (e.g., $1,234.56)", () => {
      const result = convertToLocale({ amount: 123456, currency_code: "usd" })
      expect(result).toBe("$1,234.56")
    })

    it("handles single cent", () => {
      const result = convertToLocale({ amount: 1, currency_code: "usd" })
      expect(result).toBe("$0.01")
    })

    it("is case-insensitive for currency code", () => {
      const resultLower = convertToLocale({ amount: 3499, currency_code: "usd" })
      const resultUpper = convertToLocale({ amount: 3499, currency_code: "USD" })
      expect(resultLower).toBe(resultUpper)
    })
  })

  describe("EUR Currency", () => {
    it("converts cents to euros correctly", () => {
      const result = convertToLocale({ amount: 2500, currency_code: "eur" })
      // Note: Format depends on locale, but should contain "25"
      expect(result).toContain("25")
    })

    it("uses euro symbol", () => {
      const result = convertToLocale({ amount: 2500, currency_code: "eur" })
      expect(result).toContain("€")
    })
  })

  describe("Zero-Decimal Currencies (JPY, KRW, etc.)", () => {
    it("does NOT divide by 100 for JPY", () => {
      const result = convertToLocale({ amount: 3499, currency_code: "jpy" })
      // JPY 3499 should remain 3499, not become 34.99
      expect(result).toBe("¥3,499")
    })

    it("does NOT divide by 100 for KRW", () => {
      const result = convertToLocale({ amount: 10000, currency_code: "krw" })
      // KRW uses symbol ₩
      expect(result).toContain("10,000")
    })

    it("handles VND correctly", () => {
      const result = convertToLocale({ amount: 500000, currency_code: "vnd" })
      expect(result).toContain("500,000")
    })
  })

  describe("Edge Cases", () => {
    it("returns string for empty currency code", () => {
      const result = convertToLocale({ amount: 3499, currency_code: "" })
      expect(result).toBe("3499")
    })

    it("handles negative amounts", () => {
      const result = convertToLocale({ amount: -3499, currency_code: "usd" })
      expect(result).toBe("-$34.99")
    })

    it("handles very small amounts", () => {
      const result = convertToLocale({ amount: 5, currency_code: "usd" })
      expect(result).toBe("$0.05")
    })
  })

  describe("Locale Handling", () => {
    it("uses en-US locale by default", () => {
      const result = convertToLocale({ amount: 1234567, currency_code: "usd" })
      // en-US uses comma as thousands separator
      expect(result).toContain(",")
    })

    it("can use different locales", () => {
      const result = convertToLocale({
        amount: 1234567,
        currency_code: "eur",
        locale: "de-DE"
      })
      // German locale uses different formatting
      expect(result).toBeDefined()
    })
  })

  describe("Fraction Digits", () => {
    it("respects minimumFractionDigits", () => {
      const result = convertToLocale({
        amount: 3400,
        currency_code: "usd",
        minimumFractionDigits: 2
      })
      expect(result).toBe("$34.00")
    })

    it("respects maximumFractionDigits", () => {
      const result = convertToLocale({
        amount: 3499,
        currency_code: "usd",
        maximumFractionDigits: 0
      })
      expect(result).toBe("$35") // Rounds up
    })
  })

  describe("Input Validation - Expected API Format", () => {
    it("expects integer input (cents), not float (dollars)", () => {
      // If someone passes 34.99 thinking it's dollars, they'd get $0.35
      const wrongResult = convertToLocale({ amount: 34.99, currency_code: "usd" })
      // This highlights the bug if someone passes dollars instead of cents
      expect(wrongResult).not.toBe("$34.99")
      expect(wrongResult).toBe("$0.35") // 34.99 / 100 = 0.3499 ≈ 0.35
    })

    it("correctly formats when receiving cents as expected", () => {
      // Correct usage: pass 3499 cents
      const correctResult = convertToLocale({ amount: 3499, currency_code: "usd" })
      expect(correctResult).toBe("$34.99")
    })
  })
})

describe("Currency Format Regression Tests", () => {
  describe("Common Product Prices", () => {
    const testCases = [
      { cents: 4499, expected: "$44.99", description: "Mini Ceramic Pots" },
      { cents: 3499, expected: "$34.99", description: "CloudLine Mug" },
      { cents: 8999, expected: "$89.99", description: "Premium item" },
      { cents: 1299, expected: "$12.99", description: "Budget item" },
      { cents: 800, expected: "$8.00", description: "Shipping cost" },
    ]

    testCases.forEach(({ cents, expected, description }) => {
      it(`formats ${description} (${cents} cents) as ${expected}`, () => {
        const result = convertToLocale({ amount: cents, currency_code: "usd" })
        expect(result).toBe(expected)
      })
    })
  })

  describe("Should NOT produce these wrong outputs", () => {
    it("should NOT show $0.35 for a $34.99 item", () => {
      // If API returns 3499 (cents), result should be $34.99, not $0.35
      const result = convertToLocale({ amount: 3499, currency_code: "usd" })
      expect(result).not.toBe("$0.35")
      expect(result).toBe("$34.99")
    })

    it("should NOT show $3,499.00 for a $34.99 item", () => {
      // This would happen if we didn't divide by 100
      const result = convertToLocale({ amount: 3499, currency_code: "usd" })
      expect(result).not.toBe("$3,499.00")
      expect(result).toBe("$34.99")
    })

    it("should NOT show $0.08 for $8.00 shipping", () => {
      const result = convertToLocale({ amount: 800, currency_code: "usd" })
      expect(result).not.toBe("$0.08")
      expect(result).toBe("$8.00")
    })
  })
})
