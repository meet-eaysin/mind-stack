import {
  SectionHeading,
  SectionHeadingBody,
  SectionHeadingTitle,
} from "@/components/ui/section-heading";
import { KnowledgeGraphFlow } from "@/components/landing/graph/knowledge-graph-flow";

export function KnowledgeGraphSection() {
  return (
    <section className="relative isolate">
      <div className="mx-auto max-w-6xl rounded-2xl border bg-card/60 p-5 sm:p-6 lg:p-8">
        <SectionHeading className="gap-2.5">
          <SectionHeadingTitle className="text-3xl lg:text-4xl">
            Knowledge graph, simplified
          </SectionHeadingTitle>
          <SectionHeadingBody className="max-w-3xl text-sm md:text-base">
            Your Brain is the root node. Unrelated documents connect directly to
            it, while related documents connect to each other and still chain
            back to the root.
          </SectionHeadingBody>
        </SectionHeading>

        <div className="mt-5 overflow-hidden rounded-xl border bg-background/70 shadow-sm md:mt-6">
          <KnowledgeGraphFlow />
        </div>
      </div>
    </section>
  );
}
