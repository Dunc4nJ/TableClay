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

// Inline SVG icons to avoid lucide-react SSR issues
const HandsIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
  </svg>
)

const SparklesIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
)

const HomeIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const HeartIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
)

const DEFAULT_BENEFITS: Benefit[] = [
  {
    icon: <HandsIcon />,
    title: "Handcrafted with Care",
    description: "Each piece made by skilled artisans in our studio",
  },
  {
    icon: <SparklesIcon />,
    title: "Unique Glazes",
    description: "One-of-a-kind finishes that make every piece special",
  },
  {
    icon: <HomeIcon />,
    title: "Studio to Table",
    description: "Direct from our workshop to your home",
  },
  {
    icon: <HeartIcon />,
    title: "Made with Love",
    description: "Passion and attention in every detail",
  },
]

/**
 * BenefitsSection - "Why Choose Table Clay" section
 * Shows 4 benefits in a grid with icons, titles, and descriptions
 */
const BenefitsSection = ({
  title = "Why Choose Table Clay",
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
