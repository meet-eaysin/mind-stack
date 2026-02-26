import { AppPage, AppPageContent } from "@/components/layouts/app-page"
import { PageSkeleton } from "@/components/ui/page-skeleton"

export default function Loading() {
  return (
    <AppPage>
      <AppPageContent>
        <PageSkeleton rows={4} />
      </AppPageContent>
    </AppPage>
  )
}
