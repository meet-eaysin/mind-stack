"use client";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Search,
  FileText,
  CalendarCheck,
  Network,
  Sparkles,
  Folder,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    href: "/search",
    icon: Search,
    title: "Smart Search",
    description:
      "Semantic search across your knowledge base with AI-powered results.",
  },
  {
    href: "/documents",
    icon: FileText,
    title: "Documents",
    description:
      "Manage your ingested content — URLs, text, PDFs, and YouTube videos.",
  },
  {
    href: "/review",
    icon: CalendarCheck,
    title: "Daily Review",
    description:
      "Spaced repetition review to strengthen your knowledge retention.",
  },
  {
    href: "/graph",
    icon: Network,
    title: "Knowledge Graph",
    description: "Visualize connections between concepts in your second brain.",
  },
  {
    href: "/collections",
    icon: Folder,
    title: "Collections",
    description:
      "Organize documents into structured learning paths and courses.",
  },
];

export default function HomePage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center gap-12 py-12 text-center md:py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3" />
            Personal Knowledge Management
          </div>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Your <span className="text-primary">Second Brain</span>,
            Supercharged
          </h1>
          <p className="max-w-lg text-muted-foreground md:text-lg">
            Ingest, organize, and recall knowledge with AI. Built for software
            engineers who learn constantly.
          </p>
          <div className="flex gap-3">
            <Button size="lg" asChild>
              <Link href="/search">
                <Search className="mr-2 size-4" />
                Start Searching
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/documents">
                <FileText className="mr-2 size-4" />
                View Documents
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid w-full max-w-4xl gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group rounded-lg border bg-card p-6 text-left transition-colors hover:bg-accent"
            >
              <div className="mb-3 flex items-center gap-2">
                <feature.icon className="size-5 text-primary" />
                <h3 className="font-semibold">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
