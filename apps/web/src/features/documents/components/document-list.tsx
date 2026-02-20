"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IngestionModal } from "@/features/ingestion/components/ingestion-modal";
import { useRetryIngestion } from "@/features/ingestion/hooks";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Type,
  File,
  Youtube,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments } from "../hooks";
import { getApiErrorMessage } from "@/lib/api-client";

const sourceTypeIcons: Record<string, React.ElementType> = {
  URL: Globe,
  TEXT: Type,
  PDF: File,
  YOUTUBE: Youtube,
};

export function DocumentList({ onSelect }: { onSelect: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageSize = 10;
  const queryClient = useQueryClient();
  const retryIngestion = useRetryIngestion();

  const { data, isLoading, error } = useDocuments(
    page,
    pageSize,
    searchTerm || undefined,
  );

  const handleIngestionSuccess = () => {
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["knowledge"] });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          data-testid="document-search-input"
          className="flex-1"
        />
        <Button
          onClick={() => setIsModalOpen(true)}
          className="shrink-0 gap-1"
          data-testid="add-document-btn"
        >
          <Plus className="size-4" />
          Add Document
        </Button>
      </div>

      <IngestionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleIngestionSuccess}
      />

      {isLoading && (
        <div className="space-y-3" data-testid="document-list-loading">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {error && (
        <div
          className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          data-testid="document-list-error"
        >
          {getApiErrorMessage(error)}
        </div>
      )}

      {data && (
        <>
          <div className="space-y-2" data-testid="document-list">
            {data.documents.map((doc) => {
              const Icon = sourceTypeIcons[doc.sourceType] || FileText;
              return (
                <div
                  key={doc.id}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-accent group"
                  data-testid={`document-item-${doc.id}`}
                >
                  <button
                    onClick={() => onSelect(doc.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{doc.title}</p>
                        {doc.status === "FAILED" && (
                          <Badge
                            variant="destructive"
                            className="h-4 text-[10px] px-1 py-0 gap-1 rounded"
                          >
                            <AlertCircle className="size-3" /> FAILED
                          </Badge>
                        )}
                        {doc.status !== "READY" && doc.status !== "FAILED" && (
                          <Badge
                            variant="secondary"
                            className="h-4 text-[10px] px-1 py-0 gap-1 text-muted-foreground bg-muted rounded"
                          >
                            <RefreshCw className="size-3 animate-spin" />{" "}
                            {doc.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {doc.chunkCount} chunks ·{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                  {doc.status === "FAILED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        retryIngestion.mutate(doc.id, {
                          onSuccess: () => {
                            queryClient.invalidateQueries({
                              queryKey: ["documents"],
                            });
                            queryClient.invalidateQueries({
                              queryKey: ["knowledge"],
                            });
                          },
                        });
                      }}
                      disabled={
                        retryIngestion.isPending &&
                        retryIngestion.variables === doc.id
                      }
                      className="shrink-0 h-8 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <RefreshCw
                        className={`size-3 ${retryIngestion.isPending && retryIngestion.variables === doc.id ? "animate-spin" : ""}`}
                      />
                      Retry
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {data.page} · {data.total} total
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={data.page * data.pageSize >= data.total}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
