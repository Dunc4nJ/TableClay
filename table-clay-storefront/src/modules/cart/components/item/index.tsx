"use client"

import { Table, Text, clx } from "@medusajs/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
  /** If true, this item is part of a bundle and should render with reduced controls */
  isBundleItem?: boolean
}

const Item = ({
  item,
  type = "full",
  currencyCode,
  isBundleItem = false,
}: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const metadata = item.metadata as Record<string, unknown> | null
  const bundleInstanceId = metadata?.bundle_instance_id as string | undefined

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  // TODO: Update this to grab the actual max inventory
  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  return (
    <Table.Row
      className={clx("w-full", {
        "bg-ui-bg-subtle-hover": isBundleItem,
      })}
      data-testid="product-row"
    >
      <Table.Cell className={clx("p-4 w-24", isBundleItem ? "!pl-4" : "!pl-0")}>
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
            "w-12 small:w-16": isBundleItem,
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className={clx("txt-medium-plus", {
            "text-ui-fg-base": !isBundleItem,
            "text-ui-fg-subtle text-sm": isBundleItem,
          })}
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          {isBundleItem ? (
            // Bundle items show quantity as text (not editable)
            <div className="flex flex-col gap-2">
              <Text className="text-ui-fg-subtle text-sm">
                Qty: {item.quantity}
              </Text>
              <DeleteButton
                id={item.id}
                bundleInstanceId={bundleInstanceId}
                className="text-xs"
              >
                Remove item
              </DeleteButton>
            </div>
          ) : (
            // Regular items have editable quantity and delete button
            <div className="flex gap-2 items-center w-28">
              <DeleteButton id={item.id} data-testid="product-delete-button" />
              <CartItemSelect
                value={item.quantity}
                onChange={(value) =>
                  changeQuantity(parseInt(value.target.value))
                }
                className="w-14 h-10 p-4"
                data-testid="product-select-button"
              >
                {/* TODO: Update this with the v2 way of managing inventory */}
                {Array.from(
                  {
                    length: Math.min(maxQuantity, 10),
                  },
                  (_, i) => (
                    <option value={i + 1} key={i}>
                      {i + 1}
                    </option>
                  )
                )}

                <option value={1} key={1}>
                  1
                </option>
              </CartItemSelect>
              {updating && <Spinner />}
            </div>
          )}
          {!isBundleItem && (
            <ErrorMessage error={error} data-testid="product-error-message" />
          )}
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
