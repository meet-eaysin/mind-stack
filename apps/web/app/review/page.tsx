"use client";

import { useState, useEffect } from "react";
import type { ReviewItem } from "@repo/shared-types";
import { getDailyReview, submitReviewFeedback } from "@/lib/api-client";

export default function ReviewPage(): React.JSX.Element {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");

  useEffect(() => {
    void loadReview();
  }, []);

  async function loadReview(): Promise<void> {
    setLoading(true);
    try {
      const result = await getDailyReview();
      setItems(result.items);
      setDate(result.date);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(chunkId: string, score: number): Promise<void> {
    await submitReviewFeedback({ chunkId, score });
    setItems((prev) => prev.filter((item) => item.chunkId !== chunkId));
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1>Daily Review</h1>
      {date ? <p style={{ color: "#888" }}>Date: {date}</p> : null}

      {loading ? (
        <p>Loading review items...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "#888" }}>
          No items to review today. Come back later!
        </p>
      ) : (
        <div>
          {items.map((item) => (
            <div
              key={item.chunkId}
              style={{
                padding: "1.5rem",
                border: "1px solid #eee",
                borderRadius: 8,
                marginBottom: "1rem",
              }}
            >
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>{item.documentTitle}</strong>
              </div>
              <p style={{ color: "#444" }}>{item.summary}</p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#888",
                  fontStyle: "italic",
                }}
              >
                {item.reason}
              </p>
              <div
                style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}
              >
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => void handleFeedback(item.chunkId, score)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: "#f0f0f0",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
