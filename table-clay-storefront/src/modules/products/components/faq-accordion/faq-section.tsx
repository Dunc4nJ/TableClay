import { getProductFAQs } from "@lib/data/faqs"
import FAQAccordion from "./index"

interface FAQSectionProps {
  productId: string
  title?: string
  className?: string
}

/**
 * FAQSection - Server component wrapper for FAQAccordion
 * Fetches FAQs and renders the accordion
 */
const FAQSection = async ({
  productId,
  title,
  className = "",
}: FAQSectionProps) => {
  const faqs = await getProductFAQs(productId)

  if (faqs.length === 0) {
    return null
  }

  return <FAQAccordion faqs={faqs} title={title} className={className} />
}

export default FAQSection
