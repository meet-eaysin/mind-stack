"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Database,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileDown,
} from "lucide-react";
import { useDocument } from "../hooks";
import { ChunkItem } from "./chunk-item";
import { Skeleton, ChunkSkeleton } from "@/components/skeletons";
import { ApiError as ApiErrorUI } from "@/components/api-error";
import { ExportModal } from "@/components/export-modal";

type DocumentViewProps = {
  documentId: string;
  onBack: () => void;
};

export function DocumentView({
  documentId,
  onBack,
}: DocumentViewProps): React.JSX.Element {
  const { data, isLoading, error, refetch } = useDocument(documentId);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // We should create a mutation for updating chunks if that's a feature.
  // The original component had handleUpdateChunk but no mutation.
  // For now we'll just implement the view.
  // If update is needed, we should add useUpdateChunk hook.

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-800 rounded-lg animate-pulse" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        <div className="space-y-6">
          <ChunkSkeleton />
          <ChunkSkeleton />
          <ChunkSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return <ApiErrorUI error={error} onRetry={() => refetch()} />;
  }

  if (!data?.document) return <div>Document not found</div>;

  const { document } = data;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-8 text-gray-400 hover:text-white transition-colors group"
        type="button"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Documents
      </button>

      <header className="mb-12 border-b border-gray-800 pb-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white leading-tight">
              {document.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-800 rounded border border-gray-700">
                <Database className="w-3.5 h-3.5" />
                {document.sourceType}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(document.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <Layers className="w-3.5 h-3.5" />
                {document.chunks.length} chunks
              </span>
              <span
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold ${
                  document.status === "READY"
                    ? "bg-green-900/40 text-green-400 border border-green-900/50"
                    : document.status === "FAILED"
                      ? "bg-red-900/40 text-red-400 border border-red-900/50"
                      : "bg-blue-900/40 text-blue-400 border border-blue-900/50"
                }`}
              >
                {document.status === "READY" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : document.status === "FAILED" ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {document.status}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95"
            type="button"
          >
            <FileDown className="w-4 h-4" />
            Export Document
          </button>
        </div>

        {document.sourceUrl && (
          <a
            href={document.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4"
          >
            {document.sourceUrl}
          </a>
        )}
      </header>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          Knowledge Chunks
          <span className="h-px flex-1 bg-gray-800 ml-4" />
        </h3>

        {document.chunks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-2xl bg-gray-850/50">
            <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              No chunks generated for this document yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {document.chunks.map((chunk) => (
              <ChunkItem
                key={chunk.id}
                chunk={chunk}
                onUpdate={(c) => {
                  // TODO: implement update
                  console.log("Update chunk", c);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {document && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          chunkIds={document.chunks.map((c) => c.id)}
        />
      )}
    </div>
  );
}
