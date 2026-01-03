"use client"

import { HttpTypes } from "@medusajs/types"
import useImageGallery from "@lib/hooks/use-image-gallery"
import MainImage from "./main-image"
import ThumbnailStrip from "./thumbnail-strip"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const {
    currentIndex,
    currentImage,
    totalImages,
    goToIndex,
    goToNext,
    goToPrevious,
    isFirst,
    isLast,
    containerRef,
    swipeHandlers,
  } = useImageGallery({
    images,
    enableKeyboard: true,
    enableSwipe: true,
  })

  // Handle empty state
  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full bg-ui-bg-subtle rounded-lg flex items-center justify-center">
        <span className="text-ui-fg-subtle">No images available</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full focus:outline-none"
      tabIndex={0} // Allow keyboard focus
    >
      {/* Main large image with navigation arrows */}
      <MainImage
        image={currentImage}
        onNext={goToNext}
        onPrevious={goToPrevious}
        isFirst={isFirst}
        isLast={isLast}
        totalImages={totalImages}
        currentIndex={currentIndex}
        onTouchStart={swipeHandlers.onTouchStart}
        onTouchEnd={swipeHandlers.onTouchEnd}
      />

      {/* Thumbnail strip below */}
      <ThumbnailStrip
        images={images}
        currentIndex={currentIndex}
        onSelect={goToIndex}
      />
    </div>
  )
}

export default ImageGallery
