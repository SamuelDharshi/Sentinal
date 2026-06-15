import { Building2, Shield, Users, Headphones, Globe, Lock, BarChart3, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"

const enterpriseFeatures = [
  {
    icon: Shield,
    title: "Privacy & Isolation",
    description: "Private Venice AI inference guarantees your competitive queries and intelligence are never logged or stored.",
  },
  {
    icon: Users,
    title: "Multi-Agent Teams",
    description: "Coordinate a fleet of custom-briefed sub-agents under a single organization root wallet delegation.",
  },
  {
    icon: Headphones,
    title: "Dedicated Monitoring",
    description: "24/7 autonomous surveillance of defined competitors with immediate Telegram/Slack webhook delivery.",
  },
  {
    icon: Globe,
    title: "Distributed Scouts",
    description: "Query paid data APIs globally through decentralized routing to avoid rate limiting and fingerprinting.",
  },
  {
    icon: Lock,
    title: "Compliance & Auditing",
    description: "Full cryptographic transparency with a permanent, auditable ledger of all agent actions linked to BaseScan.",
  },
  {
    icon: BarChart3,
    title: "CFO Optimization",
    description: "Advanced AI CFO logic automatically locks VVV and mints DIEM tokens when API spend crosses thresholds.",
  },
  {
    icon: Workflow,
    title: "Custom Brief Pipelines",
    description: "Build multi-step orchestration flows for agents to fetch, analyze, and act on insights automatically.",
  },
  {
    icon: Building2,
    title: "Self-Hosted Nodes",
    description: "Run SENTINEL agent containers inside your secure private cloud or local infrastructure for maximum control.",
  },
]

const logos = ["Stripe", "Notion", "Linear", "Figma", "Vercel", "Supabase"]

export function EnterpriseSection() {
  return (
    <section id="enterprise" className="py-24 border-t border-border/40 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Building2 className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Enterprise</span>
          </div>
          <h2 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl">Built for scale</h2>
          <p className="mt-4 text-muted-foreground">
            Trusted by the world's most innovative companies. Get enterprise-grade features, security, and support for
            your organization.
          </p>
        </div>

        {/* Trusted by logos */}
        <div className="mx-auto mt-12 max-w-3xl">
          <p className="text-center text-sm text-muted-foreground mb-6">Trusted by industry leaders</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {logos.map((logo, index) => (
              <div key={index} className="font-mono text-lg font-semibold text-muted-foreground/60">
                {logo}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {enterpriseFeatures.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/60 bg-[#141414] p-6 transition-all duration-300 scale-100 hover:scale-105 hover:border-accent/40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-mono text-sm font-semibold">{feature.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-2xl border border-accent/40 bg-gradient-to-b from-accent/10 to-transparent p-8 text-center sm:p-12">
          <h3 className="font-mono text-xl font-bold">Ready to scale?</h3>
          <p className="mt-4 text-muted-foreground">
            Talk to our team to learn how SENTINEL can power your organization's competitive intelligence.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg">Contact Us</Button>
            <Button size="lg" variant="outline">
              Request Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}