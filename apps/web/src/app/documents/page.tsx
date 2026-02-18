"use client";

import { useState, useEffect } from "react";
import type { DocumentListItem } from "@repo/shared-types";
import { listDocuments, ingestUrl, ingestText } from "../../lib/api-client";

export default function DocumentsPage(): React.JSX.Element {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIngest, setShowIngest] = useState(false);
  const [ingestType, setIngestType] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    void loadDocuments();
  }, []);

  async function loadDocuments(): Promise<void> {
    setLoading(true);
    try {
      const result = await listDocuments();
      setDocuments(result.documents);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  async function handleIngest(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setIngesting(true);
    try {
      if (ingestType === "url") {
        await ingestUrl({ url, title: title || undefined });
      } else {
        await ingestText({ title, content });
      }
      setShowIngest(false);
      setUrl("");
      setTitle("");
      setContent("");
      await loadDocuments();
    } catch {
      // silently handle
    } finally {
      setIngesting(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Documents</h1>
        <button
          onClick={() => setShowIngest(!showIngest)}
          style={{
            padding: "0.5rem 1rem",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          + Ingest
        </button>
      </div>

      {showIngest ? (
        <form
          onSubmit={(e) => void handleIngest(e)}
          style={{
            padding: "1.5rem",
            background: "#f8f9fa",
            borderRadius: 8,
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              type="button"
              onClick={() => setIngestType("url")}
              style={{
                padding: "0.25rem 0.75rem",
                background: ingestType === "url" ? "#333" : "#eee",
                color: ingestType === "url" ? "#fff" : "#333",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setIngestType("text")}
              style={{
                padding: "0.25rem 0.75rem",
                background: ingestType === "text" ? "#333" : "#eee",
                color: ingestType === "text" ? "#fff" : "#333",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Text
            </button>
          </div>

          {ingestType === "url" ? (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", boxSizing: "border-box" }}
            />
          ) : null}

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", boxSizing: "border-box" }}
          />

          {ingestType === "text" ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste content here..."
              rows={6}
              style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", boxSizing: "border-box" }}
            />
          ) : null}

          <button
            type="submit"
            disabled={ingesting}
            style={{
              padding: "0.5rem 1.5rem",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: ingesting ? "wait" : "pointer",
            }}
          >
            {ingesting ? "Ingesting..." : "Ingest"}
          </button>
        </form>
      ) : null}

      {loading ? (
        <p>Loading...</p>
      ) : documents.length === 0 ? (
        <p style={{ color: "#888" }}>No documents yet. Ingest something!</p>
      ) : (
        <div>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                padding: "1rem",
                border: "1px solid #eee",
                borderRadius: 8,
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{doc.title}</strong>
                <span
                  style={{
                    padding: "0.125rem 0.5rem",
                    background: "#e2e8f0",
                    borderRadius: 12,
                    fontSize: "0.75rem",
                  }}
                >
                  {doc.sourceType}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "0.5rem",
                  color: "#888",
                  fontSize: "0.875rem",
                }}
              >
                <span>{doc.chunkCount} chunks</span>
                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
