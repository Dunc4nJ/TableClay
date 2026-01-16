import { redirect } from "next/navigation"

export default async function OddsEndsRedirect(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  redirect(`/${countryCode}/categories/odd-and-ends`)
}
