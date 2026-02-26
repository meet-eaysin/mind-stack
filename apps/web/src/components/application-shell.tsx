import type { CSSProperties, ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { ApplicationHeader } from "@/components/application-header";
import { SidebarProvider } from "@/components/ui/sidebar";

export function ApplicationShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      className="flex min-h-svh flex-col"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <ApplicationHeader />
      <div className="flex min-h-0 flex-1">
        <AppSidebar className="!top-(--header-height) !h-[calc(100svh-var(--header-height))]" />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
