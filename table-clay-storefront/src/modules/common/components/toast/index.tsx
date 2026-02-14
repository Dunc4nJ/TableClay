"use client"

import { useEffect, useRef, useState } from "react"

type ToastProps = {
  message: string
  visible: boolean
  onDismiss: () => void
  duration?: number
}

/**
 * Lightweight toast notification for transient user feedback.
 * Renders fixed at bottom-center, auto-dismisses, accessible via aria-live.
 */
export default function Toast({
  message,
  visible,
  onDismiss,
  duration = 4000,
}: ToastProps) {
  const [show, setShow] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameRef = useRef<number | null>(null)

  const clearTimers = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current)
      dismissTimerRef.current = null
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }

  useEffect(() => {
    if (visible) {
      // Small delay to trigger CSS transition
      frameRef.current = requestAnimationFrame(() => setShow(true))
      dismissTimerRef.current = setTimeout(() => {
        setShow(false)
        closeTimerRef.current = setTimeout(onDismiss, 300) // Wait for exit animation
      }, duration)
      return clearTimers
    } else {
      setShow(false)
    }
  }, [visible, duration, onDismiss])

  useEffect(() => clearTimers, [])

  if (!visible) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] pointer-events-auto transition-all duration-300 ${
        show
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2"
      }`}
    >
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 shadow-lg flex items-start gap-3 text-sm">
        <svg
          className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <span className="flex-1">{message}</span>
        <button
          onClick={() => {
            clearTimers()
            setShow(false)
            closeTimerRef.current = setTimeout(onDismiss, 300)
          }}
          className="text-red-400 hover:text-red-600 flex-shrink-0 -mt-0.5"
          aria-label="Dismiss"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
