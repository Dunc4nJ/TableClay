"use client"

import { useEffect, useState } from "react"

const TOTAL_SECONDS = 10 * 60

type AdditionalItemBannerProps = {
  visible: boolean
}

function LightningIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13 2L3 14h6l-2 8 10-12h-6l2-8z" />
    </svg>
  )
}

function TimerIcon({ className }: { className?: string }) {
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
      focusable="false"
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
      <path d="M9 2h6" />
    </svg>
  )
}

/**
 * Promotional banner with countdown timer.
 * - Animated gradient background (warm yellow/amber)
 * - Looping 10-minute countdown timer (cosmetic)
 * - Responsive design
 * - Only renders when visible prop is true
 */
export default function AdditionalItemBanner({
  visible,
}: AdditionalItemBannerProps) {
  const [seconds, setSeconds] = useState(TOTAL_SECONDS)

  useEffect(() => {
    if (!visible) {
      setSeconds(TOTAL_SECONDS)
      return
    }

    setSeconds(TOTAL_SECONDS)

    const interval = setInterval(() => {
      setSeconds((prev) => (prev <= 0 ? TOTAL_SECONDS : prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [visible])

  if (!visible) {
    return null
  }

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(
    secs
  ).padStart(2, "0")}`

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)",
        backgroundSize: "200% 100%",
        animation: "gradientShift 3s ease infinite",
      }}
    >
      <style jsx>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>

      <div className="content-container py-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-black">
          <div className="flex items-center gap-2">
            <LightningIcon className="w-5 h-5" />
            <span className="font-bold text-xs sm:text-sm tracking-wide">
              ADD MORE ITEMS FOR 10% OFF EACH!
            </span>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1 bg-black/10 rounded-full"
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          >
            <TimerIcon className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">
              {timeDisplay}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
