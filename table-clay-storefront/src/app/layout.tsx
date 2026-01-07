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
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
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
