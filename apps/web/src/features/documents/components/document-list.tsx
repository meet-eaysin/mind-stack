"use client";

import React from "react";
import { useDocuments } from "../hooks";
import { DocumentListSkeleton } from "@/components/skeletons";
import { ApiError as ApiErrorUI } from "@/components/api-error";
import { Inbox, Database, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";

type DocumentListProps = {
  searchTerm: string;
  onSelect: (id: string) => void;
};

export function DocumentList({
  searchTerm,
  onSelect,
}: DocumentListProps): React.JSX.Element {
  const { data, isLoading, error, refetch } = useDocuments(1, 100, searchTerm);

  if (isLoading) {
    return <DocumentListSkeleton />;
  }

  if (error) {
    return <ApiErrorUI error={error} onRetry={() => refetch()} />;
  }

  const documents = data?.documents || [];

  if (documents.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-900 border-2 border-dashed border-gray-800 rounded-2xl">
        <Inbox className="w-16 h-16 text-gray-700 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">
          {searchTerm ? "No matches found" : "No documents yet"}
        </h3>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
          {searchTerm
            ? "Try a different search term or check for typos."
            : "Start by ingesting a URL, PDF or text content to populate your brain."}
        </p>
        {!searchTerm && (
          <Link
            href="/"
            className="px-6 py-2 border border-gray-700 hover:border-blue-500 text-gray-300 hover:text-white rounded-lg transition-all"
          >
            Go to Ingestion
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {documents.map((doc) => (
        <button
          key={doc.id}
          onClick={() => onSelect(doc.id)}
          className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-blue-900 hover:bg-gray-850 transition-all text-left group"
          type="button"
        >
          <div
            className={`p-3 rounded-lg transition-colors ${
              doc.sourceType === "YOUTUBE"
                ? "bg-red-900/20 text-red-500"
                : doc.sourceType === "PDF"
                  ? "bg-orange-900/20 text-orange-500"
                  : doc.sourceType === "URL"
                    ? "bg-blue-900/20 text-blue-500"
                    : "bg-gray-800 text-gray-400"
            }`}
          >
            <Database className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate group-hover:text-blue-400 transition-colors">
              {doc.title}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {doc.chunkCount} chunks
              </span>
              <span>•</span>
              <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
        </button>
      ))}
    </div>
  );
}
