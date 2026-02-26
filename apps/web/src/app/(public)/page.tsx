import Link from "next/link"
import {
  CalendarCheck,
  FileText,
  Folder,
  GraduationCap,
  Network,
  Search,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Search,
    title: "Smart Search",
    description: "Semantic search across your knowledge base with AI results.",
  },
  {
    icon: FileText,
    title: "Documents",
    description: "Ingest URLs, text, PDFs, and videos in one place.",
  },
  {
    icon: CalendarCheck,
    title: "Daily Review",
    description: "Reinforce learning with spaced repetition sessions.",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    description: "Visualize relationships across your concepts.",
  },
  {
    icon: Folder,
    title: "Collections",
    description: "Organize notes and docs into learning pathways.",
  },
  {
    icon: GraduationCap,
    title: "Courses",
    description: "Track progress through structured study plans.",
  },
]

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          Mind Stack
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </header>

      <section className="mt-14 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3" />
          Personal Knowledge Management
        </div>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Build your second brain with a secure authenticated workspace
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground md:text-lg">
          Capture, organize, search, and review knowledge with an application
          shell designed for focused daily use.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <feature.icon className="size-5 text-primary" />
              <h2 className="font-semibold">{feature.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
