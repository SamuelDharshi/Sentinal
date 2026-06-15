import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" })
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "SENTINEL — Autonomous Intelligence Engine",
  description:
    "Grant a weekly USDC budget once. SENTINEL's agent workforce goes out on the open web, buys intelligence, synthesizes it privately on Venice AI, and delivers insights to your dashboard — autonomously, forever.",
  keywords: ["AI agents", "intelligence", "MetaMask", "Web3", "autonomous", "Venice AI", "x402", "1Shot", "ERC-7715"],
  openGraph: {
    title: "SENTINEL — Autonomous Intelligence Engine",
    description: "Autonomous AI agents that buy intelligence on your behalf, privately, on-chain.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
