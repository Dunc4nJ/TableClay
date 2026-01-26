"use client"

import { useState, useEffect } from "react"

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

const OMNISEND_FORM_ID = "6976a0a234d1fec67da55880"

/**
 * Floating gift button that triggers the Omnisend newsletter form.
 * Always visible in the bottom-right corner with pulse animation.
 */
export default function DiscountRetrievalButton() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpenForm = () => {
    if (typeof window !== "undefined") {
      window.omnisend = window.omnisend || []
      
      // Debug: log what we're doing
      console.log("[Omnisend] Attempting to open form:", OMNISEND_FORM_ID)
      console.log("[Omnisend] Queue before push:", window.omnisend)
      
      window.omnisend.push(["openForm", OMNISEND_FORM_ID])
      
      console.log("[Omnisend] Queue after push:", window.omnisend)
    }
  }

  // Don't render during SSR
  if (!mounted) {
    return null
  }

  return (
    <button
      onClick={handleOpenForm}
      className="fixed bottom-5 right-5 z-20 w-14 h-14 rounded-full bg-brand-800 hover:bg-brand-900 text-white shadow-lg grid place-items-center transition-colors duration-200 hover:scale-105 animate-pulse-ring"
      aria-label="Get discount code"
      title="Get your free shipping code"
      style={{
        display: "grid",
        placeItems: "center",
      }}
    >
      <GiftIcon className="w-6 h-6" />
    </button>
  )
}
