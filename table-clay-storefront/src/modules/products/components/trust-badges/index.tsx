import { clx } from "@medusajs/ui"

interface Badge {
  icon: React.ReactNode
  label: string
}

interface TrustBadgesProps {
  layout?: "horizontal" | "vertical"
  size?: "sm" | "md"
  className?: string
  badges?: Badge[]
}

// Inline SVG icons to avoid lucide-react SSR issues
const TruckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
)

const RefreshIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const ShieldIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const DEFAULT_BADGES: Badge[] = [
  { icon: <TruckIcon />, label: "Free Shipping" },
  { icon: <RefreshIcon />, label: "30-Day Money Back" },
  { icon: <ShieldIcon />, label: "Secure Checkout" },
]

/**
 * TrustBadges - Display trust-building badges
 * Free Shipping, 30-Day Returns, Secure Checkout
 */
const TrustBadges = ({
  layout = "vertical",
  size = "md",
  className = "",
  badges = DEFAULT_BADGES,
}: TrustBadgesProps) => {
  const sizeClasses = {
    sm: "text-xs gap-1.5",
    md: "text-sm gap-2",
  }

  return (
    <div
      className={clx(
        "flex",
        layout === "horizontal"
          ? "flex-row flex-wrap justify-center gap-4 sm:gap-6"
          : "flex-col gap-2",
        className
      )}
    >
      {badges.map((badge, index) => (
        <div
          key={index}
          className={clx(
            "flex items-center text-ui-fg-subtle",
            sizeClasses[size]
          )}
        >
          <span className="text-amber-600 flex-shrink-0">{badge.icon}</span>
          <span className="font-medium">{badge.label}</span>
        </div>
      ))}
    </div>
  )
}

export default TrustBadges
