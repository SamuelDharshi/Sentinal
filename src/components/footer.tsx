import Link from "next/link"

const footerLinks = {
  Product: ["Features", "Pricing", "Enterprise", "Changelog"],
  Resources: ["Documentation", "Guides", "API Reference", "Community"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security"],
}

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <span className="text-sm font-bold font-mono">S</span>
              </div>
              <span className="text-lg font-semibold tracking-tight font-mono">SENTINEL</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Autonomous on-chain intelligence workforces powered by MetaMask Smart Accounts, 1Shot API, and private Venice AI models.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <ul className="mt-4 space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border/40 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} SENTINEL. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
