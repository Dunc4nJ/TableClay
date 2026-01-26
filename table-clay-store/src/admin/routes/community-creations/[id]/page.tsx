import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowLeft } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Switch,
  Label,
  DatePicker,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ImageUploader, ImageItem } from "../../../components/image-uploader"

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

type UpdateCommunityCreationData = {
  title?: string
  creator_first_name?: string
  creator_last_initial?: string
  image_url?: string
  image_alt_text?: string
  display_date?: string
  is_active?: boolean
  sort_order?: number
}

const fetchCommunityCreation = async (id: string): Promise<{ creation: CommunityCreation }> => {
  const response = await fetch(`/admin/community-creations/${id}`, {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Failed to fetch community creation")
  return response.json()
}

const updateCommunityCreation = async ({
  id,
  data,
}: {
  id: string
  data: UpdateCommunityCreationData
}) => {
  const response = await fetch(`/admin/community-creations/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update community creation")
  }
  return response.json()
}

const EditCommunityCreationPage = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [creatorFirstName, setCreatorFirstName] = useState("")
  const [creatorLastInitial, setCreatorLastInitial] = useState("")
  const [images, setImages] = useState<ImageItem[]>([])
  const [displayDate, setDisplayDate] = useState<Date | undefined>(new Date())
  const [isActive, setIsActive] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const { data, isLoading, error: fetchError } = useQuery({
    queryKey: ["community-creation", id],
    queryFn: () => fetchCommunityCreation(id!),
    enabled: !!id,
  })

  // Initialize form when data loads
  useEffect(() => {
    if (data?.creation && !isInitialized) {
      const creation = data.creation
      setTitle(creation.title)
      setCreatorFirstName(creation.creator_first_name)
      setCreatorLastInitial(creation.creator_last_initial)
      setImages([
        {
          url: creation.image_url,
          alt_text: creation.image_alt_text || "",
        },
      ])
      setDisplayDate(new Date(creation.display_date))
      setIsActive(creation.is_active)
      setSortOrder(creation.sort_order)
      setIsInitialized(true)
    }
  }, [data, isInitialized])

  const updateMutation = useMutation({
    mutationFn: updateCommunityCreation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-creations"] })
      queryClient.invalidateQueries({ queryKey: ["community-creation", id] })
      navigate("/community-creations")
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("Please enter a title")
      return
    }
    if (!creatorFirstName.trim()) {
      setError("Please enter the creator's first name")
      return
    }
    if (!creatorLastInitial.trim()) {
      setError("Please enter the creator's last initial")
      return
    }
    if (images.length === 0) {
      setError("Please upload an image")
      return
    }
    if (!displayDate) {
      setError("Please select a display date")
      return
    }

    const image = images[0]
    updateMutation.mutate({
      id: id!,
      data: {
        title: title.trim(),
        creator_first_name: creatorFirstName.trim(),
        creator_last_initial: creatorLastInitial.trim().charAt(0).toUpperCase(),
        image_url: image.url,
        image_alt_text: image.alt_text || undefined,
        display_date: displayDate.toISOString(),
        is_active: isActive,
        sort_order: sortOrder,
      },
    })
  }

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-center px-6 py-12">
          <Text className="text-ui-fg-muted">Loading...</Text>
        </div>
      </Container>
    )
  }

  if (fetchError) {
    return (
      <Container className="divide-y p-0">
        <div className="flex flex-col items-center justify-center px-6 py-12 gap-4">
          <Text className="text-ui-fg-error">Failed to load community creation</Text>
          <Button variant="secondary" onClick={() => navigate("/community-creations")}>
            Back to List
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4">
        <Button variant="transparent" onClick={() => navigate("/community-creations")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <Heading level="h1">Edit Community Creation</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Update this customer pottery showcase
          </Text>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
        {error && (
          <div className="bg-ui-bg-error p-4 rounded-lg">
            <Text className="text-ui-fg-error">{error}</Text>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Morning Coffee Mug"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Creator Name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="creator_first_name">Creator First Name *</Label>
            <Input
              id="creator_first_name"
              placeholder="Sarah"
              value={creatorFirstName}
              onChange={(e) => setCreatorFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="creator_last_initial">Last Initial *</Label>
            <Input
              id="creator_last_initial"
              placeholder="K"
              maxLength={1}
              value={creatorLastInitial}
              onChange={(e) => setCreatorLastInitial(e.target.value.toUpperCase())}
            />
            <Text className="text-ui-fg-subtle text-xs">
              Will display as "{creatorFirstName || 'Name'} {creatorLastInitial || 'X'}."
            </Text>
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Image *</Label>
          <ImageUploader
            images={images}
            onChange={setImages}
            maxImages={1}
          />
        </div>

        {/* Display Date */}
        <div className="space-y-2">
          <Label>Display Date *</Label>
          <DatePicker
            value={displayDate}
            onChange={(date) => setDisplayDate(date ?? undefined)}
          />
          <Text className="text-ui-fg-subtle text-xs">
            When this creation should be displayed (used for ordering)
          </Text>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
          />
          <Text className="text-ui-fg-subtle text-sm">
            Lower numbers appear first (within same date)
          </Text>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
          <Label htmlFor="is_active">Active (visible on storefront)</Label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate("/community-creations")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Edit Community Creation",
})

export default EditCommunityCreationPage
