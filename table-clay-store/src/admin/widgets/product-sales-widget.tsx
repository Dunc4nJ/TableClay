import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Input, Button, Badge } from "@medusajs/ui"
import { useEffect, useState, useCallback } from "react"

type SalesData = {
  product_id: string
  sales_count: number
  last_sold_at: string | null
}

/**
 * Product Sales Widget
 * Shows sales count on product details page with inline editing
 */
const ProductSalesWidget = ({ data }: { data: { product?: { id: string } } }) => {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const productId = data?.product?.id

  const fetchSalesData = useCallback(async () => {
    if (!productId) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/admin/products/${productId}/sales`, {
        credentials: "include",
      })
      const result = await response.json()
      if (result.success) {
        setSalesData(result)
        setEditValue(String(result.sales_count))
      } else {
        setError(result.error || "Failed to load sales data")
      }
    } catch (err) {
      setError("Failed to load sales data")
    }
    setIsLoading(false)
  }, [productId])

  useEffect(() => {
    if (productId) {
      fetchSalesData()
    }
  }, [productId, fetchSalesData])

  const handleSave = async () => {
    if (!productId) return

    const newCount = parseInt(editValue, 10)
    if (isNaN(newCount) || newCount < 0) {
      setError("Please enter a valid non-negative number")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`/admin/products/${productId}/sales`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sales_count: newCount }),
      })
      const result = await response.json()
      if (result.success) {
        setSalesData(result)
        setIsEditing(false)
      } else {
        setError(result.error || "Failed to update sales count")
      }
    } catch (err) {
      setError("Failed to update sales count")
    }
    setIsSaving(false)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num)
  }

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "Never"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Don't render if product data isn't available yet
  if (!productId) {
    return null
  }

  if (isLoading) {
    return (
      <Container className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Heading level="h2">Sales Analytics</Heading>
          <Text className="text-ui-fg-muted">Loading...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <Heading level="h2">Sales Analytics</Heading>
        {salesData && salesData.sales_count > 0 && (
          <Badge color="green">
            {formatNumber(salesData.sales_count)} sold
          </Badge>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Text className="text-ui-fg-muted text-sm">Total Units Sold</Text>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                min="0"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-24"
                disabled={isSaving}
              />
              <Button
                size="small"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => {
                  setIsEditing(false)
                  setEditValue(String(salesData?.sales_count || 0))
                  setError(null)
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <Text className="text-lg font-medium">
                {formatNumber(salesData?.sales_count || 0)}
              </Text>
              <Button
                size="small"
                variant="secondary"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </div>
          )}
        </div>

        <div>
          <Text className="text-ui-fg-muted text-sm">Last Sold</Text>
          <Text className="mt-1">
            {formatDate(salesData?.last_sold_at || null)}
          </Text>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductSalesWidget
