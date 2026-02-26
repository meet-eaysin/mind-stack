import Link from "next/link"

import { Logo } from "@/components/logo"
import { Separator } from "@/components/ui/separator"

const productLinks = [
  { label: "Search", href: "/app/search" },
  { label: "Documents", href: "/app/documents" },
  { label: "Collections", href: "/app/collections" },
  { label: "Daily Review", href: "/app/review" },
]

const accountLinks = [
  { label: "Sign in", href: "/login" },
  { label: "Register", href: "/register" },
  { label: "Open app", href: "/app" },
]

const supportLinks = [
  { label: "Help Center", href: "mailto:support@mindstack.app", external: true },
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="w-full border-t bg-background" role="contentinfo" aria-label="Website footer">
      <div className="container mx-auto px-4 py-10 lg:px-8 lg:py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2" aria-label="Go to home page">
              <Logo className="size-7" />
              <span className="text-base font-semibold">Mind Stack</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              A focused workspace for capturing, organizing, and retaining knowledge.
            </p>
          </div>

          <nav aria-label="Footer" className="md:col-span-3 grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium">Product</h3>
              <ul className="mt-3 space-y-2">
                {productLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium">Account</h3>
              <ul className="mt-3 space-y-2">
                {accountLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium">Support</h3>
              <ul className="mt-3 space-y-2">
                {supportLinks.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Mind Stack. All rights reserved.</p>
          <p>Built for focused daily learning.</p>
        </div>
      </div>
    </footer>
  )
}
