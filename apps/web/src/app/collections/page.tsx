"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CollectionList } from "@/features/collections/components/collection-list";
import { CollectionDetail } from "@/features/collections/components/collection-detail";

export default function CollectionsPage() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

  return (
    <AppShell>
      <div className="container py-8 max-w-6xl mx-auto">
        {!selectedCollectionId ? (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-bold tracking-tight">Collections</h1>
              <p className="text-muted-foreground text-lg">
                Organize your documents into structured learning paths and
                courses.
              </p>
            </div>
            <CollectionList onSelectAction={setSelectedCollectionId} />
          </div>
        ) : (
          <CollectionDetail
            id={selectedCollectionId}
            onBackAction={() => setSelectedCollectionId(null)}
            onDocumentSelectAction={(docId) => {
              // Navigation to document detail will happen here or via separate router push
              window.location.href = `/documents?id=${docId}`;
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
