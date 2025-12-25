import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Outfit } from "next/font/google"
import "styles/globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Table Clay | Handcrafted Ceramics",
    template: "%s | Table Clay",
  },
  description: "Made by hand, made with care. Discover our collection of handcrafted ceramic mugs, bowls, vases, and more.",
  keywords: ["handmade ceramics", "pottery", "ceramic mugs", "handcrafted", "artisan pottery"],
  openGraph: {
    title: "Table Clay | Handcrafted Ceramics",
    description: "Made by hand, made with care. Discover our collection of handcrafted ceramics.",
    type: "website",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light" className={outfit.variable}>
      <body className="font-sans antialiased">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
