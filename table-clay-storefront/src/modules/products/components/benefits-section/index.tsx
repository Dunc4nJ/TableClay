import { Hand, Sparkles, Leaf, Gift } from "lucide-react"
import { clx } from "@medusajs/ui"

interface Benefit {
  icon: React.ReactNode
  title: string
  description: string
}

interface BenefitsSectionProps {
  title?: string
  benefits?: Benefit[]
  className?: string
}

const DEFAULT_BENEFITS: Benefit[] = [
  {
    icon: <Hand className="w-8 h-8" />,
    title: "Keep Your Hands Active",
    description: "Helps keep fingers nimble and coordinated",
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Stay Creative and Confident",
    description: "Create something beautiful with your own hands",
  },
  {
    icon: <Leaf className="w-8 h-8" />,
    title: "Relax and unwind",
    description: "A calming activity to unwind anytime at home",
  },
  {
    icon: <Gift className="w-8 h-8" />,
    title: "Share Your Creations",
    description: "Handmade gifts your family will cherish",
  },
]

/**
 * BenefitsSection - "How it works" or "Why You'll Love It" section
 * Shows 4 benefits in a grid with icons, titles, and descriptions
 */
const BenefitsSection = ({
  title = "How it works",
  benefits = DEFAULT_BENEFITS,
  className = "",
}: BenefitsSectionProps) => {
  return (
    <section className={clx("py-12 bg-ui-bg-subtle", className)}>
      <div className="content-container">
        <h2 className="text-2xl font-semibold text-center mb-10">{title}</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              {/* Icon in amber circle */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4">
                {benefit.icon}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-base mb-2">{benefit.title}</h3>

              {/* Description */}
              <p className="text-sm text-ui-fg-subtle leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default BenefitsSection
