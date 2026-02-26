"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DocumentList, DocumentDetail } from "@/features/documents";

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
            onBackAction={() => setSelectedDocId(null)}
          />
        ) : (
          <DocumentList onSelectAction={setSelectedDocId} />
        )}
      </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
                  <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
              <p className="text-muted-foreground">
                Browse and manage your ingested knowledge base.
              </p>
            </div>
          </div>
      }
    >
      <DocumentsPageContent />
    </Suspense>
  );
}
