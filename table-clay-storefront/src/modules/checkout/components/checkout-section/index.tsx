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
        { "border-b border-gray-200": !noBorder },
        className
      )}
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

export default CheckoutSection
