import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { KnowledgeGraphFlow } from "@/components/landing/graph/knowledge-graph-flow"

export function KnowledgeGraphSection() {
  return (
    <section className="relative isolate">
      <div className="mx-auto max-w-6xl rounded-2xl border bg-card p-6 md:p-8">
        <PageHeader className="pb-0">
          <PageHeaderHeading>Knowledge graph, simplified</PageHeaderHeading>
          <PageHeaderDescription>
            Your Brain is the root node. Unrelated documents connect directly to
            it, while related documents connect to each other and still chain
            back to the root.
          </PageHeaderDescription>
        </PageHeader>

        <div className="mt-6 overflow-hidden rounded-xl border bg-background">
          <KnowledgeGraphFlow />
        </div>
      </div>
    </section>
  )
}
