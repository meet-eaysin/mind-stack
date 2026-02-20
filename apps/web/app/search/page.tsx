"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Sparkles, Filter, Loader2 } from "lucide-react";
import {
  useSearch,
  useFilteredSearch,
  useAskQuestion,
  useRetrieve,
} from "@/features/search/hooks";
import { searchApi } from "@/features/search/api";
import { documentsApi } from "@/features/documents/api";
import { SearchFilters } from "@/features/search/components/search-filters";
import { SearchResultsList } from "@/features/search/components/search-results-list";
import { AiAnswer } from "@/features/search/components/ai-answer";
import { ExportModal } from "@/components/export-modal";
import type { ChunkReference } from "@/types/api";

export default function SearchPage(): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<
    "search" | "retrieve" | "ask" | "ask-stream"
  >("search");

  // State for results
  const [results, setResults] = useState<ChunkReference[]>([]);
  const [citations, setCitations] = useState<ChunkReference[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // UI State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);

  const chunkRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Mutations
  const searchMutation = useSearch();
  const filteredSearchMutation = useFilteredSearch();
  const askMutation = useAskQuestion();
  const retrieveMutation = useRetrieve();

  const loading =
    searchMutation.isPending ||
    filteredSearchMutation.isPending ||
    askMutation.isPending ||
    retrieveMutation.isPending ||
    isStreaming;

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      // Fetch tags from documents (legacy way, ideally should have a tags endpoint)
      const res = await documentsApi.list(1, 100);
      const tags = new Set<string>();

      const detailsPromises = res.documents
        .slice(0, 5)
        .map((doc) => documentsApi.get(doc.id));
      const details = await Promise.all(detailsPromises);

      details.forEach((d) => {
        d.document.chunks.forEach((c) => c.tags.forEach((t) => tags.add(t)));
      });

      setAllTags(Array.from(tags));
    } catch (err) {
      console.error("Failed to load tags", err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setAnswer(null);
    setCitations([]);
    setResults([]);
    setHasSearched(true);

    try {
      if (mode === "search") {
        let res;
        if (selectedTags.length > 0 || fromDate || toDate) {
          const payload: import("@/types/api").FilteredSearchRequest = {
            query: searchTerm,
            topK: 10,
          };

          if (selectedTags.length > 0) payload.tags = selectedTags;
          if (fromDate) payload.fromDate = fromDate;
          if (toDate) payload.toDate = toDate;

          res = await filteredSearchMutation.mutateAsync(payload);
        } else {
          res = await searchMutation.mutateAsync({
            query: searchTerm,
            topK: 10,
          });
        }
        setResults(res.chunks);
      } else if (mode === "retrieve") {
        const res = await retrieveMutation.mutateAsync({
          query: searchTerm,
          topK: 10,
        });
        setResults(res.chunks);
      } else if (mode === "ask") {
        const res = await askMutation.mutateAsync({
          question: searchTerm,
          topK: 5,
          ...(selectedTags.length > 0 ? { tags: selectedTags } : {}),
        });
        setAnswer(res.answer);
        setCitations(res.citations);
        setResults(res.citations);
      } else if (mode === "ask-stream") {
        setIsStreaming(true);
        setAnswer("");
        const source = searchApi.askStream(searchTerm, selectedTags, 5);
        source.onmessage = (evt) => {
          try {
            const chunk = JSON.parse(evt.data);
            if (chunk.type === "text") {
              setAnswer((prev) => (prev ?? "") + chunk.data);
            } else if (chunk.type === "citations") {
              setCitations(chunk.data);
              setResults(chunk.data);
            } else if (chunk.type === "done") {
              source.close();
              setIsStreaming(false);
            }
          } catch (e) {
            console.error("Stream parse error", e);
          }
        };
        source.onerror = () => {
          source.close();
          setIsStreaming(false);
        };
      }
    } catch (_err) {
      // Error is handled by mutation state
    }
  };

  const currentError =
    searchMutation.error ||
    filteredSearchMutation.error ||
    askMutation.error ||
    retrieveMutation.error;

  const scrollToChunk = (chunkId: string) => {
    const el = chunkRefs.current[chunkId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-blue-500", "bg-gray-850");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-blue-500", "bg-gray-850");
      }, 2000);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto py-6 px-4 space-y-6">
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
          <button
            onClick={() => setMode("search")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${mode === "search" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}
            type="button"
          >
            Semantic Search
          </button>
          <button
            onClick={() => setMode("retrieve")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${mode === "retrieve" ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300"}`}
            type="button"
          >
            Direct Retrieve
          </button>
          <button
            onClick={() => setMode("ask")}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${mode === "ask" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
            type="button"
          >
            <Sparkles className="w-4 h-4" />
            Ask AI
          </button>
          <button
            onClick={() => setMode("ask-stream")}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${mode === "ask-stream" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
            type="button"
          >
            <Sparkles className="w-4 h-4" />
            Ask AI (Stream)
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative group max-w-4xl mx-auto w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                mode === "search"
                  ? "Search your knowledge base..."
                  : "Ask a question about your documents..."
              }
              className="w-full pl-12 pr-4 py-4 bg-gray-900 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none hover:border-gray-700 transition-all text-lg text-white shadow-xl"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-xl transition-all font-bold"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Run"}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                showFilters || selectedTags.length > 0 || fromDate || toDate
                  ? "bg-blue-900/20 border-blue-800 text-blue-400"
                  : "border-gray-800 text-gray-400 hover:border-gray-700"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters {selectedTags.length > 0 && `(${selectedTags.length})`}
            </button>

            <SearchFilters
              showFilters={showFilters}
              allTags={allTags}
              selectedTags={selectedTags}
              fromDate={fromDate}
              toDate={toDate}
              onToggleTag={toggleTag}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
            />
          </div>
        </form>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Left Panel: Search Results / Citations */}
        <SearchResultsList
          results={results}
          loading={loading && mode !== "ask-stream"} // Show results early during streaming if available
          error={currentError}
          mode={mode.includes("ask") ? "ask" : "search"}
          onScrollTo={scrollToChunk}
          onRetry={() =>
            handleSearch({ preventDefault: () => {} } as React.FormEvent)
          }
          registerRef={(id, el) => {
            chunkRefs.current[id] = el;
          }}
          hasSearched={hasSearched}
        />

        {/* Right Panel: AI Answer */}
        <AiAnswer
          answer={answer}
          loading={loading}
          error={askMutation.error} // Strict error from mutation
          citations={citations}
          mode={mode.includes("ask") ? "ask" : "search"}
          onScrollTo={scrollToChunk}
          onExport={() => setIsExportOpen(true)}
        />
      </div>

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        chunkIds={
          citations.length > 0
            ? citations.map((c) => c.chunkId)
            : results.map((r) => r.chunkId)
        }
      />
    </div>
  );
}
