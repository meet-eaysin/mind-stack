"use client"

import { useEffect } from "react"

import { AlertCircle } from "lucide-react"

import {
  AppPage,
  AppPageContent,
  AppPageDescription,
  AppPageHeader,
  AppPageHeading,
  AppPageTitle,
} from "@/components/layouts/app-page"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <AppPage width="compact">
      <AppPageHeader>
        <AppPageHeading>
          <AppPageTitle>Something went wrong</AppPageTitle>
          <AppPageDescription>
            We could not load this section right now. Please try again.
          </AppPageDescription>
        </AppPageHeading>
      </AppPageHeader>
      <AppPageContent className="items-start">
        <div className="w-full rounded-lg border bg-card p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 text-destructive" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Unexpected error</p>
              <p className="text-sm text-muted-foreground">
                If this keeps happening, contact support with your latest action.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <Button onClick={reset}>Try again</Button>
          </div>
        </div>
      </AppPageContent>
    </AppPage>
  )
}
