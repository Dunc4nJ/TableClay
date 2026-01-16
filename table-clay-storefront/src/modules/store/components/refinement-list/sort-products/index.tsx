"use client"

import { clx } from "@medusajs/ui"

export type SortOptions = "featured" | "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions: { value: SortOptions; label: string; shortLabel: string }[] = [
  {
    value: "featured",
    label: "Featured",
    shortLabel: "Featured",
  },
  {
    value: "created_at",
    label: "Latest",
    shortLabel: "Latest",
  },
  {
    value: "price_asc",
    label: "Price: Low to High",
    shortLabel: "Low",
  },
  {
    value: "price_desc",
    label: "Price: High to Low",
    shortLabel: "High",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <div className="flex flex-col gap-2" data-testid={dataTestId}>
      <span className="text-xs font-medium text-ui-fg-muted uppercase tracking-wider">
        Sort by
      </span>
      <div className="flex gap-1 flex-wrap">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={clx(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150",
              "border active:scale-[0.97]",
              sortBy === option.value
                ? "bg-brand-800 text-white border-brand-700 shadow-sm"
                : "bg-ui-bg-component text-ui-fg-base border-ui-border-base hover:border-ui-border-strong hover:bg-cream-100"
            )}
            data-testid="sort-button"
            data-active={sortBy === option.value}
          >
            <span className="hidden small:inline">{option.label}</span>
            <span className="small:hidden">{option.shortLabel}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SortProducts
