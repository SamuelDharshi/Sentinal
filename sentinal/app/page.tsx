import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { StatsSection } from "@/components/stats-section"
import { FeaturesSection } from "@/components/features-section"
import { DeveloperExperience } from "@/components/developer-experience"
import { CodeSection } from "@/components/code-section"
import { DocsSection } from "@/components/docs-section"
import { PricingSection } from "@/components/pricing-section"
import { EnterpriseSection } from "@/components/enterprise-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <DeveloperExperience />
      <CodeSection />
      <DocsSection />
      <PricingSection />
      <EnterpriseSection />
      <CTASection />
      <Footer />
    </main>
  )
}
