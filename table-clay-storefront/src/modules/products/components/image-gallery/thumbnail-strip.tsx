import Image from "next/image"
import { clx } from "@medusajs/ui"

interface ThumbnailStripProps {
  images: { id: string; url: string }[]
  currentIndex: number
  onSelect: (index: number) => void
}

// Maximum visible thumbnails (approx 2 rows of 6)
const MAX_VISIBLE = 12

const ThumbnailStrip = ({
  images,
  currentIndex,
  onSelect,
}: ThumbnailStripProps) => {
  // Don't show thumbnails for single image
  if (images.length <= 1) {
    return null
  }

  // Limit visible thumbnails and track overflow
  const visibleImages = images.slice(0, MAX_VISIBLE)
  const hiddenCount = images.length - MAX_VISIBLE

  return (
    <div className="mt-4">
      {/* Wrap thumbnails in a flex container that wraps */}
      <div className="flex flex-wrap gap-2 justify-center">
        {visibleImages.map((image, index) => (
          <button
            key={image.id}
            onClick={() => onSelect(index)}
            className={clx(
              "relative overflow-hidden rounded-lg",
              "w-16 h-16 sm:w-20 sm:h-20",
              "border-2 transition-all duration-200",
              "hover:opacity-90",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              index === currentIndex
                ? "border-brand-500 ring-2 ring-brand-500/20 scale-105"
                : "border-gray-200 hover:border-gray-300"
            )}
            aria-label={`View image ${index + 1}`}
            aria-current={index === currentIndex ? "true" : undefined}
          >
            <Image
              src={image.url}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </button>
        ))}

        {/* Show overflow indicator if more images exist */}
        {hiddenCount > 0 && (
          <button
            onClick={() => onSelect(MAX_VISIBLE)}
            className={clx(
              "relative overflow-hidden rounded-lg",
              "w-16 h-16 sm:w-20 sm:h-20",
              "border-2 border-gray-200 hover:border-gray-300",
              "bg-gray-100 flex items-center justify-center",
              "transition-all duration-200"
            )}
            aria-label={`View ${hiddenCount} more images`}
          >
            <span className="text-sm font-medium text-gray-600">
              +{hiddenCount}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export default ThumbnailStrip
