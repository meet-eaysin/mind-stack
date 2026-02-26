import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative isolate">
      <div className="mx-auto max-w-4xl">
        <PageHeader className="items-center text-center">
          <Badge variant="outline">Built for software engineers</Badge>
          <PageHeaderHeading>
            Mind Stack is your personal AI-powered second brain for learning and
            execution
          </PageHeaderHeading>
          <PageHeaderDescription>
            Capture what you read, watch, and build. Search across your
            knowledge, ask AI questions with sourced answers, and keep key
            concepts fresh with daily review.
          </PageHeaderDescription>
          <PageHeaderActions className="mx-auto grid w-fit grid-cols-1 sm:grid-cols-2">
            <Button asChild>
              <Link href="/register">
                Start building your brain <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app/search">View product flow</Link>
            </Button>
          </PageHeaderActions>
        </PageHeader>
      </div>
    </section>
  )
}
