"use client";

import { Network } from "lucide-react";
import type { GraphNode, GraphEdge } from "../types";

export function GraphVisualization({
  nodes,
  edges,
  onNodeSelect,
  selectedNodeId,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeSelect: (id: string | null) => void;
  selectedNodeId: string | null;
}) {
  if (nodes.length === 0) {
    return (
      <div
        className="flex h-96 items-center justify-center rounded-lg border bg-card"
        data-testid="graph-empty"
      >
        <div className="text-center">
          <Network className="mx-auto mb-2 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Knowledge graph is empty. Ingest more documents to build
            connections.
          </p>
        </div>
      </div>
    );
  }

  // Simple SVG graph visualization
  const width = 800;
  const height = 500;
  const nodePositions = nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const radius = Math.min(width, height) * 0.35;
    return {
      ...node,
      x: width / 2 + radius * Math.cos(angle),
      y: height / 2 + radius * Math.sin(angle),
    };
  });

  const nodeMap = new Map(nodePositions.map((n) => [n.id, n]));

  return (
    <div
      className="overflow-auto rounded-lg border bg-card"
      data-testid="graph-visualization"
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minHeight: 400 }}
      >
        {edges.map((edge, i) => {
          const from = nodeMap.get(edge.fromId);
          const to = nodeMap.get(edge.toId);
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className="stroke-border"
              strokeWidth={1}
            />
          );
        })}
        {nodePositions.map((node) => (
          <g
            key={node.id}
            onClick={() =>
              onNodeSelect(node.id === selectedNodeId ? null : node.id)
            }
            className="cursor-pointer"
            data-testid={`graph-node-${node.id}`}
          >
            <circle
              cx={node.x}
              cy={node.y}
              r={Math.max(8, Math.min(20, node.chunkCount * 3))}
              className={
                node.id === selectedNodeId
                  ? "fill-primary"
                  : "fill-secondary hover:fill-accent"
              }
              stroke="currentColor"
              strokeWidth={1}
            />
            <text
              x={node.x}
              y={node.y + 28}
              textAnchor="middle"
              className="fill-foreground text-[10px]"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
