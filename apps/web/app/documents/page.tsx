"use client";

import React, { useState } from "react";
import { Plus, Search, Database } from "lucide-react";
import Link from "next/link";
import { DocumentList } from "@/features/documents/components/document-list";
import { DocumentView } from "@/features/documents/components/document-view";

export default function DocumentsPage(): React.JSX.Element {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  if (selectedDocId) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <DocumentView
          documentId={selectedDocId}
          onBack={() => {
            setSelectedDocId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-gray-800">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Your Knowledge
          </h1>
          <p className="text-gray-400">
            Manage and explore your digested documents.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-900/20 group"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          Ingest New
        </Link>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search documents by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-700 transition-all text-white"
            />
          </div>

          <DocumentList searchTerm={searchTerm} onSelect={setSelectedDocId} />
        </div>

        <aside className="w-full md:w-80 space-y-6">
          <div className="p-6 bg-blue-900/10 border border-blue-900/30 rounded-2xl">
            <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Stats
            </h4>
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Total Documents</span>
                <span className="text-white font-mono">
                  {/* We could query separate stats or get from list response if exposing it from hook */}
                  --
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
