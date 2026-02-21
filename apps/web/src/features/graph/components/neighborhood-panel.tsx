import { Skeleton } from "@/components/ui/skeleton";
import { useNeighborhood } from "../hooks";
import { FileText, ExternalLink, Hash, Link2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { useRouter } from "next/navigation";

export function NeighborhoodPanel({
  conceptId,
  onNodeSelect,
}: {
  conceptId: string;
  onNodeSelect?: (id: string | null) => void;
}) {
  const { data, isLoading } = useNeighborhood(conceptId);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const rootNode = data.nodes.find((n) => n.id === conceptId);
  const neighbors = data.nodes.filter((n) => n.id !== conceptId);

  return (
    <div
      className="rounded-xl border bg-card/50 backdrop-blur-md shadow-lg overflow-hidden flex flex-col max-h-[600px]"
      data-testid="neighborhood-panel"
    >
      <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
            <Hash className="size-4" />
          </div>
          <h3 className="font-bold text-sm tracking-tight">
            {rootNode?.label}
          </h3>
        </div>
        <Badge variant="secondary" className="px-1.5 h-5 text-[10px]">
          {rootNode?.chunkCount} chunks
        </Badge>
      </div>

      <div className="p-4 overflow-y-auto space-y-6 scrollbar-thin">
        {/* Associated Chunks */}
        {rootNode?.associatedChunks && rootNode.associatedChunks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="size-3" />
              Source Context
            </h4>
            <div className="space-y-3">
              {rootNode.associatedChunks.map((chunk) => (
                <div
                  key={chunk.id}
                  className="p-3 bg-background/50 border rounded-lg hover:border-primary/50 transition-colors group cursor-pointer"
                  onClick={() => router.push(`/documents/${chunk.documentId}`)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[150px]">
                      {chunk.documentTitle}
                    </span>
                    <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">
                    {chunk.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Connections */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Link2 className="size-3" />
            Related Concepts
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {neighbors.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => onNodeSelect?.(node.id)}
              >
                <span className="text-sm group-hover:text-primary transition-colors">
                  {node.label}
                </span>
                <Link2 className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {data.edges.length > 0 && (
          <div className="pt-2">
            <h4 className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-wider">
              Connection Types
            </h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(data.edges.map((e) => e.relationType))).map(
                (type) => {
                  let colorClass =
                    "bg-primary/5 text-primary border-primary/20";
                  if (type === "IS_PART_OF")
                    colorClass =
                      "bg-blue-500/10 text-blue-400 border-blue-500/20";
                  if (type === "LEADS_TO")
                    colorClass =
                      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  if (type === "DEPENDS_ON")
                    colorClass =
                      "bg-amber-500/10 text-amber-400 border-amber-500/20";
                  if (type === "SIMILAR_TO")
                    colorClass =
                      "bg-purple-500/10 text-purple-400 border-purple-500/20";

                  return (
                    <Badge
                      key={type}
                      variant="outline"
                      className={`text-[9px] uppercase tracking-tighter py-0.5 px-2 font-bold ${colorClass}`}
                    >
                      {type.replace(/_/g, " ")}
                    </Badge>
                  );
                },
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-muted/10 border-t items-center justify-center flex">
        <button className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1">
          Explore relations in search
          <ExternalLink className="size-2.5" />
        </button>
      </div>
    </div>
  );
}
