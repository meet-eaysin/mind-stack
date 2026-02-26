"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Folder,
  Link2,
  Loader2,
  Save,
  Tag,
  Trash2,
} from "lucide-react";

import {
  DOCUMENT_TYPE,
  INGESTION_STATUS,
  LEARNING_STATUS,
} from "@repo/shared-types";
import {
  useAddTag,
  useDeleteDocument,
  useDocument,
  useRemoveTag,
  useUpdateDocument,
} from "@/features/documents";
import { getApiErrorMessage } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AddToCollectionDialog } from "@/features/collections/components/add-to-collection-dialog";
import { AppPage, AppPageContent } from "@/components/layouts/app-page";

const learningStatusOptions = [
  LEARNING_STATUS.TO_WATCH,
  LEARNING_STATUS.TO_READ,
  LEARNING_STATUS.UPCOMING,
  LEARNING_STATUS.IN_PROGRESS,
  LEARNING_STATUS.REVIEW,
  LEARNING_STATUS.COMPLETED,
  LEARNING_STATUS.PENDING_COMPLETION,
] as const;

const documentTypeOptions = [
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

export function DocumentDetailPage({ documentId }: { documentId: string }) {
  const router = useRouter();
  const { data, isLoading, error } = useDocument(documentId);
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();
  const addTag = useAddTag();
  const removeTag = useRemoveTag();

  const [tagInput, setTagInput] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [isAddToCollectionOpen, setIsAddToCollectionOpen] = useState(false);

  const document = data?.document;

  const sourceDomain = useMemo(() => {
    if (!document?.sourceUrl) {
      return null;
    }

    try {
      return new URL(document.sourceUrl).hostname;
    } catch {
      return null;
    }
  }, [document?.sourceUrl]);

  useEffect(() => {
    if (document?.title) {
      setDraftTitle(document.title);
    }
  }, [document?.title]);

  if (isLoading) {
    return (
      <AppPage width="wide">
        <AppPageContent>
          <div className="space-y-4">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
            <div className="h-72 w-full animate-pulse rounded bg-muted" />
          </div>
        </AppPageContent>
      </AppPage>
    );
  }

  if (error || !document) {
    return (
      <AppPage width="wide">
        <AppPageContent>
          <Card>
            <CardHeader>
              <CardTitle>Unable to load document</CardTitle>
              <CardDescription>
                {error ? getApiErrorMessage(error) : "Document not found."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/app/documents">Back to documents</Link>
              </Button>
            </CardContent>
          </Card>
        </AppPageContent>
      </AppPage>
    );
  }

  const createdAt = new Date(document.createdAt).toLocaleString();
  const publishedAt = document.publishedAt
    ? new Date(document.publishedAt).toLocaleDateString()
    : null;

  return (
    <AppPage width="wide">
      <AppPageContent className="gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => router.push("/app/documents")}
          >
            <ArrowLeft className="size-4" />
            Documents
          </Button>
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {formatEnumLabel(document.type)}
                  </Badge>
                  <Badge variant="secondary">
                    {formatEnumLabel(document.learningStatus)}
                  </Badge>
                  <Badge variant="outline">
                    {formatEnumLabel(document.status)}
                  </Badge>
                  <Badge variant="outline">{document.sourceType}</Badge>
                </div>
                <CardTitle className="text-2xl leading-tight">
                  {document.title}
                </CardTitle>
                <CardDescription className="space-y-1 text-sm">
                  <p className="inline-flex items-center gap-1">
                    <FileText className="size-3.5" />
                    ID: <span className="font-mono text-xs">{document.id}</span>
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {document.author && <span>Author: {document.author}</span>}
                    {document.publisher && (
                      <span>Publisher: {document.publisher}</span>
                    )}
                    {publishedAt && <span>Published: {publishedAt}</span>}
                    {sourceDomain && <span>Domain: {sourceDomain}</span>}
                    <span className="text-muted-foreground">
                      Collection/Course: managed in Collections
                    </span>
                  </div>
                </CardDescription>
                <div className="flex flex-wrap gap-1.5">
                  {document.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Tag className="size-3" />
                      {tag}
                      <button
                        type="button"
                        className="ml-0.5 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          removeTag.mutate({
                            documentId: document.id,
                            tagName: tag,
                          })
                        }
                        aria-label={`Remove ${tag}`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {document.tags.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      No tags yet
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    className="h-8 w-52"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const tag = tagInput.trim();
                      if (!tag) return;
                      addTag.mutate({ documentId: document.id, tagName: tag });
                      setTagInput("");
                    }}
                  >
                    Add tag
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setIsAddToCollectionOpen(true)}
                  >
                    <Folder className="size-3.5" />
                    Add to collection
                  </Button>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content</CardTitle>
                <CardDescription>
                  Readable document view with full text content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <article className="prose prose-sm max-w-none leading-7 dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {document.rawContent}
                  </ReactMarkdown>
                </article>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-1">
                  <span className="text-muted-foreground">
                    Ingestion status
                  </span>
                  <span>{formatEnumLabel(document.status)}</span>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground">
                    Embedding status
                  </span>
                  <span>
                    {document.status === INGESTION_STATUS.READY
                      ? "Ready"
                      : document.status === INGESTION_STATUS.EMBEDDING
                        ? "Generating embeddings"
                        : "Pending"}
                  </span>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground">Source URL</span>
                  {document.sourceUrl ? (
                    <a
                      href={document.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Link2 className="size-3.5" />
                      Open source
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not available</span>
                  )}
                </div>
                <Separator />
                <div className="grid gap-1">
                  <span className="text-muted-foreground">Created at</span>
                  <span>{createdAt}</span>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground">Updated at</span>
                  <span className="text-muted-foreground">
                    Not available in current API payload
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="learning-status">Learning status</Label>
                  <Select
                    value={document.learningStatus}
                    onValueChange={(value) =>
                      updateDocument.mutate({
                        id: document.id,
                        learningStatus: value,
                      })
                    }
                  >
                    <SelectTrigger id="learning-status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {learningStatusOptions.map((value) => (
                        <SelectItem key={value} value={value}>
                          {formatEnumLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-type">Document type</Label>
                  <Select
                    value={document.type}
                    onValueChange={(value) =>
                      updateDocument.mutate({ id: document.id, type: value })
                    }
                  >
                    <SelectTrigger id="document-type" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypeOptions.map((value) => (
                        <SelectItem key={value} value={value}>
                          {formatEnumLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title-input">Title</Label>
                  <Textarea
                    id="title-input"
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    className="min-h-16"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      updateDocument.mutate({
                        id: document.id,
                        title: draftTitle.trim() || document.title,
                      })
                    }
                    disabled={draftTitle.trim().length === 0}
                  >
                    Save title
                  </Button>
                </div>

                {updateDocument.isPending && (
                  <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Saving changes
                  </p>
                )}

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() =>
                    updateDocument.mutate({
                      id: document.id,
                      learningStatus: LEARNING_STATUS.COMPLETED,
                    })
                  }
                >
                  <Save className="size-4" />
                  Archive (mark completed)
                </Button>

                <Button
                  variant="destructive"
                  className="w-full gap-2"
                  onClick={() => {
                    if (window.confirm("Delete this document permanently?")) {
                      deleteDocument.mutate(document.id, {
                        onSuccess: () => router.push("/app/documents"),
                      });
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete document
                </Button>
              </CardContent>
            </Card>
          </aside>
        </section>
      </AppPageContent>

      <AddToCollectionDialog
        documentId={document.id}
        open={isAddToCollectionOpen}
        onOpenChange={setIsAddToCollectionOpen}
      />
    </AppPage>
  );
}

function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
