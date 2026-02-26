"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  FileText,
  CalendarCheck,
  Network,
  Folder,
  Activity,
  TrendingUp,
  GraduationCap,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_MENU_ITEMS } from "@/lib/app-menu";
import { cn } from "@/lib/utils";

const iconByHref = {
  "/documents": FileText,
  "/collections": Folder,
  "/courses": GraduationCap,
  "/review": CalendarCheck,
  "/graph": Network,
  "/health": Activity,
  "/productivity": TrendingUp,
  "/settings": Settings,
} as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Brain className="size-5 text-primary" />
              <span className="text-lg">Mind Stack</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {APP_MENU_ITEMS.map((item) => {
                const Icon = iconByHref[item.href as keyof typeof iconByHref];
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    size="sm"
                    asChild
                    className={cn(
                      "gap-1.5",
                      pathname === item.href &&
                      "bg-accent text-accent-foreground",
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle size="icon" variant="ghost" />
          </div>
        </div>
      </header>
      <main className="container mx-auto flex-1 px-4 py-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
