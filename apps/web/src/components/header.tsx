import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-(--header-height) w-full bg-background/90 backdrop-blur">
      <div className="container mx-auto size-full">
        <div className="flex size-full items-center justify-between gap-3 px-4 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Go to home page"
          >
            <Logo className="size-7" />
            <span className="text-lg font-semibold sm:text-xl">Mind Stack</span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-5 md:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle size="icon" />
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
