import { Truck, RefreshCw, Shield } from "lucide-react"
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

const DEFAULT_BADGES: Badge[] = [
  { icon: <Truck className="w-4 h-4" />, label: "Free Shipping" },
  { icon: <RefreshCw className="w-4 h-4" />, label: "30-Day Money Back" },
  { icon: <Shield className="w-4 h-4" />, label: "Secure Checkout" },
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
