"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Maximize, AlertCircle } from "lucide-react";
import {
  useGraph,
  useBuildGraph,
  GraphVisualization,
  NeighborhoodPanel,
} from "@/features/graph";
import { getApiErrorMessage } from "@/lib/api-client";

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

        {isLoading && (
          <Skeleton className="h-96 w-full" data-testid="graph-loading" />
        )}

        {error && (
          <div
            className="flex h-96 items-center justify-center rounded-lg border bg-card"
            data-testid="graph-error"
          >
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
                <div
                  className="rounded-lg border bg-card p-4 text-sm text-muted-foreground"
                  data-testid="graph-selection-hint"
                >
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
