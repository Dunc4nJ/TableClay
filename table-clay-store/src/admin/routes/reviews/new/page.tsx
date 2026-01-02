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
import { useQuery, useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

type Product = {
  id: string
  title: string
  thumbnail: string | null
}

type CreateReviewData = {
  product_id: string
  customer_name: string
  is_verified_buyer: boolean
  rating: number
  title: string
  content: string
  display_date: string
  is_active: boolean
}

const fetchProducts = async (): Promise<{ products: Product[] }> => {
  const response = await fetch("/admin/products?limit=100", {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch products")
  return response.json()
}

const createReview = async (data: CreateReviewData) => {
  const response = await fetch("/admin/reviews", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create review")
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

const NewReviewPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<CreateReviewData>({
    product_id: "",
    customer_name: "",
    is_verified_buyer: false,
    rating: 5,
    title: "",
    content: "",
    display_date: new Date().toISOString().split("T")[0],
    is_active: true,
  })
  const [error, setError] = useState<string | null>(null)

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products-for-review"],
    queryFn: fetchProducts,
  })

  const createMutation = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
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
    if (!formData.customer_name.trim()) {
      setError("Please enter a customer name")
      return
    }
    if (!formData.content.trim()) {
      setError("Please enter review content")
      return
    }

    createMutation.mutate(formData)
  }

  const products = productsData?.products ?? []

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4">
        <Button variant="transparent" onClick={() => navigate("/reviews")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <Heading level="h1">Add Review</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Create a curated product review
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
            value={formData.product_id}
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
              value={formData.customer_name}
              onChange={(e) =>
                setFormData({ ...formData, customer_name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2 flex items-end gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="verified"
                checked={formData.is_verified_buyer}
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
            rating={formData.rating}
            onChange={(rating) => setFormData({ ...formData, rating })}
          />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Review Title</Label>
          <Input
            id="title"
            placeholder="Great product!"
            value={formData.title}
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
            value={formData.content}
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
            value={formData.display_date}
            onChange={(e) =>
              setFormData({ ...formData, display_date: e.target.value })
            }
          />
          <Text className="text-ui-fg-subtle text-sm">
            The date shown to customers for this review
          </Text>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
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
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Review"}
          </Button>
        </div>
      </form>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Add Review",
})

export default NewReviewPage
