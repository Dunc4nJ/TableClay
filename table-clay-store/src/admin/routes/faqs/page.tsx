import { defineRouteConfig } from "@medusajs/admin-sdk"
import { QuestionMarkCircle } from "@medusajs/icons"
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

type FAQ = {
  id: string
  product_id: string | null
  question: string
  answer: string
  is_active: boolean
  sort_order: number
}

type FAQStats = {
  total: number
  global: number
  product_specific: number
  active: number
  inactive: number
}

type FAQListResponse = {
  success: boolean
  faqs: FAQ[]
  stats: FAQStats
}

const fetchFAQs = async (): Promise<FAQListResponse> => {
  const response = await fetch("/admin/faqs", {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch FAQs")
  return response.json()
}

const toggleFAQ = async ({
  id,
  is_active,
}: {
  id: string
  is_active: boolean
}) => {
  const response = await fetch(`/admin/faqs/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active }),
  })
  if (!response.ok) throw new Error("Failed to update FAQ")
  return response.json()
}

const deleteFAQ = async (id: string) => {
  const response = await fetch(`/admin/faqs/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to delete FAQ")
  return response.json()
}

const FAQsPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [scopeFilter, setScopeFilter] = useState<string>("all")
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["faqs"],
    queryFn: fetchFAQs,
  })

  const toggleMutation = useMutation({
    mutationFn: toggleFAQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFAQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] })
    },
  })

  const filteredFAQs =
    data?.faqs?.filter((faq) => {
      const matchesSearch =
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesScope =
        scopeFilter === "all" ||
        (scopeFilter === "global" && faq.product_id === null) ||
        (scopeFilter === "product" && faq.product_id !== null)
      return matchesSearch && matchesScope
    }) ?? []

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-muted">Loading FAQs...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex flex-col items-center justify-center px-6 py-12 gap-4">
          <Text className="text-ui-fg-error">Failed to load FAQs</Text>
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
          <Heading level="h1">FAQs</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Manage frequently asked questions
          </Text>
        </div>
        <Button onClick={() => navigate("/faqs/new")}>Add FAQ</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 px-6 py-4">
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Total FAQs</Text>
            <Text className="text-2xl font-semibold">{stats.total}</Text>
          </div>
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Global</Text>
            <Text className="text-2xl font-semibold text-ui-fg-interactive">
              {stats.global}
            </Text>
          </div>
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Product-specific</Text>
            <Text className="text-2xl font-semibold">{stats.product_specific}</Text>
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
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <Select.Trigger className="w-[180px]">
            <Select.Value placeholder="Filter by scope" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All FAQs</Select.Item>
            <Select.Item value="global">Global Only</Select.Item>
            <Select.Item value="product">Product-specific</Select.Item>
          </Select.Content>
        </Select>
        <Text className="text-ui-fg-subtle text-sm">
          {filteredFAQs.length} FAQ{filteredFAQs.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* FAQs Table */}
      <div className="px-6 py-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Question</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Order</Table.HeaderCell>
              <Table.HeaderCell>Active</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredFAQs.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center py-8">
                  <Text className="text-ui-fg-muted">No FAQs found</Text>
                </Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
              </Table.Row>
            ) : (
              filteredFAQs.map((faq) => (
                <Table.Row key={faq.id}>
                  <Table.Cell>
                    <div className="max-w-md">
                      <Text className="font-medium truncate">{faq.question}</Text>
                      <Text className="text-sm text-ui-fg-subtle truncate">
                        {faq.answer.substring(0, 100)}
                        {faq.answer.length > 100 ? "..." : ""}
                      </Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={faq.product_id === null ? "blue" : "purple"}
                      size="small"
                    >
                      {faq.product_id === null ? "Global" : "Product"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="grey" size="small">
                      {faq.sort_order}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Switch
                      checked={faq.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: faq.id,
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
                        onClick={() => navigate(`/faqs/${faq.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this FAQ?")) {
                            deleteMutation.mutate(faq.id)
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
  label: "FAQs",
  icon: QuestionMarkCircle,
})

export default FAQsPage
