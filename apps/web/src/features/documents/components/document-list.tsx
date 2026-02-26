"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  File,
  FileCode,
  FileText,
  Globe,
  GraduationCap,
  RefreshCw,
  StickyNote,
  Trash2,
  Type,
  Video,
  Youtube,
} from "lucide-react";

import { QUERY_KEYS } from "@/constants/query-keys";
import type { DocumentListResponse } from "../types";
import { useDeleteDocument, useDocuments } from "../hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DOCUMENT_TYPE,
  INGESTION_STATUS,
  LEARNING_STATUS,
  SOURCE_TYPE,
} from "@repo/shared-types";
import { cn } from "@/lib/utils";
import { useRetryIngestion } from "@/features/ingestion/hooks";

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
  BOOK: File,
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

const sourceTypeFilterOptions = [
  SOURCE_TYPE.URL,
  SOURCE_TYPE.YOUTUBE,
  SOURCE_TYPE.PDF,
  SOURCE_TYPE.TEXT,
] as const;

const documentTypeFilterOptions = [
  DOCUMENT_TYPE.ARTICLE,
  DOCUMENT_TYPE.VIDEO,
  DOCUMENT_TYPE.COURSE_LESSON,
  DOCUMENT_TYPE.BOOK,
  DOCUMENT_TYPE.NOTE,
  DOCUMENT_TYPE.RFC,
  DOCUMENT_TYPE.BLOG,
  DOCUMENT_TYPE.TRANSCRIPT,
  DOCUMENT_TYPE.OTHER,
] as const;

const learningStatusFilterOptions = [
  LEARNING_STATUS.TO_WATCH,
  LEARNING_STATUS.TO_READ,
  LEARNING_STATUS.UPCOMING,
  LEARNING_STATUS.IN_PROGRESS,
  LEARNING_STATUS.REVIEW,
  LEARNING_STATUS.COMPLETED,
  LEARNING_STATUS.PENDING_COMPLETION,
] as const;

const ingestionStatusFilterOptions = [
  INGESTION_STATUS.INGESTED,
  INGESTION_STATUS.INITIALIZING,
  INGESTION_STATUS.CHUNKING,
  INGESTION_STATUS.EMBEDDING,
  INGESTION_STATUS.GRAPH_BUILDING,
  INGESTION_STATUS.READY,
  INGESTION_STATUS.FAILED,
] as const;

type DocumentListProps = {
  onSelectAction: (id: string) => void;
};

type FilterValue = "all" | string;

