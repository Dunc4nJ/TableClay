"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type CollectionFilterButtonsProps = {
  collections: HttpTypes.StoreCollection[]
  activeCollectionId: string | null
  onCollectionChange: (collectionId: string | null) => void
}

// Collection theme configurations with colors and icons
const collectionThemes: Record<string, { gradient: string; icon: string; bgColor: string }> = {
  "cloud-line": {
    gradient: "from-sky-100 to-blue-200",
    bgColor: "bg-sky-50",
    icon: "\u2601\uFE0F", // Cloud emoji
  },
  "modern-line": {
    gradient: "from-slate-200 to-gray-300",
    bgColor: "bg-slate-100",
    icon: "\u25A0", // Square
  },
  "japanese-line": {
    gradient: "from-rose-100 to-red-200",
    bgColor: "bg-rose-50",
    icon: "\uD83C\uDF38", // Cherry blossom
  },
  "love-line": {
    gradient: "from-pink-100 to-rose-200",
    bgColor: "bg-pink-50",
    icon: "\u2764\uFE0F", // Heart
  },
  "nature-line": {
    gradient: "from-emerald-100 to-green-200",
    bgColor: "bg-emerald-50",
    icon: "\uD83C\uDF3F", // Herb/leaf
  },
  "no-line": {
    gradient: "from-amber-100 to-orange-200",
    bgColor: "bg-amber-50",
    icon: "\u2728", // Sparkles
  },
}

const defaultTheme = {
  gradient: "from-stone-100 to-stone-200",
  bgColor: "bg-stone-50",
  icon: "\u25CF", // Circle
}

const getCollectionTheme = (handle: string | undefined) => {
  if (!handle) return defaultTheme
  return collectionThemes[handle] || defaultTheme
}

const CollectionFilterButtons = ({
  collections,
  activeCollectionId,
  onCollectionChange,
}: CollectionFilterButtonsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-ui-fg-muted uppercase tracking-wider">
        Collections
      </span>
      <div className="flex flex-wrap gap-2 small:grid small:grid-cols-2 small:gap-2">
        {/* All Products Button */}
        <button
          onClick={() => onCollectionChange(null)}
          className={clx(
            "group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
            "border border-ui-border-base hover:border-ui-border-strong",
            "hover:shadow-sm active:scale-[0.98]",
            !activeCollectionId
              ? "bg-gradient-to-br from-stone-800 to-stone-900 text-white border-stone-700 shadow-md"
              : "bg-white text-ui-fg-base hover:bg-stone-50"
          )}
        >
          <span className="text-base">{"\uD83C\uDFA8"}</span>
          <span className="truncate">All</span>
        </button>

        {/* Collection Buttons */}
        {collections.map((collection) => {
          const theme = getCollectionTheme(collection.handle)
          const isActive = activeCollectionId === collection.id

          return (
            <button
              key={collection.id}
              onClick={() => onCollectionChange(collection.id)}
              className={clx(
                "group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "border hover:shadow-sm active:scale-[0.98]",
                isActive
                  ? `bg-gradient-to-br ${theme.gradient} border-transparent shadow-md ring-2 ring-ui-fg-base ring-offset-1`
                  : `${theme.bgColor} border-ui-border-base hover:border-ui-border-strong text-ui-fg-base`
              )}
            >
              <span className="text-base flex-shrink-0">{theme.icon}</span>
              <span className="truncate">{collection.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CollectionFilterButtons
