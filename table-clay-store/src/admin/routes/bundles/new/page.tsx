import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Select,
  Switch,
  Textarea,
} from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

type ProductOption = {
  id: string
  title: string
  variants: Array<{
    id: string
    title: string
    sku: string | null
    prices: Array<{
      amount: number
      currency_code: string
    }>
  }>
}

type CreateBundlePayload = {
  product_id: string
  name: string
  description?: string
  pricing_type: "fixed" | "percentage"
  fixed_original_price?: number
  fixed_sale_price?: number
  discount_percentage?: number
  badge: string
  is_active: boolean
  sort_order: number
  items: Array<{
    variant_id: string
    quantity: number
  }>
}

const fetchProducts = async (): Promise<{ products: ProductOption[] }> => {
  const response = await fetch("/admin/products?limit=100", {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch products")
  return response.json()
}

const createBundle = async (data: CreateBundlePayload) => {
  const response = await fetch("/admin/bundles", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create bundle")
  }
  return response.json()
}

const BundleCreatePage = () => {
  const navigate = useNavigate()

  // Form state
  const [productId, setProductId] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [pricingType, setPricingType] = useState<"fixed" | "percentage">("fixed")
  const [originalPrice, setOriginalPrice] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [discountPercent, setDiscountPercent] = useState("")
  const [badge, setBadge] = useState("none")
  const [isActive, setIsActive] = useState(true)
  const [sortOrder, setSortOrder] = useState("0")
  const [items, setItems] = useState<
    Array<{ variant_id: string; quantity: number }>
  >([])

  // Fetch products for dropdown
  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  // Get selected product's variants
  const selectedProduct = productsData?.products?.find((p) => p.id === productId)

  const createMutation = useMutation({
    mutationFn: createBundle,
    onSuccess: () => {
      navigate("/bundles")
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!productId) {
      alert("Please select a product")
      return
    }

    if (!name) {
      alert("Please enter a bundle name")
      return
    }

    if (items.length === 0) {
      alert("Please add at least one item to the bundle")
      return
    }

    const payload: CreateBundlePayload = {
      product_id: productId,
      name,
      description: description || undefined,
      pricing_type: pricingType,
      badge,
      is_active: isActive,
      sort_order: parseInt(sortOrder) || 0,
      items,
    }

    if (pricingType === "fixed") {
      payload.fixed_original_price = Math.round(parseFloat(originalPrice) * 100) || 0
      payload.fixed_sale_price = Math.round(parseFloat(salePrice) * 100) || 0
    } else {
      payload.discount_percentage = parseInt(discountPercent) || 0
    }

    createMutation.mutate(payload)
  }

  const addItem = (variantId: string) => {
    if (items.find((i) => i.variant_id === variantId)) return
    setItems([...items, { variant_id: variantId, quantity: 1 }])
  }

  const removeItem = (variantId: string) => {
    setItems(items.filter((i) => i.variant_id !== variantId))
  }

  const updateItemQuantity = (variantId: string, quantity: number) => {
    setItems(
      items.map((i) =>
        i.variant_id === variantId ? { ...i, quantity: Math.max(1, quantity) } : i
      )
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Create Bundle</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Create a new product bundle tier
          </Text>
        </div>
        <Button variant="secondary" onClick={() => navigate("/bundles")}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Product Selection */}
        <div className="space-y-2">
          <Label htmlFor="product">Product</Label>
          <Select value={productId} onValueChange={setProductId}>
            <Select.Trigger>
              <Select.Value placeholder="Select a product" />
            </Select.Trigger>
            <Select.Content>
              {productsData?.products?.map((product) => (
                <Select.Item key={product.id} value={product.id}>
                  {product.title}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        {/* Bundle Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Bundle Name</Label>
          <Input
            id="name"
            placeholder='e.g., Duo - "Creative Set"'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="e.g., 2 wheels + Free Shipping + Tool Kit"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Pricing Type */}
        <div className="space-y-2">
          <Label>Pricing Type</Label>
          <Select
            value={pricingType}
            onValueChange={(v) => setPricingType(v as "fixed" | "percentage")}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="fixed">Fixed Price</Select.Item>
              <Select.Item value="percentage">Percentage Discount</Select.Item>
            </Select.Content>
          </Select>
        </div>

        {/* Pricing Fields */}
        {pricingType === "fixed" ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price ($)</Label>
              <Input
                id="originalPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="319.90"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price ($)</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="197.93"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="discountPercent">Discount Percentage (%)</Label>
            <Input
              id="discountPercent"
              type="number"
              min="0"
              max="100"
              placeholder="20"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
            />
          </div>
        )}

        {/* Badge */}
        <div className="space-y-2">
          <Label>Badge</Label>
          <Select value={badge} onValueChange={setBadge}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="none">None</Select.Item>
              <Select.Item value="bestseller">Bestseller</Select.Item>
              <Select.Item value="popular">Popular</Select.Item>
              <Select.Item value="new">New</Select.Item>
              <Select.Item value="limited">Limited</Select.Item>
              <Select.Item value="sale">Sale</Select.Item>
            </Select.Content>
          </Select>
        </div>

        {/* Sort Order & Active */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              min="0"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Active</Label>
            <div className="pt-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </div>

        {/* Bundle Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Bundle Items</Label>
            <Text className="text-ui-fg-subtle text-sm">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </Text>
          </div>

          {/* Available Variants */}
          {selectedProduct && (
            <div className="space-y-2">
              <Text className="text-sm text-ui-fg-subtle">
                Available variants for {selectedProduct.title}:
              </Text>
              <div className="space-y-2">
                {selectedProduct.variants?.map((variant) => {
                  const isAdded = items.find(
                    (i) => i.variant_id === variant.id
                  )
                  const price = variant.prices?.[0]

                  return (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-3 bg-ui-bg-subtle rounded-lg"
                    >
                      <div>
                        <Text className="font-medium">{variant.title}</Text>
                        {variant.sku && (
                          <Text className="text-sm text-ui-fg-subtle">
                            SKU: {variant.sku}
                          </Text>
                        )}
                        {price && (
                          <Text className="text-sm text-ui-fg-subtle">
                            ${(price.amount / 100).toFixed(2)}{" "}
                            {price.currency_code.toUpperCase()}
                          </Text>
                        )}
                      </div>
                      {isAdded ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            className="w-20"
                            value={isAdded.quantity}
                            onChange={(e) =>
                              updateItemQuantity(
                                variant.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                          <Button
                            type="button"
                            variant="danger"
                            size="small"
                            onClick={() => removeItem(variant.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="small"
                          onClick={() => addItem(variant.id)}
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!selectedProduct && (
            <Text className="text-ui-fg-muted">
              Select a product to see available variants
            </Text>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate("/bundles")}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Create Bundle
          </Button>
        </div>
      </form>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Create Bundle",
})

export default BundleCreatePage
