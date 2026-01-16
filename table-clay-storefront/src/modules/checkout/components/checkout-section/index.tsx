import { clx } from "@medusajs/ui"

interface CheckoutSectionProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  /**
   * If true, don't render the bottom border
   */
  noBorder?: boolean
}

const CheckoutSection: React.FC<CheckoutSectionProps> = ({
  title,
  subtitle,
  children,
  className,
  noBorder = false,
}) => {
  return (
    <div
      className={clx(
        "py-6",
        { "border-b border-ui-border-base": !noBorder },
        className
      )}
    >
      <h2 className="text-lg font-semibold text-ui-fg-base mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-ui-fg-muted mb-4">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

export default CheckoutSection
