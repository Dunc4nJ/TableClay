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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"

type BundleItemData = {
  id: string
  product_id: string
  variant_id: string
  quantity: number
  sort_order: number
  product_title?: string | null
  variant_title?: string | null
}

type Bundle = {
  id: string
  name: string
  description: string | null
  pricing_type: "fixed" | "percentage"
  fixed_original_price: number | null
  fixed_sale_price: number | null
  discount_percentage: number | null
  badge: string
  is_active: boolean
  sort_order: number
  items: BundleItemData[]
}

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

type LocalBundleItem = {
  product_id: string
  product_title: string
  variant_id: string
  variant_title: string
  quantity: number
}

const fetchBundle = async (id: string): Promise<{ bundle: Bundle }> => {
  const response = await fetch(`/admin/bundles/${id}`, {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch bundle")
  return response.json()
}

const fetchProducts = async (): Promise<{ products: ProductOption[] }> => {
  const response = await fetch("/admin/products?limit=100", {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch products")
  return response.json()
}

const updateBundle = async ({
  id,
  data,
}: {
  id: string
  data: Record<string, unknown>
}) => {
  const response = await fetch(`/admin/bundles/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update bundle")
  }
  return response.json()
}

const BundleEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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
  const [items, setItems] = useState<LocalBundleItem[]>([])

  // Product picker state
  const [selectedProductId, setSelectedProductId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch bundle
  const { data: bundleData, isLoading: bundleLoading } = useQuery({
    queryKey: ["bundle", id],
    queryFn: () => fetchBundle(id!),
    enabled: !!id,
  })

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  })

  // Populate form when bundle loads
  useEffect(() => {
    if (bundleData?.bundle) {
      const b = bundleData.bundle
      setName(b.name)
      setDescription(b.description || "")
      setPricingType(b.pricing_type)
      setOriginalPrice(
        b.fixed_original_price ? (b.fixed_original_price / 100).toString() : ""
      )
      setSalePrice(
        b.fixed_sale_price ? (b.fixed_sale_price / 100).toString() : ""
      )
      setDiscountPercent(
        b.discount_percentage ? b.discount_percentage.toString() : ""
      )
      setBadge(b.badge)
      setIsActive(b.is_active)
      setSortOrder(b.sort_order.toString())

      // Convert existing items to local format
      setItems(
        b.items.map((item) => ({
          product_id: item.product_id,
          product_title: item.product_title || "Unknown Product",
          variant_id: item.variant_id,
          variant_title: item.variant_title || "Unknown Variant",
          quantity: item.quantity,
        }))
      )
    }
  }, [bundleData])

  // Filter products by search term
  const filteredProducts =
    productsData?.products?.filter((p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? []

  const updateMutation = useMutation({
    mutationFn: updateBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundle", id] })
      queryClient.invalidateQueries({ queryKey: ["bundles"] })
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

    const data: Record<string, unknown> = {
      name,
      description: description || null,
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
      data.fixed_original_price =
        Math.round(parseFloat(originalPrice) * 100) || 0
      data.fixed_sale_price = Math.round(parseFloat(salePrice) * 100) || 0
    } else {
      data.discount_percentage = parseInt(discountPercent) || 0
    }

    updateMutation.mutate({ id: id!, data })
  }

  const addVariantToBundle = (
    product: ProductOption,
    variant: ProductOption["variants"][0]
  ) => {
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
    {} as Record<string, { product_title: string; items: LocalBundleItem[] }>
  )

  if (bundleLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-muted">Loading bundle...</Text>
        </div>
      </Container>
    )
  }

  const bundle = bundleData?.bundle
  if (!bundle) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-error">Bundle not found</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Edit Bundle</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Update bundle settings and items
          </Text>
        </div>
        <Button variant="secondary" onClick={() => navigate("/bundles")}>
          Back to Bundles
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
          <Button type="submit" isLoading={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Edit Bundle",
})

export default BundleEditPage
