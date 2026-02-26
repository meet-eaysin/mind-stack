import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const appPageVariants = cva("w-full px-4 py-5 lg:px-6 lg:py-6", {
  variants: {
    width: {
      default: "max-w-none",
      compact: "max-w-3xl",
      wide: "max-w-screen-2xl",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    width: "default",
  },
});

function AppPage({
  className,
  width,
  children,
  ...props
}: React.ComponentProps<"section"> & VariantProps<typeof appPageVariants>) {
  return (
    <section
      data-slot="app-page"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-6",
        appPageVariants({ width }),
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

function AppPageHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="app-page-header"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    />
  );
}

function AppPageHeading({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-page-heading"
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  );
}

function AppPageTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="app-page-title"
      className={cn(
        "leading-tighter max-w-2xl text-3xl font-medium tracking-tight text-balance text-foreground lg:text-4xl lg:leading-[1.1]",
        className,
      )}
      {...props}
    />
  );
}

function AppPageDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="app-page-description"
      className={cn(
        "max-w-3xl text-base text-balance text-muted-foreground md:text-lg",
        className,
      )}
      {...props}
    />
  );
}

function AppPageActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-page-actions"
      className={cn("flex shrink-0 flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function AppPageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-page-content"
      className={cn("flex min-h-0 flex-1 flex-col gap-5", className)}
      {...props}
    />
  );
}

export {
  AppPage,
  AppPageActions,
  AppPageContent,
  AppPageDescription,
  AppPageHeader,
  AppPageHeading,
  AppPageTitle,
};
