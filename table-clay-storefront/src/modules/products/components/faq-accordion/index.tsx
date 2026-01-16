"use client"

import { useState } from "react"
import { Text, clx } from "@medusajs/ui"
import type { FAQ } from "@lib/data/faqs"

interface FAQAccordionProps {
  faqs: FAQ[]
  title?: string
  className?: string
}

/**
 * FAQAccordion - Collapsible FAQ list
 * Single-item open at a time, smooth animations
 */
const FAQAccordion = ({
  faqs,
  title = "Table Clay Q&A",
  className = "",
}: FAQAccordionProps) => {
  const [openId, setOpenId] = useState<string | null>(null)

  if (faqs.length === 0) {
    return null
  }

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section className={clx("py-12", className)}>
      <div className="content-container">
        <div className="max-w-3xl mx-auto">
          <Text className="text-2xl font-semibold text-center mb-8">
            {title}
          </Text>

          <div className="space-y-0">
            {faqs.map((faq) => {
              const isOpen = openId === faq.id

              return (
                <div
                  key={faq.id}
                  className="border-b border-ui-border-base last:border-b-0"
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full flex items-center justify-between py-4 text-left hover:text-ui-fg-base transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`faq-content-${faq.id}`}
                  >
                    <span className="font-medium text-ui-fg-subtle pr-4">
                      {faq.question}
                    </span>
                    <ChevronIcon isOpen={isOpen} />
                  </button>

                  <div
                    id={`faq-content-${faq.id}`}
                    className={clx(
                      "overflow-hidden transition-all duration-200 ease-in-out",
                      isOpen ? "max-h-96 pb-4" : "max-h-0"
                    )}
                    aria-hidden={!isOpen}
                  >
                    <Text className="text-ui-fg-muted text-sm leading-relaxed">
                      {faq.answer}
                    </Text>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * ChevronIcon - Animated chevron for accordion trigger
 */
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={clx(
      "w-5 h-5 flex-shrink-0 text-ui-fg-muted transition-transform duration-200",
      isOpen && "rotate-180"
    )}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
)

export default FAQAccordion
