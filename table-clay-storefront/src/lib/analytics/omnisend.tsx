"use client"

import Script from "next/script"

const getBrandId = () => process.env.NEXT_PUBLIC_OMNISEND_BRAND_ID?.trim()

const getQueue = () => {
  if (typeof window === "undefined") {
    return null
  }

  window.omnisend = window.omnisend || []
  return window.omnisend
}

export const trackOmnisendEvent = (
  eventName: string,
  properties?: Record<string, unknown>
) => {
  if (typeof eventName !== "string" || !eventName.trim()) {
    return
  }

  const queue = getQueue()
  if (!queue) {
    return
  }

  queue.push(["track", eventName, properties ?? {}])
}

export const identifyOmnisendContact = (email: string) => {
  if (typeof email !== "string") {
    return
  }

  const trimmedEmail = email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return
  }

  const queue = getQueue()
  if (!queue) {
    return
  }

  queue.push(["track", "$contactIdentified", { email: trimmedEmail }])
}

export default function OmnisendScript() {
  const brandId = getBrandId()

  if (!brandId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Omnisend disabled: NEXT_PUBLIC_OMNISEND_BRAND_ID is not set.")
    }
    return null
  }

  return (
    <>
      <Script id="omnisend-init" strategy="afterInteractive">
        {`window.omnisend = window.omnisend || [];
window.omnisend.push(["accountID", "${brandId}"]);
window.omnisend.push(["track", "$pageViewed"]);`}
      </Script>
      <Script
        id="omnisend-loader"
        src="https://omnisnippet1.com/inshop/launcher-v2.js"
        strategy="afterInteractive"
      />
    </>
  )
}
