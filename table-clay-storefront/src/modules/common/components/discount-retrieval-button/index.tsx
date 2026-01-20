"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useLocalStorageExpiry } from "@lib/hooks/use-local-storage"
import {
  NEWSLETTER_DISMISSED_KEY,
  NEWSLETTER_SUBSCRIBED_KEY,
} from "../newsletter-modal"

// Dynamic import to prevent caching issues
const NewsletterModal = dynamic(() => import("../newsletter-modal"), {
  ssr: false,
})

const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const SUBSCRIBE_DURATION_MS = 365 * 24 * 60 * 60 * 1000 // 1 year

/**
 * Gift icon component with explicit centering
 * Using inline SVG for pixel-perfect alignment
 */
function GiftIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
    </svg>
  )
}

/**
 * Floating button that appears after user dismisses the newsletter popup
 * but hasn't subscribed yet. Allows them to retrieve the discount code
 * by reopening the newsletter modal.
 *
 * Positioned in the bottom-right corner with pulse animation
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
        className="fixed bottom-5 right-5 z-20 w-14 h-14 rounded-full bg-brand-800 hover:bg-brand-900 text-white shadow-lg grid place-items-center transition-colors duration-200 hover:scale-105 animate-pulse-ring"
        aria-label="Get discount code"
        title="Get your free shipping code"
        style={{
          // Ensure perfect centering with explicit grid
          display: "grid",
          placeItems: "center",
        }}
      >
        <GiftIcon className="w-6 h-6" />
      </button>
      {showModal && (
        <NewsletterModal forceOpen onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
