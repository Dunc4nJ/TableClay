"use client"

type CookieMap = Record<string, string>

const readCookies = (): CookieMap => {
  if (typeof document === "undefined") {
    return {}
  }

  const raw = document.cookie
  if (!raw) {
    return {}
  }

  return raw.split(";").reduce<CookieMap>((acc, cookie) => {
    const [key, ...rest] = cookie.trim().split("=")
    if (!key) {
      return acc
    }
    acc[key] = rest.join("=")
    return acc
  }, {})
}

const readSessionValue = (key: string): string | null => {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

const writeSessionValue = (key: string, value: string) => {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    return
  }
}

const fallbackUUID = () => {
  const bytes = new Uint8Array(16)

  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Get Meta tracking cookies (_fbp, _fbc)
 */
export const getMetaCookies = (): { fbp?: string; fbc?: string } => {
  const cookies = readCookies()

  return {
    fbp: cookies["_fbp"] || undefined,
    fbc: cookies["_fbc"] || undefined,
  }
}

/**
 * Get TikTok tracking identifiers (_ttp cookie, ttclid from URL)
 */
export const getTikTokIdentifiers = (): {
  ttclid?: string
  ttp?: string
} => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return {}
  }

  const cookies = readCookies()
  const urlParams = new URLSearchParams(window.location.search)
  const urlValue = urlParams.get("ttclid")
  const storedValue = readSessionValue("ttclid")
  const ttclid = urlValue || storedValue || undefined

  if (urlValue) {
    writeSessionValue("ttclid", urlValue)
  }

  return {
    ttp: cookies["_ttp"] || undefined,
    ttclid,
  }
}

/**
 * Generate a unique event ID for deduplication
 */
export const generateEventId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return fallbackUUID()
}

/**
 * Get all tracking data at once (convenience function)
 */
export const getAllTrackingData = () => {
  const eventId = generateEventId()
  const meta = getMetaCookies()
  const tiktok = getTikTokIdentifiers()

  return {
    event_id: eventId,
    _fbp: meta.fbp,
    _fbc: meta.fbc,
    _ttp: tiktok.ttp,
    ttclid: tiktok.ttclid,
    client_user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  }
}
