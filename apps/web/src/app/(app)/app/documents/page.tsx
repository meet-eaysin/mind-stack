"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DocumentList, DocumentDetail } from "@/features/documents";
import {
  AppPage,
  AppPageContent,
  AppPageDescription,
  AppPageHeader,
  AppPageHeading,
  AppPageTitle,
} from "@/components/layouts/app-page";
import { PageSkeleton } from "@/components/ui/page-skeleton";

function DocumentsPageContent() {
  const searchParams = useSearchParams();
  const docIdFromQuery = searchParams.get("id");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    docIdFromQuery,
  );

  useEffect(() => {
    setSelectedDocId(docIdFromQuery);
  }, [docIdFromQuery]);

  return (
    <AppPage>
      <AppPageHeader>
        <AppPageHeading>
          <AppPageTitle>Documents</AppPageTitle>
          <AppPageDescription>
            Browse and manage your ingested knowledge base.
          </AppPageDescription>
        </AppPageHeading>
      </AppPageHeader>
      <AppPageContent>
        {selectedDocId ? (
          <DocumentDetail
            id={selectedDocId}
            onBackAction={() => setSelectedDocId(null)}
          />
        ) : (
          <DocumentList onSelectAction={setSelectedDocId} />
        )}
      </AppPageContent>
    </AppPage>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <AppPage>
          <AppPageContent>
            <PageSkeleton rows={3} />
          </AppPageContent>
        </AppPage>
      }
    >
      <DocumentsPageContent />
    </Suspense>
  );
}
