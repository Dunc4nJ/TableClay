import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, Table, Badge, Input } from "@medusajs/ui"
import { ChartBar } from "@medusajs/icons"
import { useEffect, useState } from "react"

type SalesRecord = {
  id: string
  product_id: string
  product_title: string
  product_thumbnail: string | null
  product_handle: string | null
  product_status: string
  sales_count: number
  last_sold_at: string | null
}

type SalesStats = {
  total_sales: number
  products_tracked: number
  products_with_sales: number
}

type SortField = "sales_count" | "product_title" | "last_sold_at"
type SortDirection = "asc" | "desc"

/**
 * Sales Analytics Admin Page
 * Shows all product sales with sorting and inline editing
 */
const SalesAnalyticsPage = () => {
  const [sales, setSales] = useState<SalesRecord[]>([])
  const [stats, setStats] = useState<SalesStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>("sales_count")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  useEffect(() => {
    fetchSalesData()
  }, [])

  const fetchSalesData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/admin/sales", {
        credentials: "include",
      })
      const result = await response.json()
      if (result.success) {
        setSales(result.sales)
        setStats(result.stats)
      } else {
        setError(result.error || "Failed to load sales data")
      }
    } catch (err) {
      setError("Failed to load sales data")
    }
    setIsLoading(false)
  }

  const initializeAll = async () => {
    setIsInitializing(true)
    setError(null)
    try {
      const response = await fetch("/admin/sales", {
        method: "POST",
        credentials: "include",
      })
      const result = await response.json()
      if (result.success) {
        await fetchSalesData()
      } else {
        setError(result.error || "Failed to initialize")
      }
    } catch (err) {
      setError("Failed to initialize")
    }
    setIsInitializing(false)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const handleSaveEdit = async (productId: string) => {
    const newCount = parseInt(editValue, 10)
    if (isNaN(newCount) || newCount < 0) {
      setError("Please enter a valid non-negative number")
      return
    }

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
        // Update local state
        setSales((prev) =>
          prev.map((s) =>
            s.product_id === productId
              ? { ...s, sales_count: newCount }
              : s
          )
        )
        setEditingId(null)
      } else {
        setError(result.error || "Failed to update")
      }
    } catch (err) {
      setError("Failed to update")
    }
  }

  const sortedSales = [...sales].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case "sales_count":
        comparison = a.sales_count - b.sales_count
        break
      case "product_title":
        comparison = a.product_title.localeCompare(b.product_title)
        break
      case "last_sold_at":
        const aDate = a.last_sold_at ? new Date(a.last_sold_at).getTime() : 0
        const bDate = b.last_sold_at ? new Date(b.last_sold_at).getTime() : 0
        comparison = aDate - bDate
        break
    }
    return sortDirection === "asc" ? comparison : -comparison
  })

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num)
  }

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "Never"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField
    children: React.ReactNode
  }) => (
    <Table.HeaderCell
      className="cursor-pointer hover:bg-ui-bg-base-hover"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
        )}
      </div>
    </Table.HeaderCell>
  )

  if (isLoading) {
    return (
      <Container className="p-8">
        <div className="flex items-center gap-2">
          <ChartBar />
          <Heading level="h1">Sales Analytics</Heading>
        </div>
        <Text className="mt-4 text-ui-fg-muted">Loading...</Text>
      </Container>
    )
  }

  return (
    <Container className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ChartBar />
          <Heading level="h1">Sales Analytics</Heading>
        </div>
        <Button
          variant="secondary"
          onClick={initializeAll}
          disabled={isInitializing}
        >
          {isInitializing ? "Initializing..." : "Initialize All Products"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
          <button
            className="ml-2 underline"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-ui-bg-base border rounded-lg p-4">
            <Text className="text-ui-fg-muted text-sm">Total Units Sold</Text>
            <Text className="text-2xl font-bold mt-1">
              {formatNumber(stats.total_sales)}
            </Text>
          </div>
          <div className="bg-ui-bg-base border rounded-lg p-4">
            <Text className="text-ui-fg-muted text-sm">Products Tracked</Text>
            <Text className="text-2xl font-bold mt-1">
              {formatNumber(stats.products_tracked)}
            </Text>
          </div>
          <div className="bg-ui-bg-base border rounded-lg p-4">
            <Text className="text-ui-fg-muted text-sm">Products with Sales</Text>
            <Text className="text-2xl font-bold mt-1">
              {formatNumber(stats.products_with_sales)}
            </Text>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <SortHeader field="sales_count">Sales Count</SortHeader>
              <SortHeader field="last_sold_at">Last Sold</SortHeader>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sortedSales.length === 0 ? (
              <Table.Row>
                <Table.Cell>
                  <Text className="text-ui-fg-muted text-center py-8">
                    No sales data yet. Click "Initialize All Products" to start tracking.
                  </Text>
                </Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
                <Table.Cell></Table.Cell>
              </Table.Row>
            ) : (
              sortedSales.map((record) => (
                <Table.Row key={record.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {record.product_thumbnail && (
                        <img
                          src={record.product_thumbnail}
                          alt=""
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <div>
                        <Text className="font-medium">{record.product_title}</Text>
                        {record.product_handle && (
                          <Text className="text-xs text-ui-fg-muted">
                            /{record.product_handle}
                          </Text>
                        )}
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {editingId === record.product_id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20"
                          autoFocus
                        />
                        <Button
                          size="small"
                          onClick={() => handleSaveEdit(record.product_id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer hover:underline"
                        onClick={() => {
                          setEditingId(record.product_id)
                          setEditValue(String(record.sales_count))
                        }}
                      >
                        {formatNumber(record.sales_count)}
                      </div>
                    )}
                  </Table.Cell>
                  <Table.Cell>{formatDate(record.last_sold_at)}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={record.product_status === "published" ? "green" : "grey"}
                    >
                      {record.product_status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <a
                      href={`/app/products/${record.product_id}`}
                      className="text-ui-fg-interactive hover:underline text-sm"
                    >
                      View Product
                    </a>
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
  label: "Sales Analytics",
  icon: ChartBar,
})

export default SalesAnalyticsPage
