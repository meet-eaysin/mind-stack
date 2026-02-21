"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search as SearchIcon,
  Filter,
  MessageSquare,
  Zap,
  FileText,
} from "lucide-react";
import {
  useSearch,
  useFilteredSearch,
  useAskQuestion,
  useRetrieve,
} from "@/features/search/hooks";
import { searchApi } from "@/features/search/api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { ChunkReference } from "@/types";
import { StreamingAskResponseChunkSchema } from "@/features/search/schemas/search.schemas";

type SearchMode = "semantic" | "filtered" | "ask" | "retrieve" | "stream";

import { ChunkResult } from "@/features/search";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("semantic");
  const [streamAnswer, setStreamAnswer] = useState("");
  const [streamCitations, setStreamCitations] = useState<ChunkReference[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    {
      question: string;
      answer: string;
      citations: ChunkReference[];
    }[]
  >([]);

  const search = useSearch();
  const filteredSearch = useFilteredSearch();
  const askQuestion = useAskQuestion();
  const retrieve = useRetrieve();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (mode === "semantic") {
      search.mutate({ query });
    } else if (mode === "filtered") {
      filteredSearch.mutate({ query });
    } else if (mode === "ask") {
      askQuestion.mutate({ question: query });
    } else if (mode === "retrieve") {
      retrieve.mutate({ query });
    } else if (mode === "stream") {
      setStreamAnswer("");
      setStreamCitations([]);
      setIsStreaming(true);
      let finalAnswer = "";
      let finalCitations: ChunkReference[] = [];
      const currentQuery = query;

      const eventSource = searchApi.askStream(query);
      eventSource.onmessage = (event) => {
        try {
          const raw =
            typeof event.data === "string" ? event.data : String(event.data);
          const parsed: unknown = JSON.parse(raw);
          const chunk = StreamingAskResponseChunkSchema.safeParse(parsed);
          if (chunk.success) {
            const data = chunk.data;
            if (data.type === "text") {
              finalAnswer += data.data;
              setStreamAnswer(finalAnswer);
            } else if (data.type === "citations") {
              finalCitations = data.data;
              setStreamCitations(finalCitations);
            } else if (data.type === "done") {
              setIsStreaming(false);
              setChatHistory((prev) => [
                ...prev,
                {
                  question: currentQuery,
                  answer: finalAnswer,
                  citations: finalCitations,
                },
              ]);
              setQuery("");
              eventSource.close();
            }
          }
        } catch {
          // Ignore parse errors
        }
      };
      eventSource.onerror = () => {
        setIsStreaming(false);
        eventSource.close();
      };
    }
  };

  const isLoading =
    search.isPending ||
    filteredSearch.isPending ||
    askQuestion.isPending ||
    retrieve.isPending ||
    isStreaming;

  const modes: { value: SearchMode; label: string; icon: React.ElementType }[] =
    [
      { value: "semantic", label: "Search", icon: SearchIcon },
      { value: "filtered", label: "Filtered", icon: Filter },
      { value: "ask", label: "Ask AI", icon: MessageSquare },
      { value: "stream", label: "Stream", icon: Zap },
      { value: "retrieve", label: "Retrieve", icon: FileText },
    ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Search</h1>
          <p className="text-muted-foreground">
            Query your knowledge base with semantic search or ask AI questions.
          </p>
        </div>

        {/* Mode selector */}
        <div className="flex flex-wrap gap-1">
          {modes.map((m) => (
            <Button
              key={m.value}
              variant={mode === m.value ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m.value)}
              className="gap-1.5"
            >
              <m.icon className="size-3.5" />
              {m.label}
            </Button>
          ))}
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder={
              mode === "ask" || mode === "stream"
                ? "Ask a question..."
                : "Search your knowledge..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
            data-testid="search-input"
          />
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="search-submit"
          >
            {isLoading ? "..." : "Go"}
          </Button>
        </form>

        <Separator />

        {/* Results */}
        {isLoading && !isStreaming && (
          <div className="space-y-3" data-testid="search-loading">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {/* Semantic / Filtered / Retrieve results */}
        {(search.data || filteredSearch.data || retrieve.data) && (
          <div className="space-y-3" data-testid="search-results">
            {(
              search.data?.chunks ||
              filteredSearch.data?.chunks ||
              retrieve.data?.chunks ||
              []
            ).map((chunk: ChunkReference) => (
              <ChunkResult key={chunk.chunkId} chunk={chunk} />
            ))}
          </div>
        )}

        {/* Ask AI result */}
        {askQuestion.data && (
          <div className="space-y-4" data-testid="ask-result">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold">AI Answer</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {askQuestion.data.answer}
              </p>
            </div>
            {askQuestion.data.citations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Citations
                </h4>
                {askQuestion.data.citations.map((c: ChunkReference) => (
                  <ChunkResult key={c.chunkId} chunk={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat History for Stream Mode */}
        {mode === "stream" && chatHistory.length > 0 && (
          <div className="space-y-6 mb-6">
            {chatHistory.map((chat, idx) => (
              <div
                key={idx}
                className="space-y-4"
                data-testid={`history-item-${idx}`}
              >
                <div className="flex justify-end">
                  <div className="rounded-lg bg-primary text-primary-foreground px-4 py-2 max-w-[80%] text-sm">
                    {chat.question}
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="mb-2 text-sm font-semibold">AI Answer</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {chat.answer}
                  </p>
                </div>
                {chat.citations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Citations
                    </h4>
                    {chat.citations.map((c) => (
                      <ChunkResult key={c.chunkId} chunk={c} />
                    ))}
                  </div>
                )}
                <Separator />
              </div>
            ))}
          </div>
        )}

        {/* Current Streaming result */}
        {(streamAnswer || isStreaming) && mode === "stream" && (
          <div className="space-y-4" data-testid="stream-result">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold">
                AI Answer{" "}
                {isStreaming && (
                  <span className="animate-pulse text-primary">●</span>
                )}
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {streamAnswer || "Thinking..."}
              </p>
            </div>
            {streamCitations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Citations
                </h4>
                {streamCitations.map((c) => (
                  <ChunkResult key={c.chunkId} chunk={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error display */}
        {(search.error ||
          filteredSearch.error ||
          askQuestion.error ||
          retrieve.error) && (
          <div
            className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
            data-testid="search-error"
          >
            {(() => {
              const err =
                search.error ||
                filteredSearch.error ||
                askQuestion.error ||
                retrieve.error;
              return getApiErrorMessage(err);
            })()}
          </div>
        )}
      </div>
    </AppShell>
  );
}
