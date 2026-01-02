import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EnvelopeSolid } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Table,
  Badge,
  Button,
  Input,
  Select,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

type Subscriber = {
  id: string
  email: string
  first_name: string | null
  is_active: boolean
  subscribed_at: string
  source: string
  discount_code: string | null
  discount_code_sent: boolean
  discount_code_used: boolean
}

type Stats = {
  total_subscribers: number
  active_subscribers: number
  unsubscribed: number
  discount_codes_used: number
  conversion_rate: number
  subscribers_by_source: Record<string, number>
  recent_signups: number
}

type NewsletterResponse = {
  success: boolean
  subscribers: Subscriber[]
  stats: Stats
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

const fetchNewsletter = async (): Promise<NewsletterResponse> => {
  const response = await fetch("/admin/newsletter", {
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch newsletter data")
  }
  return response.json()
}

const NewsletterPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [sourceFilter, setSourceFilter] = useState<string>("all")

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["newsletter"],
    queryFn: fetchNewsletter,
  })

  const handleExport = async () => {
    try {
      const response = await fetch("/admin/newsletter/export", {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `newsletter_subscribers_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Export error:", err)
      alert("Failed to export subscribers")
    }
  }

  const filteredSubscribers = data?.subscribers?.filter((sub) => {
    const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesSource = sourceFilter === "all" || sub.source === sourceFilter
    return matchesSearch && matchesSource
  }) ?? []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-muted">Loading newsletter data...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex flex-col items-center justify-center px-6 py-12 gap-4">
          <Text className="text-ui-fg-error">Failed to load newsletter data</Text>
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
          <Heading level="h1">Newsletter Subscribers</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Manage your newsletter subscribers and track conversions
          </Text>
        </div>
        <Button onClick={handleExport} variant="secondary">
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4">
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Total Subscribers</Text>
            <Text className="text-2xl font-semibold">{stats.total_subscribers}</Text>
          </div>
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Active</Text>
            <Text className="text-2xl font-semibold text-ui-fg-interactive">
              {stats.active_subscribers}
            </Text>
          </div>
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Codes Used</Text>
            <Text className="text-2xl font-semibold">{stats.discount_codes_used}</Text>
          </div>
          <div className="bg-ui-bg-subtle rounded-lg p-4">
            <Text className="text-ui-fg-subtle text-sm">Conversion Rate</Text>
            <Text className="text-2xl font-semibold">{stats.conversion_rate}%</Text>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <Select.Trigger className="w-[180px]">
            <Select.Value placeholder="Filter by source" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All Sources</Select.Item>
            <Select.Item value="popup">Popup</Select.Item>
            <Select.Item value="footer">Footer</Select.Item>
            <Select.Item value="checkout">Checkout</Select.Item>
          </Select.Content>
        </Select>
        <Text className="text-ui-fg-subtle text-sm">
          {filteredSubscribers.length} subscriber{filteredSubscribers.length !== 1 ? "s" : ""}
        </Text>
      </div>

      {/* Subscribers Table */}
      <div className="px-6 py-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Source</Table.HeaderCell>
              <Table.HeaderCell>Discount Code</Table.HeaderCell>
              <Table.HeaderCell>Code Used</Table.HeaderCell>
              <Table.HeaderCell>Subscribed</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredSubscribers.length === 0 ? (
              <Table.Row>
                <Table.Cell className="text-center py-8">
                  <Text className="text-ui-fg-muted">No subscribers found</Text>
                </Table.Cell>
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
                <Table.Cell />
              </Table.Row>
            ) : (
              filteredSubscribers.map((subscriber) => (
                <Table.Row key={subscriber.id}>
                  <Table.Cell className="font-medium">{subscriber.email}</Table.Cell>
                  <Table.Cell>{subscriber.first_name || "-"}</Table.Cell>
                  <Table.Cell>
                    <Badge color="grey" size="small">
                      {subscriber.source}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {subscriber.discount_code ? (
                      <code className="bg-ui-bg-subtle px-2 py-1 rounded text-sm">
                        {subscriber.discount_code}
                      </code>
                    ) : (
                      "-"
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {subscriber.discount_code_used ? (
                      <Badge color="green" size="small">Yes</Badge>
                    ) : (
                      <Badge color="grey" size="small">No</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-ui-fg-subtle">
                    {formatDate(subscriber.subscribed_at)}
                  </Table.Cell>
                  <Table.Cell>
                    {subscriber.is_active ? (
                      <Badge color="green" size="small">Active</Badge>
                    ) : (
                      <Badge color="red" size="small">Unsubscribed</Badge>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Source Breakdown */}
      {stats && Object.keys(stats.subscribers_by_source).length > 0 && (
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-3">Subscribers by Source</Heading>
          <div className="flex gap-4">
            {Object.entries(stats.subscribers_by_source).map(([source, count]) => (
              <div key={source} className="bg-ui-bg-subtle rounded-lg px-4 py-2">
                <Text className="text-ui-fg-subtle text-sm capitalize">{source}</Text>
                <Text className="font-semibold">{count}</Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Newsletter",
  icon: EnvelopeSolid,
})

export default NewsletterPage
