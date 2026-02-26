

import { ShadcraftBanner } from "@/components/shadcraft-banner copy"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function LandingPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4">
      <div className="isolate flex size-full min-h-svh flex-col [--header-height:calc(--spacing(16))]">
        <ShadcraftBanner />

        <Header />
        <div className="relative isolate w-full flex-1">
          <div className="container mx-auto">{children}</div>
        </div>
        <Footer />
      </div>
    </main>
  )
}
