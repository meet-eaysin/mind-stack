import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const appPageVariants = cva("mx-auto w-full px-4 py-6 lg:px-6", {
  variants: {
    width: {
      default: "max-w-7xl",
      compact: "max-w-3xl",
      wide: "max-w-screen-2xl",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    width: "default",
  },
})

function AppPage({
  className,
  width,
  children,
  ...props
}: React.ComponentProps<"section"> & VariantProps<typeof appPageVariants>) {
  return (
    <section
      data-slot="app-page"
      className={cn("flex min-h-0 flex-1 flex-col gap-6", appPageVariants({ width }), className)}
      {...props}
    >
      {children}
    </section>
  )
}

function AppPageHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="app-page-header"
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}
      {...props}
    />
  )
}

function AppPageHeading({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-page-heading"
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

function AppPageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="app-page-title"
      className={cn("text-2xl font-semibold tracking-tight md:text-3xl", className)}
      {...props}
    />
  )
}

function AppPageDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="app-page-description"
      className={cn("text-sm text-muted-foreground md:text-base", className)}
      {...props}
    />
  )
}

function AppPageActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-page-actions"
      className={cn("flex shrink-0 flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

function AppPageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-page-content"
      className={cn("flex min-h-0 flex-1 flex-col gap-6", className)}
      {...props}
    />
  )
}

export {
  AppPage,
  AppPageActions,
  AppPageContent,
  AppPageDescription,
  AppPageHeader,
  AppPageHeading,
  AppPageTitle,
}