export function DocumentList({ onSelectAction }: DocumentListProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<FilterValue>("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<FilterValue>("all");
  const [learningStatusFilter, setLearningStatusFilter] =
    useState<FilterValue>("all");
  const [ingestionStatusFilter, setIngestionStatusFilter] =
    useState<FilterValue>("all");

  const pageSize = 10;
  const queryClient = useQueryClient();
  const retryIngestion = useRetryIngestion<{
    previousDocs?: DocumentListResponse;
  }>({
    onMutate: async (documentId: string) => {
      await queryClient.cancelQueries({ queryKey: ["knowledge"] });
      const previousDocs = queryClient.getQueryData<DocumentListResponse>(
        QUERY_KEYS.KNOWLEDGE.LIST(page, pageSize, searchTerm || undefined),
      );

      if (previousDocs) {
        queryClient.setQueryData(
          QUERY_KEYS.KNOWLEDGE.LIST(page, pageSize, searchTerm || undefined),
          {
            ...previousDocs,
            documents: previousDocs.documents.map((doc) =>
              doc.id === documentId
                ? { ...doc, status: INGESTION_STATUS.INGESTED }
                : doc,
            ),
          },
        );
      }

      return { previousDocs };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: (_error, _documentId, context) => {
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

  const filteredDocuments = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.documents.filter((doc) => {
      if (sourceTypeFilter !== "all" && doc.sourceType !== sourceTypeFilter) {
        return false;
      }
      if (documentTypeFilter !== "all" && doc.type !== documentTypeFilter) {
        return false;
      }
      if (
        learningStatusFilter !== "all" &&
        doc.learningStatus !== learningStatusFilter
      ) {
        return false;
      }
      if (
        ingestionStatusFilter !== "all" &&
        doc.status !== ingestionStatusFilter
      ) {
        return false;
      }
      return true;
    });
  }, [
    data,
    sourceTypeFilter,
    documentTypeFilter,
    learningStatusFilter,
    ingestionStatusFilter,
  ]);

  const hasActiveFilters =
    sourceTypeFilter !== "all" ||
    documentTypeFilter !== "all" ||
    learningStatusFilter !== "all" ||
    ingestionStatusFilter !== "all";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setPage(1);
          }}
          data-testid="document-search-input"
          className="flex-1"
        />

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:w-auto">
          <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
            <SelectTrigger className="w-full md:w-42" size="sm">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sourceTypeFilterOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {formatEnumLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
            <SelectTrigger className="w-full md:w-42" size="sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {documentTypeFilterOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {formatEnumLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={learningStatusFilter}
            onValueChange={setLearningStatusFilter}
          >
            <SelectTrigger className="w-full md:w-42" size="sm">
              <SelectValue placeholder="Learning" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Learning</SelectItem>
              {learningStatusFilterOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {formatEnumLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={ingestionStatusFilter}
            onValueChange={setIngestionStatusFilter}
          >
            <SelectTrigger className="w-full md:w-42" size="sm">
              <SelectValue placeholder="Processing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Processing</SelectItem>
              {ingestionStatusFilterOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {formatEnumLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Showing {filteredDocuments.length} filtered result
            {filteredDocuments.length === 1 ? "" : "s"} on this page
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setSourceTypeFilter("all");
              setDocumentTypeFilter("all");
              setLearningStatusFilter("all");
              setIngestionStatusFilter("all");
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {isLoading && (
        <div
          className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          data-testid="document-list-loading"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2 rounded-xl border p-2.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-7 w-full" />
            </div>
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
          <div
            className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            data-testid="document-list"
          >
            {filteredDocuments.map((doc) => {
              const TypeIcon = documentTypeIcons[doc.type] || File;
              const SourceIcon = sourceTypeIcons[doc.sourceType] || File;
              const isFailed = doc.status === INGESTION_STATUS.FAILED;
              const isProcessing =
                doc.status !== INGESTION_STATUS.READY &&
                doc.status !== INGESTION_STATUS.FAILED;
              const youtubeEmbedUrl = getYoutubeEmbedUrl(doc.sourceUrl);

              return (
                <Card
                  key={doc.id}
                  className="gap-2 overflow-hidden py-0"
                  data-testid={`document-item-${doc.id}`}
                >
                  <CardHeader className="gap-1.5 p-3 pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                          <TypeIcon className="size-4" />
                        </div>
                        <div className="rounded-full border bg-background p-1 text-muted-foreground">
                          <SourceIcon className="size-3" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 rounded px-1.5 py-0 text-[10px] font-semibold uppercase tracking-tight",
                            learningStatusColors[doc.learningStatus] ||
                              learningStatusColors.UPCOMING,
                          )}
                        >
                          {formatEnumLabel(doc.learningStatus)}
                        </Badge>
                        {isFailed && (
                          <Badge
                            variant="destructive"
                            className="h-5 gap-1 rounded px-1.5 py-0 text-[10px]"
                          >
                            <AlertCircle className="size-2.5" />
                            Failed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="line-clamp-2 text-base leading-5">
                      {doc.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-[11px]">
                      <span className="capitalize">
                        {doc.type.toLowerCase().replace("_", " ")}
                      </span>
                      <span>·</span>
                      <span>{doc.chunkCount} chunks</span>
                      <span>·</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-3">
                    <div className="overflow-hidden rounded-lg border bg-muted/20">
                      {doc.sourceType === SOURCE_TYPE.YOUTUBE &&
                      youtubeEmbedUrl ? (
                        <iframe
                          title={`${doc.title} preview`}
                          src={youtubeEmbedUrl}
                          className="h-32 w-full"
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      ) : doc.sourceType === SOURCE_TYPE.URL && doc.sourceUrl ? (
                        <iframe
                          title={`${doc.title} source`}
                          src={doc.sourceUrl}
                          className="h-32 w-full"
                          loading="lazy"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      ) : (
                        <div className="flex h-32 flex-col items-center justify-center gap-1.5 px-3 text-center">
                          <TypeIcon className="size-6 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {doc.sourceType === SOURCE_TYPE.PDF
                              ? "PDF preview available in reader"
                              : "Open document to view content"}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between gap-1.5 border-t p-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSelectAction(doc.id)}
                        className="h-7 gap-1 px-2 text-xs"
                      >
                        Open
                        <ExternalLink className="size-3" />
                      </Button>
                      {isFailed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryIngestion.mutate(doc.id)}
                          disabled={
                            retryIngestion.isPending &&
                            retryIngestion.variables === doc.id
                          }
                          className="h-7 gap-1 px-2 text-xs"
                        >
                          <RefreshCw
                            className={cn(
                              "size-3",
                              retryIngestion.isPending &&
                                retryIngestion.variables === doc.id &&
                                "animate-spin",
                            )}
                          />
                          Retry
                        </Button>
                      )}
                      {isProcessing && (
                        <Badge
                          variant="secondary"
                          className="h-7 gap-1 rounded-md px-1.5 text-[11px] text-muted-foreground"
                        >
                          <RefreshCw className="size-3 animate-spin" />
                          {formatEnumLabel(doc.status)}
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
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
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      data-testid={`delete-doc-${doc.id}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground">
              No documents match the current filters.
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {data.page} · {data.total} total
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={data.page <= 1}
                onClick={() =>
                  setPage((currentPage) => Math.max(1, currentPage - 1))
                }
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={data.page * data.pageSize >= data.total}
                onClick={() => setPage((currentPage) => currentPage + 1)}
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

function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getYoutubeEmbedUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}
