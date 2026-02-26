"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
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
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/application",
      icon: IconDashboard,
    },
    {
      title: "Search",
      url: "/search",
      icon: IconListDetails,
    },
    {
      title: "Review",
      url: "/review",
      icon: IconChartBar,
    },
    {
      title: "Documents",
      url: "/documents",
      icon: IconFolder,
    },
    {
      title: "Team",
      url: "/courses",
      icon: IconUsers,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "/documents",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "/review",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "/search",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const navMain = React.useMemo(
    () =>
      data.navMain.map((item) => ({
        ...item,
        isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
      })),
    [pathname]
  )

  const navSecondary = React.useMemo(
    () =>
      data.navSecondary.map((item) => ({
        ...item,
        isActive: pathname === item.url || pathname.startsWith(`${item.url}/`),
      })),
    [pathname]
  )

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
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
