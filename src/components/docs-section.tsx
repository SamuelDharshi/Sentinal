import { Book, Code2, FileText, Terminal, Zap, GitBranch, Layers, Shield } from "lucide-react"
import Link from "next/link"

const docCategories = [
  {
    icon: Zap,
    title: "Getting Started",
    description: "Set up SENTINEL in 5 minutes with the setup wizard",
    links: ["Installation", "Setup Wizard", "First Intelligence Brief"],
  },
  {
    icon: Code2,
    title: "Agent Guides",
    description: "Deep-dives on Chief, Scout, Analyst, and CFO agents",
    links: ["Chief Orchestrator", "Scout Agent", "CFO / DIEM"],
  },
  {
    icon: Terminal,
    title: "x402 Protocol",
    description: "How Scout autonomously discovers and pays for data",
    links: ["Agentic Discovery", "ERC-7710 Payment", "Replay Protection"],
  },
  {
    icon: GitBranch,
    title: "MetaMask Delegation",
    description: "EIP-7702 upgrade, ERC-7715 grants, ERC-7710 redelegation",
    links: ["Account Upgrade", "Permission Grant", "Redelegation"],
  },
  {
    icon: Layers,
    title: "Venice AI",
    description: "Private inference, model selection, and DIEM staking",
    links: ["OpenAI-compat API", "DIEM Token", "VVV Staking"],
  },
  {
    icon: Shield,
    title: "1Shot Relayer",
    description: "Gasless execution, webhook verification, status handling",
    links: ["Relayer Setup", "Webhook Events", "USDC Gas"],
  },
]

export function DocsSection() {
  return (
    <section id="docs" className="py-24 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Book className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Documentation</span>
          </div>
          <h2 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to build with SENTINEL</h2>
          <p className="mt-4 text-muted-foreground">
            Comprehensive references for the MetaMask Smart Accounts Kit, 1Shot API, x402 protocol, and Venice AI integration.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {docCategories.map((category, index) => (
            <div
              key={index}
              className="group relative rounded-xl border border-border/60 bg-[#141414] p-6 transition-all duration-300 hover:border-accent/40 hover:bg-[#1a1a1a] scale-100 hover:scale-105"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <category.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-mono font-semibold">{category.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
              <ul className="mt-4 space-y-2">
                {category.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href="#"
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-accent"
                    >
                      <FileText className="h-3 w-3" />
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="#" className="inline-flex items-center gap-2 font-mono text-sm text-accent hover:underline">
            View full documentation on GitHub
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
