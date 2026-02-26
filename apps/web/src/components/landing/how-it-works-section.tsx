import {
  CalendarCheck,
  Database,
  FileSearch,
  FolderKanban,
  MessageSquare,
  NotebookPen,
  ScanSearch,
} from "lucide-react"

import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"

const workflowSteps = [
  { title: "Capture", detail: "Add links, videos, PDFs, and notes.", icon: NotebookPen },
  { title: "Ingest", detail: "Extract text and metadata from each source.", icon: Database },
  {
    title: "Process & embed",
    detail: "Generate embeddings for semantic retrieval.",
    icon: ScanSearch,
  },
  {
    title: "Organize",
    detail: "Apply status, tags, and folders for focused workflows.",
    icon: FolderKanban,
  },
  {
    title: "Search & retrieve",
    detail: "Get document-level search results you can trust.",
    icon: FileSearch,
  },
  {
    title: "Ask AI with sources",
    detail: "Get answers with title, author, date, and source link context.",
    icon: MessageSquare,
  },
  {
    title: "Daily review",
    detail: "Resurface key knowledge to improve long-term retention.",
    icon: CalendarCheck,
  },
] as const

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative isolate scroll-mt-20">
      <div className="mx-auto max-w-6xl">
        <PageHeader>
          <PageHeaderHeading>How it works</PageHeaderHeading>
          <PageHeaderDescription>
            A practical pipeline from capturing information to turning it into
            retained, actionable knowledge.
          </PageHeaderDescription>
        </PageHeader>

        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-xl border bg-card p-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-muted text-sm font-medium">
                  {index + 1}
                </div>
                <step.icon className="size-4 text-muted-foreground" />
              </div>
              <h3 className="font-medium">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
