"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useIntersection } from "@lib/hooks/use-in-view"
import {
  CommunityCreation,
  fetchMoreCommunityCreations,
} from "@lib/data/community-creations"
import CreationCard from "../creation-card"

const ITEMS_LIMIT = 12

type Props = {
  initialCreations: CommunityCreation[]
  totalCount: number
  initialHasMore: boolean
}

export default function InfiniteCreations({
  initialCreations,
  totalCount,
  initialHasMore,
}: Props) {
  const [creations, setCreations] =
    useState<CommunityCreation[]>(initialCreations)
  const [offset, setOffset] = useState(initialCreations.length)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isPending, startTransition] = useTransition()

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isInView = useIntersection(loadMoreRef, "200px")

  // Reset when initial props change
  useEffect(() => {
    setCreations(initialCreations)
    setOffset(initialCreations.length)
    setHasMore(initialHasMore)
  }, [initialCreations, initialHasMore])

  const loadMore = useCallback(() => {
    if (isPending || !hasMore) return

    startTransition(async () => {
      try {
        const result = await fetchMoreCommunityCreations({
          offset,
          limit: ITEMS_LIMIT,
        })

        // Filter out duplicates by id
        const existingIds = new Set(creations.map((c) => c.id))
        const newCreations = result.creations.filter(
          (c) => !existingIds.has(c.id)
        )

        if (newCreations.length > 0) {
          setCreations((prev) => [...prev, ...newCreations])
          setOffset((prev) => prev + newCreations.length)
        }

        setHasMore(result.has_more)
      } catch (error) {
        console.error("Error loading more creations:", error)
      }
    })
  }, [isPending, hasMore, offset, creations])

  // Trigger load when sentinel is visible
  useEffect(() => {
    if (isInView && !isPending && hasMore) {
      loadMore()
    }
  }, [isInView, isPending, hasMore, loadMore])

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {creations.map((creation) => (
          <CreationCard key={creation.id} creation={creation} />
        ))}
      </div>

      {/* Sentinel element for intersection observer */}
      <div ref={loadMoreRef} className="w-full py-8 flex justify-center">
        {isPending && (
          <div className="flex items-center gap-2 text-ui-fg-subtle">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading more creations...</span>
          </div>
        )}
        {!hasMore && creations.length > 0 && (
          <p className="text-ui-fg-muted text-sm">
            You&apos;ve seen all {totalCount} creations
          </p>
        )}
        {creations.length === 0 && !isPending && (
          <p className="text-ui-fg-muted text-sm">No community creations yet</p>
        )}
      </div>
    </>
  )
}
