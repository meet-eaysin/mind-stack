"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DocumentList, DocumentDetail } from "@/features/documents";

export default function DocumentsPage() {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Browse and manage your ingested knowledge base.
          </p>
        </div>

        {selectedDocId ? (
          <DocumentDetail
            id={selectedDocId}
            onBack={() => setSelectedDocId(null)}
          />
        ) : (
          <DocumentList onSelect={setSelectedDocId} />
        )}
      </div>
    </AppShell>
  );
}
