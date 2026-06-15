import type { Metadata } from 'next';
import { Geist, JetBrains_Mono } from "next/font/google"
import './globals.css';

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: 'SENTINEL — Autonomous Intelligence Engine',
  description:
    "Grant a weekly USDC budget once. SENTINEL's agent workforce buys intelligence privately and delivers insights to your dashboard — autonomously, forever, without a single extra click.",
  keywords: ['AI agents', 'intelligence', 'MetaMask', 'Web3', 'autonomous', 'privacy', 'ERC-7715', 'Venice AI', 'x402', '1Shot'],
  openGraph: {
    title: 'SENTINEL — Autonomous Intelligence Engine',
    description: 'Autonomous AI agents that buy intelligence on your behalf, privately, on-chain.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${geist.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
