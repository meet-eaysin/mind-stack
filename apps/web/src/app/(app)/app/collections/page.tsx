"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      <AppPageContent className="gap-5">
        {!selectedCollectionId ? (
          <CollectionList onSelectAction={setSelectedCollectionId} />
        ) : (
          <CollectionDetail
            id={selectedCollectionId}
            onBackAction={() => setSelectedCollectionId(null)}
            onDocumentSelectAction={(docId) => {
              router.push(`/app/documents/${docId}`);
            }}
          />
        )}
      </AppPageContent>
    </AppPage>
  );
}
