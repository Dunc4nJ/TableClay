import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Users } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Table,
  Button,
  Input,
  Switch,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

type CommunityCreation = {
  id: string
  title: string
  creator_first_name: string
  creator_last_initial: string
  image_url: string
  image_alt_text: string | null
  display_date: string
  is_active: boolean
  sort_order: number
}

type CommunityCreationStats = {
  total: number
  active: number
  inactive: number
}

type CommunityCreationListResponse = {
  success: boolean
  creations: CommunityCreation[]
  stats: CommunityCreationStats
}

const fetchCommunityCreations = async (): Promise<CommunityCreationListResponse> => {
  const response = await fetch("/admin/community-creations", {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch community creations")
  return response.json()
}

const toggleCommunityCreation = async ({
  id,
  is_active,
}: {
  id: string
  is_active: boolean
}) => {
  const response = await fetch(`/admin/community-creations/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active }),
  })
  if (!response.ok) throw new Error("Failed to update community creation")
  return response.json()
}

const deleteCommunityCreation = async (id: string) => {
  const response = await fetch(`/admin/community-creations/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to delete community creation")
  return response.json()
}

const CommunityCreationsPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["community-creations"],
    queryFn: fetchCommunityCreations,
  })

  const toggleMutation = useMutation({
    mutationFn: toggleCommunityCreation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-creations"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCommunityCreation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-creations"] })
    },
  })

  const filteredCreations =
    data?.creations?.filter((creation) => {
      const matchesSearch =
        creation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creation.creator_first_name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    }) ?? []

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-muted">Loading community creations...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex flex-col items-center justify-center px-6 py-12 gap-4">
          <Text className="text-ui-fg-error">Failed to load community creations</Text>
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
          <Heading level="h1">Community Creations</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Manage customer pottery showcases
          </Text>
        </div>
        <Button onClick={() => navigate("/community-creations/new")}>
          Add Creation
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 px-6 py-4">
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Total</Text>
            <Text className="text-2xl font-semibold">{stats.total}</Text>
          </div>
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Active</Text>
            <Text className="text-2xl font-semibold text-green-600">
              {stats.active}
            </Text>
          </div>
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Hidden</Text>
            <Text className="text-2xl font-semibold text-ui-fg-muted">
              {stats.inactive}
            </Text>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search by title or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Text className="text-ui-fg-subtle text-sm">
          {filteredCreations.length} creation{filteredCreations.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Image</Table.HeaderCell>
              <Table.HeaderCell>Title</Table.HeaderCell>
              <Table.HeaderCell>Creator</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Active</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredCreations.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center py-8">
                  <Text className="text-ui-fg-muted">No community creations found</Text>
                </Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
              </Table.Row>
            ) : (
              filteredCreations.map((creation) => (
                <Table.Row key={creation.id}>
                  <Table.Cell>
                    <div className="w-12 h-12 rounded overflow-hidden bg-ui-bg-subtle">
                      <img
                        src={creation.image_url}
                        alt={creation.image_alt_text || creation.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="font-medium">{creation.title}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-ui-fg-subtle">
                      {creation.creator_first_name} {creation.creator_last_initial}.
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="text-ui-fg-subtle text-sm">
                      {formatDate(creation.display_date)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Switch
                      checked={creation.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: creation.id,
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
                        onClick={() => navigate(`/community-creations/${creation.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this creation?")) {
                            deleteMutation.mutate(creation.id)
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
  label: "Community Creations",
  icon: Users,
})

export default CommunityCreationsPage
