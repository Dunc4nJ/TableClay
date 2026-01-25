/**
 * Safely convert Decimal/BigNumber/string to primitive number
 * Handles Medusa's query.graph Decimal objects (from MikroORM)
 */
export function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") return isNaN(val) ? 0 : val

  // Handle Decimal.js / BigNumber objects
  if (typeof val === "object" && val !== null) {
    if (typeof (val as { toNumber?: () => number }).toNumber === "function") {
      const num = (val as { toNumber: () => number }).toNumber()
      return isNaN(num) ? 0 : num
    }
    if (typeof (val as { toString?: () => string }).toString === "function") {
      const parsed = parseFloat((val as { toString: () => string }).toString())
      return isNaN(parsed) ? 0 : parsed
    }
  }

  // Handle string numbers
  if (typeof val === "string") {
    const parsed = parseFloat(val)
    return isNaN(parsed) ? 0 : parsed
  }

  return 0
}
