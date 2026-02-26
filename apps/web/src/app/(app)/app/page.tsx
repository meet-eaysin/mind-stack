import {
  AppPage,
  AppPageContent,
  AppPageDescription,
  AppPageHeader,
  AppPageHeading,
  AppPageTitle,
} from "@/components/layouts/app-page"

export default function Page() {
  return (
    <AppPage>
      <AppPageHeader>
        <AppPageHeading>
          <AppPageTitle>Dashboard</AppPageTitle>
          <AppPageDescription>
            Overview of your knowledge workflows and study progress.
          </AppPageDescription>
        </AppPageHeading>
      </AppPageHeader>
      <AppPageContent />
    </AppPage>
  )
}
