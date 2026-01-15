"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { motion } from "framer-motion"

type CollectionFilterButtonsProps = {
  collections: HttpTypes.StoreCollection[]
  activeCollectionId: string | null
  onCollectionChange: (collectionId: string | null) => void
}

// Collection theme configurations with gradient colors for dots
const collectionThemes: Record<string, { gradient: string; dotGradient: string; bgColor: string; borderGradient: string }> = {
  "cloud-line": {
    gradient: "from-sky-100 to-blue-200",
    dotGradient: "from-sky-400 to-blue-500",
    bgColor: "bg-sky-50",
    borderGradient: "from-sky-400 via-blue-500 to-sky-400",
  },
  "modern-line": {
    gradient: "from-slate-200 to-gray-300",
    dotGradient: "from-slate-400 to-gray-500",
    bgColor: "bg-slate-100",
    borderGradient: "from-slate-400 via-gray-500 to-slate-400",
  },
  "japanese-line": {
    gradient: "from-rose-100 to-red-200",
    dotGradient: "from-rose-400 to-red-500",
    bgColor: "bg-rose-50",
    borderGradient: "from-rose-400 via-red-500 to-rose-400",
  },
  "love-line": {
    gradient: "from-pink-100 to-rose-200",
    dotGradient: "from-pink-400 to-rose-500",
    bgColor: "bg-pink-50",
    borderGradient: "from-pink-400 via-rose-500 to-pink-400",
  },
  "nature-line": {
    gradient: "from-emerald-100 to-green-200",
    dotGradient: "from-emerald-400 to-green-500",
    bgColor: "bg-emerald-50",
    borderGradient: "from-emerald-400 via-green-500 to-emerald-400",
  },
  "no-line": {
    gradient: "from-amber-100 to-orange-200",
    dotGradient: "from-amber-400 to-orange-500",
    bgColor: "bg-amber-50",
    borderGradient: "from-amber-400 via-orange-500 to-amber-400",
  },
}

const defaultTheme = {
  gradient: "from-stone-100 to-stone-200",
  dotGradient: "from-stone-400 to-stone-500",
  bgColor: "bg-stone-50",
  borderGradient: "from-stone-400 via-stone-500 to-stone-400",
}

const getCollectionTheme = (handle: string | undefined) => {
  if (!handle) return defaultTheme
  return collectionThemes[handle] || defaultTheme
}

// Animated gradient dot component
const GradientDot = ({
  gradientClass,
  isActive
}: {
  gradientClass: string
  isActive: boolean
}) => (
  <motion.div
    className={clx(
      "w-3 h-3 rounded-full bg-gradient-to-br flex-shrink-0",
      gradientClass
    )}
    animate={{
      scale: isActive ? [1, 1.2, 1] : 1,
      opacity: isActive ? 1 : 0.8,
    }}
    transition={{
      repeat: isActive ? Infinity : 0,
      duration: 2,
      ease: "easeInOut",
    }}
  />
)

// Container animation variants for staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

// Button animation variants
const buttonVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 20,
    },
  },
}

// Animated button wrapper with rotating gradient border on hover
const AnimatedButton = ({
  children,
  isActive,
  onClick,
  theme,
  className,
}: {
  children: React.ReactNode
  isActive: boolean
  onClick: () => void
  theme: { gradient: string; bgColor: string; borderGradient: string }
  className?: string
}) => (
  <motion.button
    variants={buttonVariants}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={clx(
      "group relative overflow-hidden rounded-lg",
      className
    )}
  >
    {/* Rotating gradient border - visible on hover */}
    <div
      className={clx(
        "absolute inset-0 rounded-lg bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        theme.borderGradient,
        isActive && "opacity-100",
        "animate-spin-slow"
      )}
      style={{
        padding: "1px",
        background: `conic-gradient(from 0deg, transparent, ${isActive ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)'}, transparent)`,
      }}
    />

    {/* Inner content container */}
    <div
      className={clx(
        "relative flex items-center gap-2 px-3 py-2 rounded-[7px] text-sm font-medium transition-all duration-200",
        "border",
        isActive
          ? `bg-gradient-to-br ${theme.gradient} border-transparent shadow-md`
          : `${theme.bgColor} border-ui-border-base hover:border-ui-border-strong text-ui-fg-base`
      )}
    >
      {children}
    </div>
  </motion.button>
)

const CollectionFilterButtons = ({
  collections,
  activeCollectionId,
  onCollectionChange,
}: CollectionFilterButtonsProps) => {
  const allButtonTheme = {
    gradient: "from-stone-800 to-stone-900",
    bgColor: "bg-white",
    borderGradient: "from-stone-600 via-stone-800 to-stone-600",
    dotGradient: "from-stone-600 to-stone-800",
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-ui-fg-muted uppercase tracking-wider">
        Collections
      </span>
      <motion.div
        className="flex flex-wrap gap-2 small:grid small:grid-cols-2 small:gap-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* All Products Button */}
        <AnimatedButton
          isActive={!activeCollectionId}
          onClick={() => onCollectionChange(null)}
          theme={allButtonTheme}
          className={clx(
            !activeCollectionId && "ring-2 ring-ui-fg-base ring-offset-1"
          )}
        >
          <GradientDot
            gradientClass={allButtonTheme.dotGradient}
            isActive={!activeCollectionId}
          />
          <span className={clx(
            "truncate",
            !activeCollectionId ? "text-white" : "text-ui-fg-base"
          )}>
            All
          </span>
        </AnimatedButton>

        {/* Collection Buttons */}
        {collections.map((collection) => {
          const theme = getCollectionTheme(collection.handle)
          const isActive = activeCollectionId === collection.id

          return (
            <AnimatedButton
              key={collection.id}
              isActive={isActive}
              onClick={() => onCollectionChange(collection.id)}
              theme={theme}
              className={clx(
                isActive && "ring-2 ring-ui-fg-base ring-offset-1"
              )}
            >
              <GradientDot
                gradientClass={theme.dotGradient}
                isActive={isActive}
              />
              <span className="truncate">{collection.title}</span>
            </AnimatedButton>
          )
        })}
      </motion.div>
    </div>
  )
}

export default CollectionFilterButtons
