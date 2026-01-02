import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CogSixTooth } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Switch,
  Badge,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"

type SettingsResponse = {
  success: boolean
  settings: Record<string, string | null>
  bundle_promo: {
    promo_text: string | null
    enabled: boolean
  }
}

const fetchSettings = async (): Promise<SettingsResponse> => {
  const response = await fetch("/admin/settings", {
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error("Failed to fetch settings")
  }
  return response.json()
}

const updateSettings = async (data: {
  promo_text?: string | null
  enabled?: boolean
}) => {
  const response = await fetch("/admin/settings", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error("Failed to update settings")
  }
  return response.json()
}

const SettingsPage = () => {
  const queryClient = useQueryClient()

  // Form state
  const [promoText, setPromoText] = useState("")
  const [promoEnabled, setPromoEnabled] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  })

  // Populate form when data loads
  useEffect(() => {
    if (data?.bundle_promo) {
      setPromoText(data.bundle_promo.promo_text || "")
      setPromoEnabled(data.bundle_promo.enabled)
      setHasChanges(false)
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      setHasChanges(false)
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  const handlePromoTextChange = (value: string) => {
    setPromoText(value)
    setHasChanges(true)
  }

  const handleEnabledChange = (value: boolean) => {
    setPromoEnabled(value)
    setHasChanges(true)
  }

  const handleSave = () => {
    updateMutation.mutate({
      promo_text: promoText || null,
      enabled: promoEnabled,
    })
  }

  const handleReset = () => {
    if (data?.bundle_promo) {
      setPromoText(data.bundle_promo.promo_text || "")
      setPromoEnabled(data.bundle_promo.enabled)
      setHasChanges(false)
    }
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-muted">Loading settings...</Text>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="divide-y p-0">
        <div className="flex flex-col items-center justify-center px-6 py-12 gap-4">
          <Text className="text-ui-fg-error">Failed to load settings</Text>
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
          <Heading level="h1">Store Settings</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Configure global store settings
          </Text>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleSave} isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Bundle Promotion Section */}
      <div className="px-6 py-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Heading level="h2">Bundle Promotion Banner</Heading>
            <Badge color={promoEnabled ? "green" : "grey"} size="small">
              {promoEnabled ? "Active" : "Inactive"}
            </Badge>
          </div>
          <Text className="text-ui-fg-subtle mb-6">
            Display a promotional message at the top of bundle selectors on
            product pages. This appears globally on all products with bundles.
          </Text>

          <div className="space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-ui-bg-subtle rounded-lg">
              <div>
                <Label className="font-medium">Enable Promo Banner</Label>
                <Text className="text-sm text-ui-fg-subtle">
                  Show the promotional message on bundle selectors
                </Text>
              </div>
              <Switch
                checked={promoEnabled}
                onCheckedChange={handleEnabledChange}
              />
            </div>

            {/* Promo Text Input */}
            <div className="space-y-2">
              <Label htmlFor="promoText">Promo Message</Label>
              <Input
                id="promoText"
                placeholder="e.g., NEW YEAR SALE | $100 Off + Free Shipping"
                value={promoText}
                onChange={(e) => handlePromoTextChange(e.target.value)}
              />
              <Text className="text-sm text-ui-fg-subtle">
                Use | to separate different promotional points. Leave empty to
                hide the banner even when enabled.
              </Text>
            </div>

            {/* Preview */}
            {promoEnabled && promoText && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                  <Text className="text-center text-amber-800 font-medium">
                    {promoText}
                  </Text>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Future Settings Placeholder */}
      <div className="px-6 py-6">
        <div className="max-w-2xl">
          <Heading level="h2" className="mb-4 text-ui-fg-subtle">
            Additional Settings
          </Heading>
          <Text className="text-ui-fg-muted">
            More store-wide settings will be added here in future updates.
          </Text>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Store Settings",
  icon: CogSixTooth,
})

export default SettingsPage
