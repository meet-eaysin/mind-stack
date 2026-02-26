import { AppPage, AppPageContent } from "@/components/layouts/app-page";
import { DocumentList } from "@/features/documents";

export default function DocumentsPage() {
  return (
    <AppPage>
      <AppPageContent>
        <DocumentList />
      </AppPageContent>
    </AppPage>
  );
}
