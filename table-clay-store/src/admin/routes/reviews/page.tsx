import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Star } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Table,
  Badge,
  Button,
  Input,
  Select,
  Switch,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

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
  images?: Array<{ id: string; url: string }>
}

type ReviewStats = {
  total: number
  active: number
  inactive: number
  average_rating: number
}

type ReviewListResponse = {
  success: boolean
  reviews: Review[]
  stats: ReviewStats
}

const fetchReviews = async (): Promise<ReviewListResponse> => {
  const response = await fetch("/admin/reviews", {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch reviews")
  return response.json()
}

const toggleReview = async ({
  id,
  is_active,
}: {
  id: string
  is_active: boolean
}) => {
  const response = await fetch(`/admin/reviews/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active }),
  })
  if (!response.ok) throw new Error("Failed to update review")
  return response.json()
}

const deleteReview = async (id: string) => {
  const response = await fetch(`/admin/reviews/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to delete review")
  return response.json()
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

const ReviewsPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["reviews"],
    queryFn: fetchReviews,
  })

  const toggleMutation = useMutation({
    mutationFn: toggleReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] })
    },
  })

  const filteredReviews =
    data?.reviews?.filter((review) => {
      const matchesSearch =
        review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.content.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRating =
        ratingFilter === "all" || review.rating === parseInt(ratingFilter)
      return matchesSearch && matchesRating
    }) ?? []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-muted">Loading reviews...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex flex-col items-center justify-center px-6 py-12 gap-4">
          <Text className="text-ui-fg-error">Failed to load reviews</Text>
          <Button variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Container>
    )
  }

  const stats = data?.stats

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Reviews</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Manage curated product reviews
          </Text>
        </div>
        <Button onClick={() => navigate("/reviews/new")}>Add Review</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 px-6 py-4">
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Total Reviews</Text>
            <Text className="text-2xl font-semibold">{stats.total}</Text>
          </div>
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Active</Text>
            <Text className="text-2xl font-semibold text-ui-fg-interactive">
              {stats.active}
            </Text>
          </div>
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Hidden</Text>
            <Text className="text-2xl font-semibold">{stats.inactive}</Text>
          </div>
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Avg. Rating</Text>
            <div className="flex items-center gap-2">
              <Text className="text-2xl font-semibold">
                {stats.average_rating?.toFixed(1) || "N/A"}
              </Text>
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <Select.Trigger className="w-[150px]">
            <Select.Value placeholder="Filter by rating" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Ratings</Select.Item>
            <Select.Item value="5">5 Stars</Select.Item>
            <Select.Item value="4">4 Stars</Select.Item>
            <Select.Item value="3">3 Stars</Select.Item>
            <Select.Item value="2">2 Stars</Select.Item>
            <Select.Item value="1">1 Star</Select.Item>
          </Select.Content>
        </Select>
        <Text className="text-ui-fg-subtle text-sm">
          {filteredReviews.length} review{filteredReviews.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* Reviews Table */}
      <div className="px-6 py-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Rating</Table.HeaderCell>
              <Table.HeaderCell>Title</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Helpful</Table.HeaderCell>
              <Table.HeaderCell>Active</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredReviews.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center py-8">
                  <Text className="text-ui-fg-muted">No reviews found</Text>
                </Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
              </Table.Row>
            ) : (
              filteredReviews.map((review) => (
                <Table.Row key={review.id}>
                  <Table.Cell>
                    <div>
                      <Text className="font-medium">{review.customer_name}</Text>
                      {review.is_verified_buyer && (
                        <Badge color="green" size="small">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <StarRating rating={review.rating} />
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="max-w-xs truncate">
                      {review.title || "-"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell className="text-ui-fg-subtle">
                    {formatDate(review.display_date)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="grey" size="small">
                      {review.helpful_count}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Switch
                      checked={review.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: review.id,
                          is_active: checked,
                        })
                      }
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => navigate(`/reviews/${review.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => {
                          if (
                            confirm("Are you sure you want to delete this review?")
                          ) {
                            deleteMutation.mutate(review.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Reviews",
  icon: Star,
})

export default ReviewsPage
