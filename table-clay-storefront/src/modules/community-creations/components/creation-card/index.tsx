import Image from "next/image"
import { CommunityCreation } from "@lib/data/community-creations"

type Props = {
  creation: CommunityCreation
}

export default function CreationCard({ creation }: Props) {
  const formattedDate = new Date(creation.display_date).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  )

  return (
    <div className="group rounded-3xl bg-cream-50 border border-cream-300 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="aspect-square relative overflow-hidden bg-cream-200">
        <Image
          src={creation.image_url}
          alt={creation.image_alt_text || creation.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="p-6">
        <h3 className="font-display text-xl text-ui-fg-base">
          {creation.title}
        </h3>
        <p className="mt-2 text-sm text-ui-fg-subtle">
          by {creation.creator_name} &bull; {formattedDate}
        </p>
      </div>
    </div>
  )
}
