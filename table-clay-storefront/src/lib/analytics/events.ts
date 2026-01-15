declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

const getDataLayer = (): Record<string, unknown>[] | null => {
  if (typeof window === "undefined") {
    return null
  }

  window.dataLayer = window.dataLayer || []
  return window.dataLayer
}

export const pushToDataLayer = (payload: Record<string, unknown>) => {
  const dataLayer = getDataLayer()
  if (!dataLayer) {
    return
  }

  dataLayer.push(payload)
}

export const pushEcommerceEvent = (payload: Record<string, unknown>) => {
  const dataLayer = getDataLayer()
  if (!dataLayer) {
    return
  }

  dataLayer.push({ ecommerce: null })
  dataLayer.push(payload)
}

export const generateEventId = (prefix: string) => {
  const safePrefix = prefix.replace(/\s+/g, "_")
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : null

  if (uuid) {
    return `${safePrefix}_${uuid}`
  }

  return `${safePrefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}
