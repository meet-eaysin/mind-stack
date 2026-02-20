"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, RefreshCw, Maximize, AlertCircle } from "lucide-react";
import {
  useGraph,
  useBuildGraph,
  useNeighborhood,
} from "@/features/graph/hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import type { GraphNode, GraphEdge } from "@/types";

function GraphVisualization({
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
      <div className="flex h-96 items-center justify-center rounded-lg border bg-card">
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
    <div className="overflow-auto rounded-lg border bg-card">
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

function NeighborhoodPanel({ conceptId }: { conceptId: string }) {
  const { data, isLoading } = useNeighborhood(conceptId);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (!data) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold">Neighborhood</h3>
      <div className="space-y-1">
        {data.nodes.map((node) => (
          <div
            key={node.id}
            className="flex items-center justify-between text-sm"
          >
            <span>{node.label}</span>
            <span className="text-xs text-muted-foreground">
              {node.chunkCount} chunks
            </span>
          </div>
        ))}
      </div>
      {data.edges.length > 0 && (
        <div className="mt-3 space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground">
            Connections
          </h4>
          {data.edges.map((edge, i) => (
            <div key={i} className="text-xs text-muted-foreground">
              {edge.fromId} → {edge.toId} ({edge.relationType})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GraphPage() {
  const { data, isLoading, error, refetch } = useGraph();
  const buildGraph = useBuildGraph();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Knowledge Graph
            </h1>
            <p className="text-muted-foreground">
              Discover connections between concepts in your second brain.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5"
            >
              <Maximize className="size-3.5" />
              Full Map
            </Button>
            <Button
              size="sm"
              onClick={() => buildGraph.mutate({ forceRebuild: false })}
              disabled={buildGraph.isPending}
              className="gap-1.5"
            >
              <RefreshCw
                className={`size-3.5 ${buildGraph.isPending ? "animate-spin" : ""}`}
              />
              Build Graph
            </Button>
          </div>
        </div>

        {isLoading && <Skeleton className="h-96 w-full" />}

        {error && (
          <div className="flex h-96 items-center justify-center rounded-lg border bg-card">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-2 size-8 text-destructive" />
              <p className="text-sm text-destructive">
                {getApiErrorMessage(error)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {data && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <GraphVisualization
                nodes={data.nodes}
                edges={data.edges}
                onNodeSelect={setSelectedNodeId}
                selectedNodeId={selectedNodeId}
              />
            </div>
            <div className="space-y-4">
              {selectedNodeId ? (
                <NeighborhoodPanel conceptId={selectedNodeId} />
              ) : (
                <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                  Select a concept node on the map to explore its connections
                  and details.
                </div>
              )}
              <Separator />
              <div className="rounded-lg border bg-card p-4">
                <h3 className="mb-2 text-sm font-semibold">Graph Stats</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Total Nodes: {data.nodes.length}</p>
                  <p>Total Edges: {data.edges.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
