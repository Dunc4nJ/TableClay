import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowLeft } from "@medusajs/icons"
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

type Product = {
  id: string
  title: string
  thumbnail: string | null
}

type FAQ = {
  id: string
  product_id: string | null
  question: string
  answer: string
  is_active: boolean
  sort_order: number
}

type UpdateFAQData = {
  product_id?: string | null
  question?: string
  answer?: string
  is_active?: boolean
  sort_order?: number
}

const fetchProducts = async (): Promise<{ products: Product[] }> => {
  const response = await fetch("/admin/products?limit=100", {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch products")
  return response.json()
}

const fetchFAQ = async (id: string): Promise<{ faq: FAQ }> => {
  const response = await fetch(`/admin/faqs/${id}`, {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch FAQ")
  return response.json()
}

const updateFAQ = async ({
  id,
  data,
}: {
  id: string
  data: UpdateFAQData
}) => {
  const response = await fetch(`/admin/faqs/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update FAQ")
  }
  return response.json()
}

const EditFAQPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<UpdateFAQData>({})
  const [error, setError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [scopeType, setScopeType] = useState<"global" | "product">("global")

  const { data: faqData, isLoading: faqLoading } = useQuery({
    queryKey: ["faq", id],
    queryFn: () => fetchFAQ(id!),
    enabled: !!id,
  })

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products-for-faq"],
    queryFn: fetchProducts,
  })

  // Initialize form when FAQ data loads
  useEffect(() => {
    if (faqData?.faq && !initialized) {
      const faq = faqData.faq
      setFormData({
        product_id: faq.product_id,
        question: faq.question,
        answer: faq.answer,
        is_active: faq.is_active,
        sort_order: faq.sort_order,
      })
      setScopeType(faq.product_id === null ? "global" : "product")
      setInitialized(true)
    }
  }, [faqData, initialized])

  const updateMutation = useMutation({
    mutationFn: updateFAQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] })
      navigate("/faqs")
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.question?.trim()) {
      setError("Please enter a question")
      return
    }
    if (!formData.answer?.trim()) {
      setError("Please enter an answer")
      return
    }
    if (scopeType === "product" && !formData.product_id) {
      setError("Please select a product for product-specific FAQs")
      return
    }

    const submitData = {
      ...formData,
      product_id: scopeType === "global" ? null : formData.product_id,
    }

    updateMutation.mutate({ id: id!, data: submitData })
  }

  const products = productsData?.products ?? []

  if (faqLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-muted">Loading FAQ...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4">
        <Button variant="transparent" onClick={() => navigate("/faqs")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <Heading level="h1">Edit FAQ</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Update FAQ details
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

        {/* Scope Selection */}
        <div className="space-y-2">
          <Label>FAQ Type</Label>
          <Select
            value={scopeType}
            onValueChange={(value: "global" | "product") => {
              setScopeType(value)
              if (value === "global") {
                setFormData({ ...formData, product_id: null })
              }
            }}
          >
            <Select.Trigger className="w-full">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="global">Global FAQ (shown on all pages)</Select.Item>
              <Select.Item value="product">Product-specific FAQ</Select.Item>
            </Select.Content>
          </Select>
        </div>

        {/* Product Selection (only for product-specific FAQs) */}
        {scopeType === "product" && (
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
        )}

        {/* Question */}
        <div className="space-y-2">
          <Label htmlFor="question">Question *</Label>
          <Input
            id="question"
            placeholder="What is your shipping policy?"
            value={formData.question || ""}
            onChange={(e) =>
              setFormData({ ...formData, question: e.target.value })
            }
          />
        </div>

        {/* Answer */}
        <div className="space-y-2">
          <Label htmlFor="answer">Answer *</Label>
          <Textarea
            id="answer"
            placeholder="Write the answer to this question..."
            rows={6}
            value={formData.answer || ""}
            onChange={(e) =>
              setFormData({ ...formData, answer: e.target.value })
            }
          />
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            min={0}
            value={formData.sort_order ?? 0}
            onChange={(e) =>
              setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
            }
          />
          <Text className="text-ui-fg-subtle text-sm">
            Lower numbers appear first
          </Text>
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
            onClick={() => navigate("/faqs")}
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
  label: "Edit FAQ",
})

export default EditFAQPage
