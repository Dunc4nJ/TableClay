import { CommunityCreation } from "@lib/data/community-creations"
import InfiniteCreations from "../components/infinite-creations"

type Props = {
  initialCreations: CommunityCreation[]
  totalCount: number
  hasMore: boolean
}

export default function CommunityCreationsTemplate({
  initialCreations,
  totalCount,
  hasMore,
}: Props) {
  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-cream-100">
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_14%_0%,rgba(212,165,116,0.22),transparent_60%),radial-gradient(700px_420px_at_90%_-10%,rgba(160,130,109,0.18),transparent_55%)]" />
        <div className="content-container relative py-16 sm:py-20">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-700">
            Community
          </p>
          <h1 className="mt-5 font-display text-4xl sm:text-5xl text-ui-fg-base">
            Community Creations
          </h1>
          <p className="mt-4 text-lg text-ui-fg-subtle max-w-2xl">
            See what our community has made with the Mini Wheel. Each piece
            tells a unique story of creativity and craftsmanship.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="content-container py-12">
        <InfiniteCreations
          initialCreations={initialCreations}
          totalCount={totalCount}
          initialHasMore={hasMore}
        />
      </section>

      {/* Footer CTA */}
      <section className="content-container">
        <div className="rounded-3xl bg-brand-900 text-cream-100 p-8 sm:p-10 shadow-lg">
          <h2 className="font-display text-3xl">Share Your Creations</h2>
          <p className="mt-3 text-cream-100/80 text-lg max-w-2xl">
            Have you made something special with your Mini Wheel? We&apos;d love
            to feature it here and inspire others in our community.
          </p>
          <div className="mt-6">
            <a
              href="https://drive.google.com/drive/folders/1BN2_xR0kdGNEZDx1B1fQGg9V3-898bmU?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-cream-100 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand-900 transition hover:bg-cream-200"
            >
              Submit Your Work
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
