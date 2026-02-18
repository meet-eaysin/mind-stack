"use client";

import { useState } from "react";
import type { ChunkReference, AskQuestionResponse } from "@repo/shared-types";
import { askQuestion, semanticSearch } from "../lib/api-client";

export default function SearchPage(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"search" | "ask">("ask");
  const [answer, setAnswer] = useState<string | null>(null);
  const [chunks, setChunks] = useState<ChunkReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer(null);
    setChunks([]);

    try {
      if (mode === "ask") {
        const result: AskQuestionResponse = await askQuestion({
          question: query,
        });
        setAnswer(result.answer);
        setChunks(result.citations);
      } else {
        const result = await semanticSearch({ query });
        setChunks(result.chunks);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1>Search & Chat</h1>

      <form onSubmit={(e) => void handleSubmit(e)} style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            type="button"
            onClick={() => setMode("ask")}
            style={{
              padding: "0.5rem 1rem",
              background: mode === "ask" ? "#333" : "#eee",
              color: mode === "ask" ? "#fff" : "#333",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Ask Question
          </button>
          <button
            type="button"
            onClick={() => setMode("search")}
            style={{
              padding: "0.5rem 1rem",
              background: mode === "search" ? "#333" : "#eee",
              color: mode === "search" ? "#fff" : "#333",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === "ask"
                ? "Ask a question about your knowledge..."
                : "Search your knowledge base..."
            }
            style={{
              flex: 1,
              padding: "0.75rem",
              fontSize: "1rem",
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "..." : "Go"}
          </button>
        </div>
      </form>

      {error ? (
        <div style={{ color: "red", padding: "1rem", background: "#fee", borderRadius: 4 }}>
          {error}
        </div>
      ) : null}

      {answer ? (
        <div
          style={{
            padding: "1.5rem",
            background: "#f8f9fa",
            borderRadius: 8,
            marginBottom: "2rem",
            whiteSpace: "pre-wrap",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Answer</h2>
          <p>{answer}</p>
        </div>
      ) : null}

      {chunks.length > 0 ? (
        <div>
          <h2>{mode === "ask" ? "Citations" : "Results"}</h2>
          {chunks.map((chunk) => (
            <div
              key={chunk.chunkId}
              style={{
                padding: "1rem",
                border: "1px solid #eee",
                borderRadius: 8,
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                }}
              >
                <strong>{chunk.documentTitle}</strong>
                <span style={{ color: "#888" }}>
                  Score: {chunk.score.toFixed(3)}
                </span>
              </div>
              <p style={{ margin: "0.5rem 0", color: "#444" }}>
                {chunk.content.substring(0, 300)}
                {chunk.content.length > 300 ? "..." : ""}
              </p>
              {chunk.tags.length > 0 ? (
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {chunk.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "0.125rem 0.5rem",
                        background: "#e2e8f0",
                        borderRadius: 12,
                        fontSize: "0.75rem",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
