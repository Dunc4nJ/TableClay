import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BarsThree, ChevronDownMini, ChevronUpMini } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Table,
  Text,
} from "@medusajs/ui"
import { useMemo, useEffect, useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"

type ProductSummary = {
  id: string
  title: string
  thumbnail: string | null
  handle: string | null
  status: string
  created_at: string | null
}

type ProductsResponse = {
  products: ProductSummary[]
}

type ProductOrderResponse = {
  success: boolean
  product_order: string[]
  error?: string
}

const fetchProducts = async (): Promise<ProductsResponse> => {
  const response = await fetch("/admin/products?limit=200", {
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch products")
  }
  return response.json()
}

const fetchProductOrder = async (): Promise<ProductOrderResponse> => {
  const response = await fetch("/admin/product-order", {
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch product order")
  }
  return response.json()
}

const normalizeOrder = (order: string[], products: ProductSummary[]) => {
  const productMap = new Map(products.map((product) => [product.id, product]))
  const seen = new Set<string>()
  const ordered: string[] = []

  for (const id of order) {
    if (!productMap.has(id) || seen.has(id)) continue
    seen.add(id)
    ordered.push(id)
  }

  const getCreatedAt = (product: ProductSummary) =>
    new Date(product.created_at ?? 0).getTime()

  const unlisted = products
    .filter((product) => !seen.has(product.id))
    .sort((a, b) => getCreatedAt(b) - getCreatedAt(a))
    .map((product) => product.id)

  return [...unlisted, ...ordered]
}

const areArraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

const ProductOrderPage = () => {
  const [draftOrder, setDraftOrder] = useState<string[]>([])
  const [initialOrder, setInitialOrder] = useState<string[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    data: productsData,
    isLoading: isProductsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["product-order-products"],
    queryFn: fetchProducts,
  })

  const {
    data: orderData,
    isLoading: isOrderLoading,
    error: orderError,
  } = useQuery({
    queryKey: ["product-order-order"],
    queryFn: fetchProductOrder,
  })

  const publishedProducts = useMemo(() => {
    return (
      productsData?.products?.filter((product) => product.status === "published") ?? []
    )
  }, [productsData])

  const baseOrder = useMemo(() => {
    const storedOrder = orderData?.product_order ?? []
    return normalizeOrder(storedOrder, publishedProducts)
  }, [orderData, publishedProducts])

  const hasChanges = useMemo(
    () => !areArraysEqual(draftOrder, initialOrder),
    [draftOrder, initialOrder]
  )

  useEffect(() => {
    if (isProductsLoading || isOrderLoading || productsError || orderError) {
      return
    }

    if (hasChanges) {
      return
    }

    setInitialOrder(baseOrder)
    setDraftOrder(baseOrder)
  }, [baseOrder, isProductsLoading, isOrderLoading, productsError, orderError])

  const productMap = useMemo(() => {
    return new Map(publishedProducts.map((product) => [product.id, product]))
  }, [publishedProducts])

  const orderIndexMap = useMemo(() => {
    return new Map(draftOrder.map((id, index) => [id, index]))
  }, [draftOrder])

  const orderedProducts = useMemo(() => {
    return draftOrder
      .map((id) => productMap.get(id))
      .filter((product): product is ProductSummary => Boolean(product))
  }, [draftOrder, productMap])

  const filteredProducts = useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase()
    if (!trimmed) return orderedProducts
    return orderedProducts.filter((product) =>
      product.title.toLowerCase().includes(trimmed)
    )
  }, [orderedProducts, searchTerm])

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setDraftOrder((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current
      }

      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  const dragEnabled = searchTerm.trim().length === 0

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch("/admin/product-order", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_order: draftOrder }),
      })
      const result = (await response.json()) as ProductOrderResponse
      if (!result.success) {
        throw new Error(result.error || "Failed to save product order")
      }
      const normalized = normalizeOrder(result.product_order, publishedProducts)
      setInitialOrder(normalized)
      setDraftOrder(normalized)
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save product order"
      )
    }
    setIsSaving(false)
  }

  const handleReset = () => {
    setDraftOrder(initialOrder)
    setError(null)
  }

  if (isProductsLoading || isOrderLoading) {
    return (
      <Container className="p-8">
        <Heading level="h1">Product Order</Heading>
        <Text className="mt-4 text-ui-fg-muted">Loading...</Text>
      </Container>
    )
  }

  if (productsError || orderError) {
    return (
      <Container className="p-8">
        <Heading level="h1">Product Order</Heading>
        <Text className="mt-4 text-ui-fg-error">
          Failed to load product order data.
        </Text>
      </Container>
    )
  }

  return (
    <Container className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarsThree />
            <Heading level="h1">Product Order</Heading>
          </div>
          <Text className="text-ui-fg-subtle mt-1">
            Drag to curate the default Featured order shown on the storefront.
          </Text>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleReset} disabled={isSaving}>
              Reset
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Badge color="green" size="small">
            {publishedProducts.length} published
          </Badge>
          <Text className="text-ui-fg-subtle text-sm">
            New products appear at the top until you reorder them.
          </Text>
        </div>
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-xs"
        />
      </div>

      {!dragEnabled && (
        <Text className="text-ui-fg-muted text-sm mb-3">
          Clear the search to reorder products.
        </Text>
      )}

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>#</Table.HeaderCell>
            <Table.HeaderCell>Product</Table.HeaderCell>
            <Table.HeaderCell>Handle</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Move</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {filteredProducts.map((product) => {
            const orderIndex = orderIndexMap.get(product.id) ?? 0
            const canMoveUp = dragEnabled && orderIndex > 0
            const canMoveDown = dragEnabled && orderIndex < draftOrder.length - 1

            return (
              <Table.Row
                key={product.id}
                draggable={dragEnabled}
                onDragStart={() => setDraggedIndex(orderIndex)}
                onDragEnd={() => setDraggedIndex(null)}
                onDragOver={(event) => {
                  event.preventDefault()
                  if (!dragEnabled || draggedIndex === null || draggedIndex === orderIndex) {
                    return
                  }
                  moveItem(draggedIndex, orderIndex)
                  setDraggedIndex(orderIndex)
                }}
                className={
                  dragEnabled
                    ? "cursor-move transition-colors"
                    : "cursor-default"
                }
              >
                <Table.Cell>
                  <Text className="text-ui-fg-muted text-sm">{orderIndex + 1}</Text>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-ui-bg-subtle overflow-hidden">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <Text className="font-medium">{product.title}</Text>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Text className="text-ui-fg-muted text-sm">
                    {product.handle || "-"}
                  </Text>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => moveItem(orderIndex, orderIndex - 1)}
                      disabled={!canMoveUp}
                      aria-label="Move product up"
                    >
                      <ChevronUpMini />
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => moveItem(orderIndex, orderIndex + 1)}
                      disabled={!canMoveDown}
                      aria-label="Move product down"
                    >
                      <ChevronDownMini />
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Product Order",
  icon: BarsThree,
})

export default ProductOrderPage
