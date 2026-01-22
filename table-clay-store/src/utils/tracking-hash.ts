import crypto from "crypto"

export const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex")

export const normalizeEmail = (
  email: string | null | undefined
): string | null => {
  if (!email) return null
  const normalized = email.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

export const normalizePhone = (
  phone: string | null | undefined
): string | null => {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 10 ? digits : null
}

export const hashForTracking = (
  value: string | null | undefined
): string | null => {
  if (!value) return null
  return sha256(value)
}
