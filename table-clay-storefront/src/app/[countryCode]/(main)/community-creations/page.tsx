import { Metadata } from "next"
import CommunityCreationsTemplate from "@modules/community-creations/templates"
import { getCommunityCreations } from "@lib/data/community-creations"

export const metadata: Metadata = {
  title: "Community Creations | Table Clay",
  description:
    "Explore pottery created by our community. See what our customers have made with the Table Clay Mini Wheel.",
}

export default async function CommunityCreationsPage() {
  const { creations, count, has_more } = await getCommunityCreations({
    limit: 12,
    offset: 0,
  })

  return (
    <CommunityCreationsTemplate
      initialCreations={creations}
      totalCount={count}
      hasMore={has_more}
    />
  )
}
