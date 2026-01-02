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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"

type BundleItem = {
  id: string
  variant_id: string
  quantity: number
  sort_order: number
}

type Bundle = {
  id: string
  product_id: string
  name: string
  description: string | null
  pricing_type: "fixed" | "percentage"
  fixed_original_price: number | null
  fixed_sale_price: number | null
  discount_percentage: number | null
  badge: string
  is_active: boolean
  sort_order: number
  items: BundleItem[]
}

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

const addBundleItem = async ({
  bundleId,
  variant_id,
  quantity,
}: {
  bundleId: string
  variant_id: string
  quantity: number
}) => {
  const response = await fetch(`/admin/bundles/${bundleId}/items`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variant_id, quantity }),
  })
  if (!response.ok) throw new Error("Failed to add item")
  return response.json()
}

const updateBundleItem = async ({
  bundleId,
  itemId,
  quantity,
}: {
  bundleId: string
  itemId: string
  quantity: number
}) => {
  const response = await fetch(`/admin/bundles/${bundleId}/items/${itemId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  })
  if (!response.ok) throw new Error("Failed to update item")
  return response.json()
}

const removeBundleItem = async ({
  bundleId,
  itemId,
}: {
  bundleId: string
  itemId: string
}) => {
  const response = await fetch(`/admin/bundles/${bundleId}/items/${itemId}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to remove item")
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
    }
  }, [bundleData])

  const selectedProduct = productsData?.products?.find(
    (p) => p.id === bundleData?.bundle?.product_id
  )

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

  const addItemMutation = useMutation({
    mutationFn: addBundleItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundle", id] })
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: updateBundleItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundle", id] })
    },
  })

  const removeItemMutation = useMutation({
    mutationFn: removeBundleItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundle", id] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data: Record<string, unknown> = {
      name,
      description: description || null,
      pricing_type: pricingType,
      badge,
      is_active: isActive,
      sort_order: parseInt(sortOrder) || 0,
    }

    if (pricingType === "fixed") {
      data.fixed_original_price = Math.round(parseFloat(originalPrice) * 100) || 0
      data.fixed_sale_price = Math.round(parseFloat(salePrice) * 100) || 0
    } else {
      data.discount_percentage = parseInt(discountPercent) || 0
    }

    updateMutation.mutate({ id: id!, data })
  }

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

      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Product (read-only) */}
        <div className="space-y-2">
          <Label>Product</Label>
          <Text className="p-2 bg-ui-bg-subtle rounded">
            {selectedProduct?.title || bundle.product_id}
          </Text>
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
              {bundle.items?.length ?? 0} item
              {bundle.items?.length !== 1 ? "s" : ""}
            </Text>
          </div>

          {/* Current Items */}
          {bundle.items?.length > 0 && (
            <div className="space-y-2">
              <Text className="text-sm text-ui-fg-subtle">Current items:</Text>
              {bundle.items.map((item) => {
                const variant = selectedProduct?.variants?.find(
                  (v) => v.id === item.variant_id
                )
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-ui-bg-field rounded-lg border border-ui-border-base"
                  >
                    <div>
                      <Text className="font-medium">
                        {variant?.title || item.variant_id}
                      </Text>
                      {variant?.sku && (
                        <Text className="text-sm text-ui-fg-subtle">
                          SKU: {variant.sku}
                        </Text>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        className="w-20"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItemMutation.mutate({
                            bundleId: id!,
                            itemId: item.id,
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="danger"
                        size="small"
                        onClick={() =>
                          removeItemMutation.mutate({
                            bundleId: id!,
                            itemId: item.id,
                          })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add New Items */}
          {selectedProduct && (
            <div className="space-y-2">
              <Text className="text-sm text-ui-fg-subtle">Add more items:</Text>
              {selectedProduct.variants
                ?.filter(
                  (v) => !bundle.items?.find((i) => i.variant_id === v.id)
                )
                .map((variant) => {
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
                      <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        onClick={() =>
                          addItemMutation.mutate({
                            bundleId: id!,
                            variant_id: variant.id,
                            quantity: 1,
                          })
                        }
                      >
                        Add
                      </Button>
                    </div>
                  )
                })}
            </div>
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
