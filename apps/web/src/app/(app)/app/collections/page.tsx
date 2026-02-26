"use client";

import { useState } from "react";
import {
  AppPage,
  AppPageContent,
  AppPageDescription,
  AppPageHeader,
  AppPageHeading,
  AppPageTitle,
} from "@/components/layouts/app-page";
import { CollectionList } from "@/features/collections/components/collection-list";
import { CollectionDetail } from "@/features/collections/components/collection-detail";

export default function CollectionsPage() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

  return (
    <AppPage>
      <AppPageHeader>
        <AppPageHeading>
          <AppPageTitle>Collections</AppPageTitle>
          <AppPageDescription>
            Organize documents into structured learning paths and courses.
          </AppPageDescription>
        </AppPageHeading>
      </AppPageHeader>
      <AppPageContent className="max-w-6xl">
        {!selectedCollectionId ? (
          <div className="space-y-8">
            <CollectionList onSelectAction={setSelectedCollectionId} />
          </div>
        ) : (
          <CollectionDetail
            id={selectedCollectionId}
            onBackAction={() => setSelectedCollectionId(null)}
            onDocumentSelectAction={(docId) => {
              // Navigation to document detail will happen here or via separate router push
              window.location.href = `/app/documents?id=${docId}`;
            }}
          />
        )}
      </AppPageContent>
    </AppPage>
  );
}
