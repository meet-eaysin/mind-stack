import Link from "next/link"
import { ArrowRightIcon, Sparkles } from "lucide-react"

import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function CallToActionSection() {
  return (
    <section id="cta" className="relative isolate scroll-mt-20">
      <div className="mx-auto max-w-5xl rounded-2xl border bg-secondary p-6 md:p-10">
        <PageHeader className="pb-0">
          <Badge variant="outline" className="w-fit">
            <Sparkles className="mr-1 size-3.5" />
            Personal AI learning workspace
          </Badge>
          <PageHeaderHeading>
            Turn scattered technical content into a reliable second brain
          </PageHeaderHeading>
          <PageHeaderDescription>
            Search your documents, ask grounded AI questions with source context,
            and keep your learning active every day.
          </PageHeaderDescription>
          <PageHeaderActions className="w-fit">
            <Button asChild>
              <Link href="/register">
                Create your workspace <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </PageHeaderActions>
        </PageHeader>
      </div>
    </section>
  )
}
