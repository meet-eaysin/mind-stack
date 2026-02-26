"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  IconActivity,
  IconCalendarCheck,
  IconFolder,
  IconFolders,
  IconGitBranch,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSchool,
  IconTrendingUp,
} from "@tabler/icons-react";
import { IngestionModal } from "@/features/ingestion/components/ingestion-modal";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { APP_MENU_ITEMS } from "@/lib/app-menu";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: APP_MENU_ITEMS,
};

const navIconByHref = {
  "/app/search": IconSearch,
  "/app/documents": IconFolder,
  "/app/collections": IconFolders,
  "/app/courses": IconSchool,
  "/app/review": IconCalendarCheck,
  "/app/graph": IconGitBranch,
  "/app/health": IconActivity,
  "/app/productivity": IconTrendingUp,
  "/app/settings": IconSettings,
} as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const [isIngestionOpen, setIsIngestionOpen] = React.useState(false);

  const navMain = React.useMemo(
    () =>
      data.navMain.map((item) => ({
        title: item.label,
        url: item.href,
        icon: navIconByHref[item.href as keyof typeof navIconByHref],
        isActive:
          pathname === item.href || pathname.startsWith(`${item.href}/`),
      })),
    [pathname],
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <SidebarMenu className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Mind Stack"
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <span className="text-base font-semibold">Menu</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarTrigger
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
            className="ml-auto size-8 group-data-[collapsible=icon]:ml-0"
          />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Add Document"
              size="lg"
              variant="outline"
              onClick={() => setIsIngestionOpen(true)}
              className="h-9 justify-center gap-2 rounded-lg border-sidebar-border/70 bg-sidebar-accent/70 px-3 font-medium text-sidebar-foreground shadow-sm hover:bg-sidebar-accent group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:[&>span:last-child]:hidden"
            >
              <span className="flex size-4 items-center justify-center rounded-sm group-data-[collapsible=icon]:bg-transparent">
                <IconPlus className="size-3.5" />
              </span>
              <span>Add Document</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <IngestionModal
        open={isIngestionOpen}
        onOpenChangeAction={setIsIngestionOpen}
      />
      <SidebarRail />
    </Sidebar>
  );
}
