"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useNeighborhood } from "../hooks";

export function NeighborhoodPanel({ conceptId }: { conceptId: string }) {
  const { data, isLoading } = useNeighborhood(conceptId);

  if (isLoading) {
    return (
      <Skeleton className="h-32 w-full" data-testid="neighborhood-loading" />
    );
  }

  if (!data) return null;

  return (
    <div
      className="rounded-lg border bg-card p-4"
      data-testid="neighborhood-panel"
    >
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
