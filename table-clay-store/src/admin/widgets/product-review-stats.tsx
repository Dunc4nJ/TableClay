import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Input, Button } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

type ReviewStats = {
  average_rating: number
  total_count: number
}

const ProductReviewStatsWidget = ({
  data,
}: {
  data?: { id?: string }
}) => {
  const productId = data?.id
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [averageRating, setAverageRating] = useState("4.8")
  const [totalCount, setTotalCount] = useState("0")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!productId) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/admin/reviews/product-stats?product_id=${productId}`,
        { credentials: "include" }
      )
      const result = await response.json()

      if (result.success) {
        const incoming = result.stats
        if (incoming) {
          const normalized = {
            average_rating: parseFloat(incoming.average_rating),
            total_count: incoming.total_count,
          }
          setStats(normalized)
          setAverageRating(normalized.average_rating.toFixed(1))
          setTotalCount(String(normalized.total_count))
        } else {
          setStats({ average_rating: 4.8, total_count: 0 })
          setAverageRating("4.8")
          setTotalCount("0")
        }
      } else {
        setError(result.error || "Failed to load review stats")
      }
    } catch (err) {
      setError("Failed to load review stats")
    }
    setIsLoading(false)
  }, [productId])

  useEffect(() => {
    if (productId) {
      fetchStats()
    }
  }, [fetchStats, productId])

  const handleSave = async () => {
    if (!productId) return

    const parsedRating = parseFloat(averageRating)
    const parsedCount = parseInt(totalCount, 10)

    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      setError("Average rating must be between 1.0 and 5.0")
      return
    }

    if (Number.isNaN(parsedCount) || parsedCount < 0) {
      setError("Total reviews must be a non-negative number")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`/admin/reviews/product-stats`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          average_rating: parsedRating,
          total_count: parsedCount,
        }),
      })
      const result = await response.json()
      if (result.success) {
        setStats({
          average_rating: parsedRating,
          total_count: parsedCount,
        })
        setIsEditing(false)
      } else {
        setError(result.error || "Failed to update review stats")
      }
    } catch (err) {
      setError("Failed to update review stats")
    }
    setIsSaving(false)
  }

  if (!productId) {
    return null
  }

  if (isLoading) {
    return (
      <Container className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Heading level="h2">Review Stats</Heading>
          <Text className="text-ui-fg-muted">Loading...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <Heading level="h2">Review Stats</Heading>
        {!isEditing && (
          <Button size="small" variant="secondary" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Text className="text-ui-fg-muted text-sm">Average Rating</Text>
          {isEditing ? (
            <Input
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={averageRating}
              onChange={(e) => setAverageRating(e.target.value)}
              className="mt-1 w-24"
              disabled={isSaving}
            />
          ) : (
            <Text className="mt-1 text-lg font-medium">
              {(stats?.average_rating ?? 4.8).toFixed(1)}
            </Text>
          )}
        </div>

        <div>
          <Text className="text-ui-fg-muted text-sm">Total Reviews</Text>
          {isEditing ? (
            <Input
              type="number"
              min="0"
              value={totalCount}
              onChange={(e) => setTotalCount(e.target.value)}
              className="mt-1 w-24"
              disabled={isSaving}
            />
          ) : (
            <Text className="mt-1 text-lg font-medium">
              {stats?.total_count ?? 0}
            </Text>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="flex items-center gap-2 mt-4">
          <Button size="small" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              setIsEditing(false)
              setAverageRating((stats?.average_rating ?? 4.8).toFixed(1))
              setTotalCount(String(stats?.total_count ?? 0))
              setError(null)
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductReviewStatsWidget
