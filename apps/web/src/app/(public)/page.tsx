"use client";

import { ArrowRightIcon, Brain, Figma, Github, Plus } from "lucide-react";
import Link from "next/link";

import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative isolate flex w-full flex-col gap-12 overflow-hidden px-4 pt-6 pb-12 lg:gap-16 lg:px-8 lg:pt-10 lg:pb-20">
      <HeroSection />
      <FreeKitCTA />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate">
      <div
        className="mx-auto max-w-3xl"
      >
        <PageHeader className="relative items-center justify-center text-center">
          <div className="flex flex-col items-center gap-2">
            <PageHeaderHeading>
              <span className="bg-clip-text text-primary">
                Premium quality shadcn/ui components and blocks
              </span>
            </PageHeaderHeading>
          </div>

          <div className="flex flex-col items-center gap-2">
            <PageHeaderDescription>
              A free registry of polished shadcn/ui components and marketing blocks built
              to production standards. Fast to use, easy to extend, and ready for any
              modern web project.
            </PageHeaderDescription>
          </div>

          <div className="flex items-center justify-center">
            <PageHeaderActions className="mx-auto grid w-fit grid-cols-1 pt-4 sm:grid-cols-2">
              <Button asChild>
                <Link href="/ui/avatar-stack">Explore the registry</Link>
              </Button>

              <Button variant="outline" asChild>
                <Link
                  href="https://github.com/shadcraft/shadcraft-free"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="size-4" />
                  GitHub
                </Link>
              </Button>
            </PageHeaderActions>
          </div>
        </PageHeader>
      </div>
    </section>
  );
}

function FreeKitCTA() {
  return (
    <section className="relative isolate">
      <div

        className="mx-auto flex max-w-3xl flex-col gap-4 rounded-3xl bg-secondary p-6 inset-shadow-2xs inset-shadow-border"
      >
        <div className="flex items-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-xl bg-background p-2 inset-shadow-2xs inset-shadow-border">
            <Brain className="size-8" />
          </div>
          <Plus className="size-4 text-muted-foreground" />
          <div className="flex size-14 items-center justify-center rounded-xl bg-background p-2 inset-shadow-2xs inset-shadow-border">
            <Figma className="size-8" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-medium text-balance">
            Try the Free Figma and React kit
          </h2>
          <p className="text-balance text-muted-foreground">
            Access a curated set of shadcn components in the Figma community library, try
            tweakcn theming, and use the free Shadcraft registry. A simple way to trial
            the kit before upgrading.
          </p>
        </div>

        <div className="w-fit pt-4">
          <Button asChild>
            <Link
              href="https://polar.sh/checkout/polar_c_yhJ8HZh0Hi7rTuJUM3YbSSSGJ1U4gPWHnmaym1fOkpf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get started <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}