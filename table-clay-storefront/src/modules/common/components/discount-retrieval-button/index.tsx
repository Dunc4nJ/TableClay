"use client"

import { Gift } from "@medusajs/icons"
import { useState, useEffect } from "react"
import { useLocalStorageExpiry } from "@lib/hooks/use-local-storage"
import {
  NEWSLETTER_DISMISSED_KEY,
  NEWSLETTER_SUBSCRIBED_KEY,
} from "../newsletter-modal"
import NewsletterModal from "../newsletter-modal"

const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const SUBSCRIBE_DURATION_MS = 365 * 24 * 60 * 60 * 1000 // 1 year

/**
 * Floating button that appears after user dismisses the newsletter popup
 * but hasn't subscribed yet. Allows them to retrieve the discount code
 * by reopening the newsletter modal.
 *
 * Positioned above the free shipping price nudge (bottom-20 vs bottom-5)
 */
export default function DiscountRetrievalButton() {
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Check localStorage states (same durations as newsletter modal)
  const [wasDismissed] = useLocalStorageExpiry(
    NEWSLETTER_DISMISSED_KEY,
    DISMISS_DURATION_MS
  )
  const [wasSubscribed] = useLocalStorageExpiry(
    NEWSLETTER_SUBSCRIBED_KEY,
    SUBSCRIBE_DURATION_MS
  )

  // Handle hydration - only show after client mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render during SSR or if conditions not met
  // Show only if: dismissed (recently) AND NOT subscribed
  if (!mounted || !wasDismissed || wasSubscribed) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-5 z-20 w-12 h-12 rounded-full bg-brand-800 hover:bg-brand-900 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 animate-fade-in"
        aria-label="Get discount code"
        title="Get your free shipping code"
      >
        <Gift className="w-6 h-6" />
      </button>
      {showModal && (
        <NewsletterModal forceOpen onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
