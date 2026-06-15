import { Check, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Scout",
    price: "$5",
    period: "/week",
    description: "For solo founders just getting started",
    features: [
      "ERC-7715 weekly budget grant",
      "HackerNews + GitHub Trending (free)",
      "Venice AI private synthesis",
      "~8–10 intelligence cards/week",
      "On-chain audit trail",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Standard",
    price: "$10",
    period: "/week",
    description: "The recommended budget for full coverage",
    features: [
      "Everything in Scout",
      "Serper Search API via x402",
      "Product Hunt + RSS feeds",
      "~15–25 intelligence cards/week",
      "CFO Agent: DIEM optimization",
      "Kill switch + budget alerts",
      "Delegation trace on every card",
    ],
    cta: "Grant Permission & Launch",
    popular: true,
  },
  {
    name: "Command",
    price: "$20",
    period: "/week",
    description: "For teams tracking multiple niches",
    features: [
      "Everything in Standard",
      "Diffbot + BuiltWith via x402",
      "Multiple intelligence briefs",
      "Priority Venice AI inference",
      "SLA-backed agent uptime",
      "Dedicated support",
      "Team Mission Control access",
    ],
    cta: "Contact Us",
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 border-t border-border/40 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <DollarSign className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wider">Pricing</span>
          </div>
          <h2 className="mt-4 font-mono text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent weekly budget</h2>
          <p className="mt-4 text-muted-foreground">Set your budget once. No hidden fees. Cancel anytime by revoking the on-chain permission.</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-xl border p-8 border-transparent ${
                plan.popular ? "border-accent bg-[#141414] shadow-lg shadow-accent/10" : "border-border/60 bg-[#0f0f0f]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full px-3 py-1 text-xs font-medium text-accent-foreground bg-accent">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center">
                <h3 className="font-mono text-lg font-semibold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="font-mono text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-accent" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button
                  className={`w-full ${plan.popular ? "" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
                  variant={plan.popular ? "default" : "secondary"}
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
