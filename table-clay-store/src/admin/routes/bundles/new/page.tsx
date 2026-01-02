import { defineRouteConfig } from "@medusajs/admin-sdk"
import { PlusMini, XMarkMini } from "@medusajs/icons"
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
  Badge,
} from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

type ProductOption = {
  id: string
  title: string
  thumbnail: string | null
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

type BundleItem = {
  product_id: string
  product_title: string
  variant_id: string
  variant_title: string
  quantity: number
}

type CreateBundlePayload = {
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
    product_id: string
    variant_id: string
    quantity: number
    product_title?: string
    variant_title?: string
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
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [pricingType, setPricingType] = useState<"fixed" | "percentage">("fixed")
  const [originalPrice, setOriginalPrice] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [discountPercent, setDiscountPercent] = useState("")
  const [badge, setBadge] = useState("none")
  const [isActive, setIsActive] = useState(true)
  const [sortOrder, setSortOrder] = useState("0")
  const [items, setItems] = useState<BundleItem[]>([])

  // Product picker state
  const [selectedProductId, setSelectedProductId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  // Filter products by search term
  const filteredProducts =
    productsData?.products?.filter((p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? []

  // Get selected product for variant picker
  const selectedProduct = productsData?.products?.find(
    (p) => p.id === selectedProductId
  )

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

    if (!name) {
      alert("Please enter a bundle name")
      return
    }

    if (items.length === 0) {
      alert("Please add at least one item to the bundle")
      return
    }

    const payload: CreateBundlePayload = {
      name,
      description: description || undefined,
      pricing_type: pricingType,
      badge,
      is_active: isActive,
      sort_order: parseInt(sortOrder) || 0,
      items: items.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        product_title: item.product_title,
        variant_title: item.variant_title,
      })),
    }

    if (pricingType === "fixed") {
      payload.fixed_original_price =
        Math.round(parseFloat(originalPrice) * 100) || 0
      payload.fixed_sale_price = Math.round(parseFloat(salePrice) * 100) || 0
    } else {
      payload.discount_percentage = parseInt(discountPercent) || 0
    }

    createMutation.mutate(payload)
  }

  const addVariantToBundle = (
    product: ProductOption,
    variant: ProductOption["variants"][0]
  ) => {
    // Check if already added
    if (items.find((i) => i.variant_id === variant.id)) {
      alert("This variant is already in the bundle")
      return
    }

    setItems([
      ...items,
      {
        product_id: product.id,
        product_title: product.title,
        variant_id: variant.id,
        variant_title: variant.title,
        quantity: 1,
      },
    ])
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

  // Group items by product for display
  const itemsByProduct = items.reduce(
    (acc, item) => {
      if (!acc[item.product_id]) {
        acc[item.product_id] = {
          product_title: item.product_title,
          items: [],
        }
      }
      acc[item.product_id].items.push(item)
      return acc
    },
    {} as Record<string, { product_title: string; items: BundleItem[] }>
  )

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Create Bundle</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Create a bundle with items from any products
          </Text>
        </div>
        <Button variant="secondary" onClick={() => navigate("/bundles")}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="divide-y">
        {/* Basic Info */}
        <div className="px-6 py-4 space-y-4">
          <Heading level="h2">Bundle Details</Heading>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bundle Name *</Label>
              <Input
                id="name"
                placeholder='e.g., "Starter Set"'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., 4 plates + 4 bowls + Free Shipping"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Text className="text-sm">{isActive ? "Active" : "Inactive"}</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="px-6 py-4 space-y-4">
          <Heading level="h2">Pricing</Heading>

          <div className="space-y-2">
            <Label>Pricing Type</Label>
            <Select
              value={pricingType}
              onValueChange={(v) => setPricingType(v as "fixed" | "percentage")}
            >
              <Select.Trigger className="w-[200px]">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="fixed">Fixed Price</Select.Item>
                <Select.Item value="percentage">Percentage Discount</Select.Item>
              </Select.Content>
            </Select>
          </div>

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
                <Text className="text-xs text-ui-fg-subtle">
                  Strikethrough price shown to customers
                </Text>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price ($)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="249.00"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
                <Text className="text-xs text-ui-fg-subtle">
                  Actual price customer pays
                </Text>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-w-xs">
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
        </div>

        {/* Bundle Items */}
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <Heading level="h2">Bundle Items</Heading>
            <Badge color={items.length > 0 ? "green" : "grey"}>
              {items.length} item{items.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Current Items */}
          {Object.keys(itemsByProduct).length > 0 && (
            <div className="space-y-3">
              <Text className="text-sm text-ui-fg-subtle font-medium">
                Items in this bundle:
              </Text>
              {Object.entries(itemsByProduct).map(([productId, group]) => (
                <div
                  key={productId}
                  className="bg-ui-bg-subtle rounded-lg p-3 space-y-2"
                >
                  <Text className="font-medium">{group.product_title}</Text>
                  {group.items.map((item) => (
                    <div
                      key={item.variant_id}
                      className="flex items-center justify-between pl-4"
                    >
                      <Text className="text-sm">{item.variant_title}</Text>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          className="w-16"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItemQuantity(
                              item.variant_id,
                              parseInt(e.target.value) || 1
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="transparent"
                          size="small"
                          onClick={() => removeItem(item.variant_id)}
                        >
                          <XMarkMini />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Product Picker */}
          <div className="border border-ui-border-base rounded-lg p-4 space-y-4">
            <Text className="text-sm font-medium">Add items from products:</Text>

            {/* Product Search */}
            <div className="space-y-2">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Product List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredProducts.length === 0 ? (
                <Text className="text-ui-fg-muted text-sm">
                  No products found
                </Text>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedProductId === product.id
                        ? "border-ui-border-interactive bg-ui-bg-subtle-pressed"
                        : "border-ui-border-base hover:bg-ui-bg-subtle-hover"
                    }`}
                    onClick={() =>
                      setSelectedProductId(
                        selectedProductId === product.id ? "" : product.id
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <Text className="font-medium">{product.title}</Text>
                      <Text className="text-sm text-ui-fg-subtle">
                        {product.variants?.length || 0} variants
                      </Text>
                    </div>

                    {/* Show variants when product is selected */}
                    {selectedProductId === product.id && product.variants && (
                      <div className="mt-3 pt-3 border-t border-ui-border-base space-y-2">
                        {product.variants.map((variant) => {
                          const isAdded = items.find(
                            (i) => i.variant_id === variant.id
                          )
                          const price = variant.prices?.[0]

                          return (
                            <div
                              key={variant.id}
                              className="flex items-center justify-between pl-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div>
                                <Text className="text-sm">{variant.title}</Text>
                                {price && (
                                  <Text className="text-xs text-ui-fg-subtle">
                                    ${(price.amount / 100).toFixed(2)}
                                  </Text>
                                )}
                              </div>
                              {isAdded ? (
                                <Badge color="green" size="small">
                                  Added
                                </Badge>
                              ) : (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="small"
                                  onClick={() =>
                                    addVariantToBundle(product, variant)
                                  }
                                >
                                  <PlusMini /> Add
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="px-6 py-4 flex justify-end gap-2">
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
