import Link from "next/link"
import {
  IconBell,
  IconChevronDown,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  ProfileCard,
  ProfileCardAvatar,
  ProfileCardDetails,
} from "@/components/ui/profile-card"

const user = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

export function ApplicationHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-(--header-height) w-full shrink-0 items-center border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        <Link
          href="/app"
          className="flex shrink-0 items-center gap-2"
          aria-label="Go to application home"
        >
          <IconInnerShadowTop className="size-5" />
          <span className="text-sm font-semibold sm:text-base">Application</span>
        </Link>

        <form role="search" className="w-full max-w-md">
          <label htmlFor="application-search" className="sr-only">
            Search
          </label>
          <div className="relative">
            <IconSearch className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="application-search"
              type="search"
              placeholder="Search documents, notes, and actions..."
              className="h-9 pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle size="icon" />
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <IconBell className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Settings">
            <IconSettings className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-2">
                <ProfileCard>
                  <ProfileCardAvatar size="sm" src={user.avatar} name={user.name} />
                  <ProfileCardDetails
                    className="hidden text-left sm:flex"
                    name={user.name}
                    body={user.email}
                  />
                </ProfileCard>
                <IconChevronDown className="ml-1 size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Notifications</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
