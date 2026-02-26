import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function CallToActionSection() {
  return (
    <section id="cta" className="relative isolate scroll-mt-20">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border bg-card/70 p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className="w-fit">
                Mind Stack
              </Badge>
              <h2 className="text-2xl font-medium tracking-tight text-foreground lg:text-3xl">
                Build a second brain you can actually use every day
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Capture technical content, retrieve it by intent, and get AI
                answers with source-backed context.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button asChild>
                <Link href="/register">
                  Get started <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
