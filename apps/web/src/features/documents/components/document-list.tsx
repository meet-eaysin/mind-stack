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
  Trash2,
  Book,
  Video,
  FileCode,
  StickyNote,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments, useDeleteDocument } from "../hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { DocumentListResponse } from "../types";
import { INGESTION_STATUS } from "@repo/shared-types";
import { cn } from "@/lib/utils";

const sourceTypeIcons: Record<string, React.ElementType> = {
  URL: Globe,
  TEXT: Type,
  PDF: File,
  YOUTUBE: Youtube,
};

const documentTypeIcons: Record<string, React.ElementType> = {
  ARTICLE: FileText,
  VIDEO: Video,
  COURSE_LESSON: GraduationCap,
  BOOK: Book,
  NOTE: StickyNote,
  RFC: FileCode,
  BLOG: Globe,
  TRANSCRIPT: Type,
  OTHER: File,
};

const learningStatusColors: Record<string, string> = {
  TO_WATCH: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TO_READ: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  UPCOMING: "bg-muted text-muted-foreground border-muted-foreground/10",
  IN_PROGRESS: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  REVIEW: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  PENDING_COMPLETION: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export function DocumentList({ onSelect }: { onSelect: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageSize = 10;
  const queryClient = useQueryClient();
  const retryIngestion = useRetryIngestion<{
    previousDocs?: DocumentListResponse;
  }>({
    onMutate: async (documentId: string) => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: ["knowledge"],
      });
      const previousDocs = queryClient.getQueryData<DocumentListResponse>(
        QUERY_KEYS.KNOWLEDGE.LIST(page, pageSize, searchTerm || undefined),
      );
      if (previousDocs) {
        queryClient.setQueryData(
          QUERY_KEYS.KNOWLEDGE.LIST(page, pageSize, searchTerm || undefined),
          {
            ...previousDocs,
            documents: previousDocs.documents.map((d) =>
              d.id === documentId
                ? { ...d, status: INGESTION_STATUS.INGESTED }
                : d,
            ),
          },
        );
      }
      return { previousDocs };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["knowledge"],
      });
    },
    onError: (_err, _documentId, context) => {
      if (context?.previousDocs) {
        queryClient.setQueryData(
          QUERY_KEYS.KNOWLEDGE.LIST(page, pageSize, searchTerm || undefined),
          context.previousDocs,
        );
      }
    },
  });

  const { data, isLoading, error } = useDocuments(
    page,
    pageSize,
    searchTerm || undefined,
  );
  const deleteDocument = useDeleteDocument();

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
              const TypeIcon = documentTypeIcons[doc.type] || File;
              const SourceIcon = sourceTypeIcons[doc.sourceType] || File;
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
                    <div className="relative">
                      <div className="p-2 rounded-lg bg-primary/5 text-primary">
                        <TypeIcon className="size-5 shrink-0" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background border shadow-sm">
                        <SourceIcon className="size-2 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{doc.title}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-4 text-[9px] uppercase font-bold tracking-tight px-1.5 py-0 rounded",
                            learningStatusColors[doc.learningStatus] ||
                              learningStatusColors.UPCOMING,
                          )}
                        >
                          {doc.learningStatus.replace("_", " ")}
                        </Badge>
                        {doc.status === "FAILED" && (
                          <Badge
                            variant="destructive"
                            className="h-4 text-[9px] px-1 py-0 gap-1 rounded"
                          >
                            <AlertCircle className="size-2.5" /> FAILED
                          </Badge>
                        )}
                        {doc.status !== "READY" && doc.status !== "FAILED" && (
                          <Badge
                            variant="secondary"
                            className="h-4 text-[9px] px-1 py-0 gap-1 text-muted-foreground bg-muted rounded"
                          >
                            <RefreshCw className="size-2.5 animate-spin" />{" "}
                            {doc.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span className="capitalize">
                          {doc.type.toLowerCase().replace("_", " ")}
                        </span>
                        <span>·</span>
                        <span>{doc.chunkCount} chunks</span>
                        <span>·</span>
                        <span>
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.status === "FAILED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          retryIngestion.mutate(doc.id);
                        }}
                        disabled={
                          retryIngestion.isPending &&
                          retryIngestion.variables === doc.id
                        }
                        className="shrink-0 h-8 text-xs gap-1.5"
                      >
                        <RefreshCw
                          className={`size-3 ${retryIngestion.isPending && retryIngestion.variables === doc.id ? "animate-spin" : ""}`}
                        />
                        Retry
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            "Are you sure you want to delete this document?",
                          )
                        ) {
                          deleteDocument.mutate(doc.id);
                        }
                      }}
                      disabled={
                        deleteDocument.isPending &&
                        deleteDocument.variables === doc.id
                      }
                      className="shrink-0 h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid={`delete-doc-${doc.id}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
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
