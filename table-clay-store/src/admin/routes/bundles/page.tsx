import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CubeSolid } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Table,
  Badge,
  Button,
  Input,
  Switch,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

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
  items: Array<{
    id: string
    product_id: string
    variant_id: string
    quantity: number
    product_title?: string | null
    variant_title?: string | null
  }>
  calculated_pricing?: {
    original_price: number
    sale_price: number
    savings: number
    savings_percent: number
  }
}

type BundleListResponse = {
  success: boolean
  bundles: Bundle[]
  count: number
}

const fetchBundles = async (): Promise<BundleListResponse> => {
  const response = await fetch("/admin/bundles", {
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch bundles")
  }
  return response.json()
}

const toggleBundle = async ({
  id,
  is_active,
}: {
  id: string
  is_active: boolean
}) => {
  const response = await fetch(`/admin/bundles/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active }),
  })
  if (!response.ok) {
    throw new Error("Failed to update bundle")
  }
  return response.json()
}

const deleteBundle = async (id: string) => {
  const response = await fetch(`/admin/bundles/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Failed to delete bundle")
  }
  return response.json()
}

const formatPrice = (cents: number | null | undefined) => {
  if (cents === null || cents === undefined) return "-"
  return `$${(cents / 100).toFixed(2)}`
}

const BundlesPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["bundles"],
    queryFn: fetchBundles,
  })

  const toggleMutation = useMutation({
    mutationFn: toggleBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] })
    },
  })

  const filteredBundles =
    data?.bundles?.filter(
      (bundle) =>
        bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bundle.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? []

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "bestseller":
        return "green"
      case "popular":
        return "blue"
      case "new":
        return "purple"
      case "limited":
        return "orange"
      case "sale":
        return "red"
      default:
        return "grey"
    }
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-muted">Loading bundles...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex flex-col items-center justify-center px-6 py-12 gap-4">
          <Text className="text-ui-fg-error">Failed to load bundles</Text>
          <Button variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Product Bundles</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Create and manage bundle tiers for your products
          </Text>
        </div>
        <Button onClick={() => navigate("/bundles/new")}>Create Bundle</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4">
        <div className="bg-ui-bg-subtle rounded-lg p-4">
          <Text className="text-ui-fg-subtle text-sm">Total Bundles</Text>
          <Text className="text-2xl font-semibold">
            {data?.bundles?.length ?? 0}
          </Text>
        </div>
        <div className="bg-ui-bg-subtle rounded-lg p-4">
          <Text className="text-ui-fg-subtle text-sm">Active</Text>
          <Text className="text-2xl font-semibold text-ui-fg-interactive">
            {data?.bundles?.filter((b) => b.is_active).length ?? 0}
          </Text>
        </div>
        <div className="bg-ui-bg-subtle rounded-lg p-4">
          <Text className="text-ui-fg-subtle text-sm">With Badge</Text>
          <Text className="text-2xl font-semibold">
            {data?.bundles?.filter((b) => b.badge !== "none").length ?? 0}
          </Text>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search bundles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Text className="text-ui-fg-subtle text-sm">
          {filteredBundles.length} bundle
          {filteredBundles.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* Bundles Table */}
      <div className="px-6 py-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Pricing</Table.HeaderCell>
              <Table.HeaderCell>Items</Table.HeaderCell>
              <Table.HeaderCell>Badge</Table.HeaderCell>
              <Table.HeaderCell>Active</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredBundles.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center py-8">
                  <Text className="text-ui-fg-muted">No bundles found</Text>
                </Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
              </Table.Row>
            ) : (
              filteredBundles.map((bundle) => (
                <Table.Row key={bundle.id}>
                  <Table.Cell>
                    <div>
                      <Text className="font-medium">{bundle.name}</Text>
                      {bundle.description && (
                        <Text className="text-ui-fg-subtle text-sm">
                          {bundle.description}
                        </Text>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {bundle.pricing_type === "fixed" ? (
                      <div>
                        <Text className="line-through text-ui-fg-subtle text-sm">
                          {formatPrice(bundle.fixed_original_price)}
                        </Text>
                        <Text className="font-medium text-ui-fg-interactive">
                          {formatPrice(bundle.fixed_sale_price)}
                        </Text>
                      </div>
                    ) : (
                      <Text>{bundle.discount_percentage}% off</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="grey" size="small">
                      {bundle.items?.length ?? 0} items
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {bundle.badge !== "none" ? (
                      <Badge color={getBadgeColor(bundle.badge)} size="small">
                        {bundle.badge}
                      </Badge>
                    ) : (
                      <Text className="text-ui-fg-muted">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Switch
                      checked={bundle.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: bundle.id,
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
                        onClick={() => navigate(`/bundles/${bundle.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this bundle?"
                            )
                          ) {
                            deleteMutation.mutate(bundle.id)
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
  label: "Bundles",
  icon: CubeSolid,
})

export default BundlesPage
