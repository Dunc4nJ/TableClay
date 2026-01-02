import { useState, useRef } from "react"
import { Button, Input, Text } from "@medusajs/ui"
import { XMark, Plus, Photo } from "@medusajs/icons"

export type ImageItem = {
  id?: string
  url: string
  alt_text: string
  isUploading?: boolean
}

type ImageUploaderProps = {
  images: ImageItem[]
  onChange: (images: ImageItem[]) => void
  maxImages?: number
}

/**
 * ImageUploader Component
 *
 * A reusable component for uploading and managing images with:
 * - Drag-drop file selection
 * - Image preview thumbnails
 * - Editable alt text
 * - Drag-drop reordering
 * - Max image limit enforcement
 */
export const ImageUploader = ({
  images,
  onChange,
  maxImages = 5,
}: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadingCount, setUploadingCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAddMore = images.length < maxImages && uploadingCount === 0

  // Upload file to /admin/uploads
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append("files", file)

      const response = await fetch("/admin/uploads", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      if (data.files && data.files.length > 0) {
        return data.files[0].url
      }
      return null
    } catch (err) {
      console.error("Upload error:", err)
      return null
    }
  }

  // Handle file selection
  const handleFiles = async (files: FileList) => {
    setError(null)
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter((f) => f.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      setError("Please select image files only")
      return
    }

    const remaining = maxImages - images.length
    if (imageFiles.length > remaining) {
      setError(`You can only add ${remaining} more image(s)`)
      imageFiles.splice(remaining)
    }

    // Create placeholder entries with blob URLs
    const placeholders: ImageItem[] = imageFiles.map((file) => ({
      url: URL.createObjectURL(file),
      alt_text: file.name.replace(/\.[^/.]+$/, ""), // Filename without extension
      isUploading: true,
    }))

    // Add placeholders immediately
    const withPlaceholders = [...images, ...placeholders]
    onChange(withPlaceholders)
    setUploadingCount(imageFiles.length)

    // Upload each file and replace placeholders
    const uploadResults: ImageItem[] = [...images]
    let failedCount = 0

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const uploadedUrl = await uploadFile(file)

      if (uploadedUrl) {
        // Clean up blob URL
        URL.revokeObjectURL(placeholders[i].url)
        uploadResults.push({
          url: uploadedUrl,
          alt_text: placeholders[i].alt_text,
          isUploading: false,
        })
      } else {
        // Clean up blob URL for failed upload
        URL.revokeObjectURL(placeholders[i].url)
        failedCount++
      }
    }

    // Update with final results
    onChange(uploadResults)
    setUploadingCount(0)

    if (failedCount > 0) {
      setError(`${failedCount} image(s) failed to upload`)
    }
  }

  // Drag-drop zone handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (canAddMore) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (canAddMore && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
    // Reset input so same file can be selected again
    e.target.value = ""
  }

  // Delete image
  const handleDelete = (index: number) => {
    const updated = [...images]
    // Clean up blob URL if needed
    if (updated[index].url.startsWith("blob:")) {
      URL.revokeObjectURL(updated[index].url)
    }
    updated.splice(index, 1)
    onChange(updated)
  }

  // Update alt text
  const handleAltTextChange = (index: number, alt_text: string) => {
    const updated = [...images]
    updated[index] = { ...updated[index], alt_text }
    onChange(updated)
  }

  // Drag-reorder handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // Reorder images
    const updated = [...images]
    const [draggedItem] = updated.splice(draggedIndex, 1)
    updated.splice(index, 0, draggedItem)
    onChange(updated)
    setDraggedIndex(index)
  }

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id || `${image.url}-${index}`}
              draggable={!image.isUploading}
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverItem(e, index)}
              className={`relative group border rounded-lg overflow-hidden bg-ui-bg-subtle transition-all ${
                image.isUploading
                  ? "opacity-60"
                  : draggedIndex === index
                    ? "opacity-50 ring-2 ring-ui-border-interactive cursor-move"
                    : "hover:ring-2 hover:ring-ui-border-base cursor-move"
              }`}
            >
              {/* Image */}
              <div className="aspect-square relative">
                {image.isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-ui-bg-subtle">
                    <div className="animate-pulse">
                      <Photo className="w-8 h-8 text-ui-fg-muted" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={image.url}
                    alt={image.alt_text}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Delete button */}
                {!image.isUploading && (
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="absolute top-1 right-1 p-1 bg-ui-bg-base rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ui-bg-base-hover"
                  >
                    <XMark className="w-4 h-4 text-ui-fg-subtle" />
                  </button>
                )}

                {/* Order indicator */}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-ui-bg-base rounded text-xs text-ui-fg-subtle">
                  {index + 1}
                </div>
              </div>

              {/* Alt text input */}
              <div className="p-2">
                <Input
                  size="small"
                  placeholder="Alt text..."
                  value={image.alt_text}
                  onChange={(e) => handleAltTextChange(index, e.target.value)}
                  className="text-xs"
                  disabled={image.isUploading}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / Add button */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-ui-border-interactive bg-ui-bg-interactive"
              : "border-ui-border-base hover:border-ui-border-strong hover:bg-ui-bg-subtle"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          <Plus className="w-8 h-8 mx-auto text-ui-fg-muted mb-2" />
          <Text className="text-ui-fg-subtle">
            {isDragging
              ? "Drop images here"
              : "Click or drag images to upload"}
          </Text>
          <Text className="text-ui-fg-muted text-sm mt-1">
            {images.length} of {maxImages} images
          </Text>
        </div>
      )}

      {/* Uploading indicator */}
      {uploadingCount > 0 && (
        <Text className="text-ui-fg-muted text-sm text-center">
          Uploading {uploadingCount} image(s)...
        </Text>
      )}

      {/* Max reached message */}
      {!canAddMore && uploadingCount === 0 && images.length >= maxImages && (
        <Text className="text-ui-fg-muted text-sm text-center">
          Maximum {maxImages} images reached
        </Text>
      )}

      {/* Error message */}
      {error && (
        <Text className="text-ui-fg-error text-sm">{error}</Text>
      )}

      {/* Help text */}
      {images.length > 0 && (
        <Text className="text-ui-fg-muted text-xs">
          Drag to reorder images. First image will be the primary image.
        </Text>
      )}
    </div>
  )
}

export default ImageUploader
