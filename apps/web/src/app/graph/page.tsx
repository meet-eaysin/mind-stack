"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { RefreshCw, AlertCircle, Search, Info, Activity } from "lucide-react";
import {
  useGraph,
  useBuildGraph,
  GraphVisualization,
  NeighborhoodPanel,
} from "@/features/graph";
import { getApiErrorMessage } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

export default function GraphPage() {
  const { data, isLoading, error, refetch } = useGraph();
  const buildGraph = useBuildGraph();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!data) return null;
    if (!searchQuery) return data;

    const term = searchQuery.toLowerCase();
    const filteredNodes = data.nodes.filter((n) =>
      n.label.toLowerCase().includes(term),
    );
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = data.edges.filter(
      (e) => nodeIds.has(e.fromId) || nodeIds.has(e.toId),
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [data, searchQuery]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Knowledge Map
            </h1>
            <p className="text-muted-foreground text-sm">
              Discover connections and trace knowledge across your documents.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search concepts..."
                className="pl-9 bg-muted/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => buildGraph.mutate({ forceRebuild: false })}
              disabled={buildGraph.isPending}
              className="gap-2"
            >
              <RefreshCw
                className={`size-4 ${buildGraph.isPending ? "animate-spin" : ""}`}
              />
              Sync Graph
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton
                className="h-[500px] w-full rounded-xl"
                data-testid="graph-loading"
              />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        )}

        {error && (
          <div
            className="flex h-96 items-center justify-center rounded-xl border bg-card/50 backdrop-blur-sm"
            data-testid="graph-error"
          >
            <div className="text-center">
              <AlertCircle className="mx-auto mb-2 size-10 text-destructive/50" />
              <p className="text-sm text-destructive font-medium">
                {getApiErrorMessage(error)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-4"
              >
                Retry Connection
              </Button>
            </div>
          </div>
        )}

        {data && filteredData && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="relative rounded-xl border bg-background/50 overflow-hidden">
                <div className="absolute top-4 left-4 z-10">
                  <Badge
                    variant="secondary"
                    className="bg-background/80 backdrop-blur-md border-primary/20 text-[10px] font-bold"
                  >
                    {filteredData.nodes.length} PERSISTED CONCEPTS
                  </Badge>
                </div>
                <GraphVisualization
                  nodes={filteredData.nodes}
                  edges={filteredData.edges}
                  onNodeSelect={setSelectedNodeId}
                  selectedNodeId={selectedNodeId}
                />
              </div>
            </div>
            <div className="space-y-6">
              {selectedNodeId ? (
                <NeighborhoodPanel conceptId={selectedNodeId} />
              ) : (
                <div
                  className="rounded-xl border bg-card/50 p-6 text-center space-y-3"
                  data-testid="graph-selection-hint"
                >
                  <div className="mx-auto size-12 rounded-full bg-primary/5 flex items-center justify-center text-primary/40">
                    <Info className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground">
                      Exploration Mode
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Select a node in the graph to analyze its specific
                      connections and source documents.
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border bg-card/40 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Network Insights
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                      Total Nodes
                    </p>
                    <p className="text-2xl font-black">{data.nodes.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">
                      Total Links
                    </p>
                    <p className="text-2xl font-black">{data.edges.length}</p>
                  </div>
                  <div className="col-span-2 pt-2">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(100, (data.nodes.length / 50) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
