import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function ApplicationHeader() {
  return (
    <header className="flex h-(--header-height) w-full shrink-0 items-center border-b bg-background">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger aria-label="Toggle navigation" className="-ml-1" />
        <span className="text-sm font-medium">Navigation</span>
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Application</h1>
      </div>
    </header>
  )
}
