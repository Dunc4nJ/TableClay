import { deleteLineItem } from "@lib/data/cart"
import { breakBundleInCart } from "@lib/data/bundles"
import { Spinner, Trash } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { useState } from "react"

const DeleteButton = ({
  id,
  bundleInstanceId,
  children,
  className,
}: {
  id: string
  bundleInstanceId?: string
  children?: React.ReactNode
  className?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      if (bundleInstanceId) {
        await breakBundleInCart(bundleInstanceId, id)
      } else {
        await deleteLineItem(id)
      }
    } catch {
      setIsDeleting(false)
      return
    }
    setIsDeleting(false)
  }

  return (
    <div
      className={clx(
        "flex items-center justify-between text-small-regular",
        className
      )}
    >
      <button
        className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer"
        onClick={() => handleDelete(id)}
      >
        {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
        <span>{children}</span>
      </button>
    </div>
  )
}

export default DeleteButton
