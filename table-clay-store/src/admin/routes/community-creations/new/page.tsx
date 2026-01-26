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
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ImageUploader, ImageItem } from "../../../components/image-uploader"

type CreateCommunityCreationData = {
  title: string
  creator_first_name: string
  creator_last_initial: string
  image_url: string
  image_alt_text?: string
  display_date: string
  is_active: boolean
  sort_order: number
}

const createCommunityCreation = async (data: CreateCommunityCreationData) => {
  const response = await fetch("/admin/community-creations", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create community creation")
  }
  return response.json()
}

const NewCommunityCreationPage = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [creatorFirstName, setCreatorFirstName] = useState("")
  const [creatorLastInitial, setCreatorLastInitial] = useState("")
  const [images, setImages] = useState<ImageItem[]>([])
  const [displayDate, setDisplayDate] = useState<Date | undefined>(new Date())
  const [isActive, setIsActive] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: createCommunityCreation,
    onSuccess: () => {
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
    createMutation.mutate({
      title: title.trim(),
      creator_first_name: creatorFirstName.trim(),
      creator_last_initial: creatorLastInitial.trim().charAt(0).toUpperCase(),
      image_url: image.url,
      image_alt_text: image.alt_text || undefined,
      display_date: displayDate.toISOString(),
      is_active: isActive,
      sort_order: sortOrder,
    })
  }

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4">
        <Button variant="transparent" onClick={() => navigate("/community-creations")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <Heading level="h1">Add Community Creation</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Showcase a customer's pottery creation
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
              Will display as "Sarah K."
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
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Add Community Creation",
})

export default NewCommunityCreationPage
