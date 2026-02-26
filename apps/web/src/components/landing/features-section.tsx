import {
  FileSearch,
  FolderKanban,
  GitBranch,
  NotebookPen,
  Tag,
  Workflow,
} from "lucide-react";

import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";

const featureItems = [
  {
    title: "Capture from everywhere",
    description:
      "Save articles, videos, PDFs, and notes in one place for long-term learning.",
    icon: NotebookPen,
  },
  {
    title: "Ingest and process",
    description:
      "Content is parsed and prepared for retrieval with embeddings and structured metadata.",
    icon: Workflow,
  },
  {
    title: "Vector search + AI synthesis",
    description:
      "Find relevant documents quickly and ask AI for grounded answers with sources.",
    icon: FileSearch,
  },
  {
    title: "Tag and annotate",
    description:
      "Use tags and notes to build context and connect ideas over time.",
    icon: Tag,
  },
  {
    title: "Track in folders and courses",
    description:
      "Organize learning paths with collections of articles and videos.",
    icon: FolderKanban,
  },
  {
    title: "Personal knowledge graph",
    description:
      "Visualize how documents relate and discover missing links in your understanding.",
    icon: GitBranch,
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="features" className="relative isolate scroll-mt-20">
      <div className="mx-auto max-w-6xl">
        <PageHeader>
          <PageHeaderHeading>Core capabilities</PageHeaderHeading>
          <PageHeaderDescription>
            Everything you need to turn scattered technical content into a
            usable, searchable, and reviewable knowledge system.
          </PageHeaderDescription>
        </PageHeader>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureItems.map((item) => (
            <article key={item.title} className="rounded-xl border bg-card p-5">
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
                <item.icon className="size-5" />
              </div>
              <h3 className="text-lg font-medium">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
