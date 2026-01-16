import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface CollectionShowcaseProps {
  collection: {
    handle: string
    title: string
    description?: string
  }
  imageUrl: string
  imageAlt?: string
  imagePosition: "left" | "right"
  ctaText?: string
}

const CollectionShowcase = ({
  collection,
  imageUrl,
  imageAlt,
  imagePosition,
  ctaText = "Shop Collection",
}: CollectionShowcaseProps) => {
  const isImageLeft = imagePosition === "left"

  return (
    <div className="w-full">
      <div
        className={`flex flex-col ${
          isImageLeft ? "small:flex-row" : "small:flex-row-reverse"
        } min-h-[500px] small:min-h-[600px]`}
      >
        {/* Image Section */}
        <div className="relative w-full small:w-1/2 h-[400px] small:h-auto overflow-hidden group">
          <Image
            src={imageUrl}
            alt={imageAlt || collection.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* Content Section */}
        <div className="w-full small:w-1/2 bg-cream-200 flex items-center justify-center p-8 small:p-12 medium:p-16">
          <div className="max-w-md text-center">
            {/* Collection Title */}
            <h2 className="font-display text-3xl small:text-4xl medium:text-5xl text-ui-fg-base mb-4">
              {collection.title}
            </h2>

            {/* Description */}
            {collection.description && (
              <p className="text-ui-fg-subtle text-base small:text-lg mb-8 leading-relaxed">
                {collection.description}
              </p>
            )}

            {/* CTA Button */}
            <LocalizedClientLink
              href={`/collections/${collection.handle}`}
              className="inline-block bg-brand-700 hover:bg-brand-800 text-white px-8 py-4 rounded-none uppercase text-sm tracking-wider font-medium transition-all duration-300"
            >
              {ctaText}
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollectionShowcase
