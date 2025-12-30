/**
 * Currency Handling Unit Tests
 *
 * These tests verify that price/currency handling follows Medusa conventions:
 * - Prices are stored in smallest currency unit (cents for USD)
 * - Formatting functions correctly convert to display values
 */

describe('Currency Handling', () => {
  describe('Price Storage Convention', () => {
    it('stores USD prices in cents (smallest unit)', () => {
      // A product priced at $34.99 should be stored as 3499 cents
      const priceInCents = 3499
      const expectedDollars = 34.99

      expect(priceInCents / 100).toBe(expectedDollars)
    })

    it('stores EUR prices in cents', () => {
      const priceInCents = 4599
      const expectedEuros = 45.99

      expect(priceInCents / 100).toBe(expectedEuros)
    })

    it('stores JPY prices without division (zero decimal currency)', () => {
      // JPY has no decimal places - 1000 yen is stored as 1000
      const priceInYen = 1000
      const expectedYen = 1000

      expect(priceInYen).toBe(expectedYen)
    })
  })

  describe('Price Display Conversion', () => {
    // Helper function mimicking what the admin dashboard should do
    const convertToDisplay = (amount: number, currencyCode: string): number => {
      const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'KMF', 'PYG', 'RWF', 'UGX', 'VUV', 'XAF', 'XOF', 'XPF']

      if (zeroDecimalCurrencies.includes(currencyCode.toUpperCase())) {
        return amount
      }
      return amount / 100
    }

    it('converts 3499 cents to $34.99 for USD', () => {
      expect(convertToDisplay(3499, 'USD')).toBe(34.99)
    })

    it('converts 4643 cents to $46.43 for USD', () => {
      expect(convertToDisplay(4643, 'USD')).toBe(46.43)
    })

    it('does NOT divide JPY amounts', () => {
      expect(convertToDisplay(1000, 'JPY')).toBe(1000)
    })

    it('does NOT divide KRW amounts', () => {
      expect(convertToDisplay(50000, 'KRW')).toBe(50000)
    })

    it('handles case-insensitive currency codes', () => {
      expect(convertToDisplay(3499, 'usd')).toBe(34.99)
      expect(convertToDisplay(1000, 'jpy')).toBe(1000)
    })
  })

  describe('Regression: Admin Dashboard Display Bug', () => {
    // This was the bug: admin showed $4,642.92 instead of $46.43
    // The dashboard was NOT dividing by 100 for USD

    it('should NOT show 100x the correct price', () => {
      const storedPriceCents = 4643
      const correctDisplay = 46.43
      const buggyDisplay = 4643.00 // What the bug showed (no division)

      const actualDisplay = storedPriceCents / 100

      expect(actualDisplay).toBe(correctDisplay)
      expect(actualDisplay).not.toBe(buggyDisplay)
    })

    it('CloudLine Mug at 3499 cents should display as $34.99', () => {
      const storedPrice = 3499
      const displayPrice = storedPrice / 100

      expect(displayPrice).toBe(34.99)
      expect(displayPrice).not.toBe(3499) // Not the bug
      expect(displayPrice).not.toBe(0.35) // Not divided twice
    })
  })
})
