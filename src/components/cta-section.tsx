import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 bg-card/30 py-24 sm:py-32">
      <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
        <div
          className="w-[200%] h-[70%] origin-bottom animate-floor"
          style={{
            background: `
              linear-gradient(to right, #3a3a3a 2px, transparent 2px),
              linear-gradient(to bottom, #3a3a3a 2px, transparent 2px)
            `,
            backgroundSize: "4rem 4rem",
            transform: "perspective(500px) rotateX(60deg)",
            maskImage: "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Ready to secure your edge?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join developers and founders automating their market intelligence with SENTINEL. Grant permission once, track forever.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto">
              Deploy SENTINEL
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
              View Github
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
