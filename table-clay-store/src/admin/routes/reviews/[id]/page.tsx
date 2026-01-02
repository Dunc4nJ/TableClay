import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Star, ArrowLeft } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  Select,
  Switch,
  Label,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import ImageUploader, { ImageItem } from "../../../components/image-uploader"

type Product = {
  id: string
  title: string
  thumbnail: string | null
}

type ReviewImage = {
  id: string
  url: string
  alt_text: string | null
  sort_order: number
}

type Review = {
  id: string
  product_id: string
  customer_name: string
  is_verified_buyer: boolean
  rating: number
  title: string | null
  content: string
  display_date: string
  helpful_count: number
  is_active: boolean
  sort_order: number
  images?: ReviewImage[]
}

type UpdateReviewData = {
  product_id?: string
  customer_name?: string
  is_verified_buyer?: boolean
  rating?: number
  title?: string
  content?: string
  display_date?: string
  is_active?: boolean
  images?: ImageItem[]
}

const fetchProducts = async (): Promise<{ products: Product[] }> => {
  const response = await fetch("/admin/products?limit=100", {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch products")
  return response.json()
}

const fetchReview = async (id: string): Promise<{ review: Review }> => {
  const response = await fetch(`/admin/reviews/${id}`, {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch review")
  return response.json()
}

const updateReview = async ({
  id,
  data,
}: {
  id: string
  data: UpdateReviewData
}) => {
  // Extract images and convert to API format
  const { images, ...reviewData } = data
  const payload = {
    ...reviewData,
    ...(images !== undefined && {
      image_urls: images
        .filter((img) => !img.isUploading)
        .map((img) => ({
          url: img.url,
          alt_text: img.alt_text,
        })),
    }),
  }

  const response = await fetch(`/admin/reviews/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update review")
  }
  return response.json()
}

const StarSelector = ({
  rating,
  onChange,
}: {
  rating: number
  onChange: (rating: number) => void
}) => {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

const EditReviewPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<UpdateReviewData>({})
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const { data: reviewData, isLoading: reviewLoading } = useQuery({
    queryKey: ["review", id],
    queryFn: () => fetchReview(id!),
    enabled: !!id,
  })

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products-for-review"],
    queryFn: fetchProducts,
  })

  // Initialize form when review data loads
  useEffect(() => {
    if (reviewData?.review && !initialized) {
      const review = reviewData.review
      setFormData({
        product_id: review.product_id,
        customer_name: review.customer_name,
        is_verified_buyer: review.is_verified_buyer,
        rating: review.rating,
        title: review.title || "",
        content: review.content,
        display_date: review.display_date.split("T")[0],
        is_active: review.is_active,
        images: review.images?.map((img) => ({
          id: img.id,
          url: img.url,
          alt_text: img.alt_text || "",
        })) || [],
      })
      setInitialized(true)
    }
  }, [reviewData, initialized])

  const updateMutation = useMutation({
    mutationFn: updateReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] })
      navigate("/reviews")
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.product_id) {
      setError("Please select a product")
      return
    }
    if (!formData.customer_name?.trim()) {
      setError("Please enter a customer name")
      return
    }
    if (!formData.content?.trim()) {
      setError("Please enter review content")
      return
    }

    updateMutation.mutate({ id: id!, data: formData })
  }

  const products = productsData?.products ?? []

  if (reviewLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-muted">Loading review...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4">
        <Button variant="transparent" onClick={() => navigate("/reviews")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <Heading level="h1">Edit Review</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Update review details
          </Text>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
        {error && (
          <div className="bg-ui-bg-error p-4 rounded-lg">
            <Text className="text-ui-fg-error">{error}</Text>
          </div>
        )}

        {/* Product Selection */}
        <div className="space-y-2">
          <Label htmlFor="product">Product *</Label>
          <Select
            value={formData.product_id || ""}
            onValueChange={(value) =>
              setFormData({ ...formData, product_id: value })
            }
          >
            <Select.Trigger className="w-full">
              <Select.Value placeholder="Select a product" />
            </Select.Trigger>
            <Select.Content>
              {productsLoading ? (
                <div className="px-3 py-2 text-ui-fg-muted text-sm">
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="px-3 py-2 text-ui-fg-muted text-sm">
                  No products found
                </div>
              ) : (
                products.map((product) => (
                  <Select.Item key={product.id} value={product.id}>
                    {product.title}
                  </Select.Item>
                ))
              )}
            </Select.Content>
          </Select>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Customer Name *</Label>
            <Input
              id="customer_name"
              placeholder="John D."
              value={formData.customer_name || ""}
              onChange={(e) =>
                setFormData({ ...formData, customer_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2 flex items-end gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="verified"
                checked={formData.is_verified_buyer || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_verified_buyer: checked })
                }
              />
              <Label htmlFor="verified">Verified Buyer</Label>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-2">
          <Label>Rating *</Label>
          <StarSelector
            rating={formData.rating || 5}
            onChange={(rating) => setFormData({ ...formData, rating })}
          />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Review Title</Label>
          <Input
            id="title"
            placeholder="Great product!"
            value={formData.title || ""}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Review Content *</Label>
          <Textarea
            id="content"
            placeholder="Write the review content..."
            rows={5}
            value={formData.content || ""}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
          />
        </div>

        {/* Display Date */}
        <div className="space-y-2">
          <Label htmlFor="display_date">Display Date</Label>
          <Input
            id="display_date"
            type="date"
            value={formData.display_date || ""}
            onChange={(e) =>
              setFormData({ ...formData, display_date: e.target.value })
            }
          />
          <Text className="text-ui-fg-subtle text-sm">
            The date shown to customers for this review
          </Text>
        </div>

        {/* Review Images */}
        <div className="space-y-2">
          <Label>Review Images</Label>
          <ImageUploader
            images={formData.images || []}
            onChange={(images) => setFormData({ ...formData, images })}
            maxImages={5}
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={formData.is_active || false}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_active: checked })
            }
          />
          <Label htmlFor="is_active">Active (visible on storefront)</Label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate("/reviews")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Edit Review",
})

export default EditReviewPage
