"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Search as SearchIcon, Filter, MessageSquare } from "lucide-react";
import {
  useSearch,
  useFilteredSearch,
  useAskQuestion,
} from "@/features/search/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { DocumentResult } from "@/features/search/components/document-result";
import { ChunkResult } from "@/features/search/components/chunk-result";
import type { ChunkReference, DocumentSearchResult } from "@/types";
import {
  AppPage,
  AppPageContent,
  AppPageDescription,
  AppPageHeader,
  AppPageHeading,
  AppPageTitle,
} from "@/components/layouts/app-page";

type SearchMode = "semantic" | "ask";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("semantic");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [tags, setTags] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");

  const search = useSearch();
  const filteredSearch = useFilteredSearch();
  const askQuestion = useAskQuestion();

  const hasAdvancedFilters = useMemo(() => {
    return Boolean(
      tags.trim() ||
      fromDate.trim() ||
      toDate.trim() ||
      status.trim() ||
      keyword.trim(),
    );
  }, [fromDate, keyword, status, tags, toDate]);

  const isLoading =
    search.isPending || filteredSearch.isPending || askQuestion.isPending;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setHasSubmitted(true);

    if (mode === "ask") {
      askQuestion.mutate({ question: trimmedQuery });
      return;
    }

    if (hasAdvancedFilters) {
      filteredSearch.mutate({
        query: trimmedQuery,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        status: status || undefined,
        keyword: keyword || undefined,
      });
      return;
    }

    search.mutate({ query: trimmedQuery });
  };

  const semanticResults =
    search.data?.documents ?? filteredSearch.data?.documents;
  const hasSemanticResults = (semanticResults?.length ?? 0) > 0;
  const hasAskResult = Boolean(askQuestion.data);

  return (
    <AppPage>
      <AppPageHeader>
        <AppPageHeading>
          <AppPageTitle>Search</AppPageTitle>
          <AppPageDescription>
            Find documents quickly or ask questions grounded in your knowledge
            base.
          </AppPageDescription>
        </AppPageHeading>
      </AppPageHeader>
      <AppPageContent className="gap-5">
        <div className="rounded-lg border bg-card p-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={mode === "semantic" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("semantic")}
              className="gap-1.5"
            >
              <SearchIcon className="size-3.5" />
              Search
            </Button>
            <Button
              variant={mode === "ask" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("ask")}
              className="gap-1.5"
            >
              <MessageSquare className="size-3.5" />
              Ask AI
            </Button>
            {mode === "semantic" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters((value) => !value)}
                className="gap-1.5 text-muted-foreground"
                data-testid="toggle-advanced-filters"
              >
                <Filter className="size-3.5" />
                {showAdvancedFilters ? "Hide filters" : "Advanced filters"}
              </Button>
            )}
          </div>
        </div>

        {mode === "semantic" && showAdvancedFilters && (
          <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tags (comma separated)
              </label>
              <Input
                placeholder="backend, rfc, typescript"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                className="h-9 bg-background"
                data-testid="filter-tags-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <Input
                placeholder="REVIEW, COMPLETED..."
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-9 bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                From Date
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-9 bg-background"
                data-testid="filter-from-date"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                To Date
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-9 bg-background"
                data-testid="filter-to-date"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Keyword contains
              </label>
              <Input
                placeholder="must include this text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="h-9 bg-background"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTags("");
                  setFromDate("");
                  setToDate("");
                  setStatus("");
                  setKeyword("");
                }}
                type="button"
              >
                Clear filters
              </Button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex gap-2 rounded-lg border bg-card p-3"
        >
          <Input
            placeholder={
              mode === "ask"
                ? "Ask a question about your documents..."
                : "Search documents..."
            }
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="flex-1"
            data-testid="search-input"
          />
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="search-submit"
          >
            {isLoading ? "..." : mode === "ask" ? "Ask" : "Search"}
          </Button>
        </form>

        <Separator />

        {isLoading && <PageSkeleton rows={3} data-testid="search-loading" />}

        {mode === "semantic" && hasSemanticResults && (
          <div className="space-y-3" data-testid="search-results">
            {semanticResults?.map((document: DocumentSearchResult) => (
              <DocumentResult key={document.documentId} document={document} />
            ))}
          </div>
        )}

        {mode === "ask" && hasAskResult && (
          <div className="space-y-4" data-testid="ask-result">
            {askQuestion.data?.weakContext && (
              <div
                className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400"
                data-testid="weak-context-warning"
              >
                Limited context found. The answer may be incomplete.
              </div>
            )}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold">AI Answer</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {askQuestion.data?.answer}
              </p>
            </div>
            {(askQuestion.data?.citations.length ?? 0) > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Citations
                </h4>
                {askQuestion.data?.citations.map((citation: ChunkReference) => (
                  <ChunkResult key={citation.chunkId} chunk={citation} />
                ))}
              </div>
            )}
          </div>
        )}

        {mode === "semantic" &&
          hasSubmitted &&
          !isLoading &&
          !hasSemanticResults && (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              No matching documents found. Try broader terms or remove filters.
            </div>
          )}

        {mode === "ask" && hasSubmitted && !isLoading && !hasAskResult && (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            No answer returned. Try rephrasing the question.
          </div>
        )}

        {(search.error || filteredSearch.error || askQuestion.error) && (
          <div
            className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
            data-testid="search-error"
          >
            {getApiErrorMessage(
              search.error || filteredSearch.error || askQuestion.error,
            )}
          </div>
        )}
      </AppPageContent>
    </AppPage>
  );
}
