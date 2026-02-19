"use client";

import { useState, useEffect } from "react";
import type { ConceptNode, ConceptEdge } from "@repo/shared-types";
import { getGraph } from "@/lib/api-client";

export default function GraphPage(): React.JSX.Element {
  const [nodes, setNodes] = useState<ConceptNode[]>([]);
  const [edges, setEdges] = useState<ConceptEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);

  useEffect(() => {
    void loadGraph();
  }, []);

  async function loadGraph(): Promise<void> {
    setLoading(true);
    try {
      const result = await getGraph();
      setNodes(result.nodes);
      setEdges(result.edges);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  function getConnectedEdges(nodeId: string): ConceptEdge[] {
    return edges.filter(
      (e) => e.fromId === nodeId || e.toId === nodeId
    );
  }

  function getConnectedNodes(nodeId: string): ConceptNode[] {
    const connectedIds = new Set<string>();
    for (const edge of getConnectedEdges(nodeId)) {
      connectedIds.add(edge.fromId);
      connectedIds.add(edge.toId);
    }
    connectedIds.delete(nodeId);
    return nodes.filter((n) => connectedIds.has(n.id));
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1>Concept Graph</h1>

      {loading ? (
        <p>Loading graph...</p>
      ) : nodes.length === 0 ? (
        <p style={{ color: "#888" }}>
          No concepts yet. Ingest some documents to build the graph.
        </p>
      ) : (
        <div style={{ display: "flex", gap: "2rem" }}>
          <div style={{ flex: 1 }}>
            <h2>Concepts ({nodes.length})</h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {nodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    padding: "0.5rem 1rem",
                    background:
                      selectedNode?.id === node.id
                        ? "#333"
                        : "#f0f0f0",
                    color:
                      selectedNode?.id === node.id ? "#fff" : "#333",
                    border: "1px solid #ddd",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  {node.label} ({node.chunkCount})
                </button>
              ))}
            </div>
          </div>

          {selectedNode ? (
            <div style={{ flex: 1 }}>
              <h2>{selectedNode.label}</h2>
              <p style={{ color: "#888" }}>
                Appears in {selectedNode.chunkCount} chunks
              </p>

              <h3>Connected Concepts</h3>
              {getConnectedNodes(selectedNode.id).length === 0 ? (
                <p style={{ color: "#888" }}>No connections</p>
              ) : (
                <ul>
                  {getConnectedNodes(selectedNode.id).map((n) => {
                    const edge = edges.find(
                      (e) =>
                        (e.fromId === selectedNode.id &&
                          e.toId === n.id) ||
                        (e.toId === selectedNode.id &&
                          e.fromId === n.id)
                    );
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => setSelectedNode(n)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#0066cc",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {n.label}
                        </button>
                        <span style={{ color: "#888", fontSize: "0.75rem", marginLeft: "0.5rem" }}>
                          {edge?.relationType ?? ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <h3>Relations</h3>
              {getConnectedEdges(selectedNode.id).map((edge, idx) => {
                const fromNode = nodes.find((n) => n.id === edge.fromId);
                const toNode = nodes.find((n) => n.id === edge.toId);
                return (
                  <div
                    key={idx}
                    style={{
                      padding: "0.5rem",
                      background: "#f8f9fa",
                      borderRadius: 4,
                      marginBottom: "0.25rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    {fromNode?.label ?? "?"} →{" "}
                    <strong>{edge.relationType}</strong> →{" "}
                    {toNode?.label ?? "?"}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <p style={{ color: "#888" }}>
                Select a concept to see its connections
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
