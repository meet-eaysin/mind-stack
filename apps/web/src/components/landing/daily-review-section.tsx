import { CheckCircle2, Clock3 } from "lucide-react"

import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const learningStatuses = [
  "To Watch",
  "To Read",
  "In-Process",
  "Review",
  "Upcoming",
  "Completed",
  "Pending Completion",
] as const

const dailyReviewHighlights = [
  "Prioritized resurfacing based on your activity",
  "Quick revisit of core concepts and sources",
  "Continuous reinforcement for active projects",
] as const

export function DailyReviewSection() {
  return (
    <section className="relative isolate">
      <div className="mx-auto max-w-6xl">
        <PageHeader>
          <PageHeaderHeading>Daily learning system</PageHeaderHeading>
          <PageHeaderDescription>
            Keep momentum with status-based workflows and daily resurfacing of
            important knowledge.
          </PageHeaderDescription>
        </PageHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border bg-card p-5">
            <h3 className="text-lg font-medium">Document workflow statuses</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Move work forward with explicit states from intake to completion.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {learningStatuses.map((status) => (
                <Badge key={status} variant="secondary">
                  <Clock3 className="mr-1 size-3" />
                  {status}
                </Badge>
              ))}
            </div>
          </article>

          <article className="rounded-xl border bg-card p-5">
            <h3 className="text-lg font-medium">Review that actually sticks</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Daily review brings back the right knowledge at the right time so
              you can use it in real projects.
            </p>
            <Separator className="my-4" />
            <ul className="space-y-2 text-sm">
              {dailyReviewHighlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}
