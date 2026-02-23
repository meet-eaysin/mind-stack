"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  StickyNote,
  Trash2,
  X,
  ExternalLink,
  MessageSquarePlus,
  ChevronRight,
  Globe,
  Layout,
  Folder,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDocument,
  useAddTag,
  useRemoveTag,
  useAddNote,
  useRelatedDocuments,
  useUpdateImportance,
  useDeleteDocument,
  useUpdateDocument,
} from "../hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { ExportActions } from "@/features/export/components/export-actions";
import { AddToCollectionDialog } from "@/features/collections/components/add-to-collection-dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  LEARNING_STATUS,
  DOCUMENT_TYPE,
  ANNOTATION_TYPE,
  type AnnotationType,
} from "@repo/shared-types";
import { Label } from "@/components/ui/label";

type SelectionState = {
  text: string;
  chunkId: string;
  rect: DOMRect;
};

export function DocumentDetail({
  id,
  onBackAction,
}: {
  id: string;
  onBackAction: () => void;
}) {
  const { data, isLoading, error } = useDocument(id);
  const addTag = useAddTag();
  const removeTag = useRemoveTag();
  const addNote = useAddNote();
  const updateImportance = useUpdateImportance();
  const deleteDocument = useDeleteDocument();
  const updateDocument = useUpdateDocument();
  const relatedDocuments = useRelatedDocuments(id);

  const [newTag, setNewTag] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [viewType, setViewType] = useState<"source" | "reader">("reader");
  const [prevId, setPrevId] = useState<string | null>(null);

  type EditForm = {
    title: string;
    url: string;
    learningStatus: string;
    type: string;
    author: string;
    publisher: string;
    publishedAt: string;
    language: string;
  };

  const makeEditForm = (): EditForm => ({
    title: data?.document.title ?? "",
    url: data?.document.sourceUrl ?? "",
    learningStatus: data?.document.learningStatus ?? "",
    type: data?.document.type ?? "",
    author: data?.document.author ?? "",
    publisher: data?.document.publisher ?? "",
    publishedAt: data?.document.publishedAt
      ? data.document.publishedAt.split("T")[0]
      : "",
    language: data?.document.language ?? "",
  });

  const [editForm, setEditForm] = useState<EditForm>(makeEditForm);
  const [editFormDocId, setEditFormDocId] = useState<string | null>(null);

  // Adjust state during render (React Compiler safe): reset form when document changes
  if (data?.document && data.document.id !== editFormDocId) {
    setEditFormDocId(data.document.id);
    setEditForm(makeEditForm());
  }

  const editTitle = editForm.title;
  const editUrl = editForm.url;
  const editLearningStatus = editForm.learningStatus;
  const editType = editForm.type;
  const editAuthor = editForm.author;
  const editPublisher = editForm.publisher;
  const editPublishedAt = editForm.publishedAt;
  const editLanguage = editForm.language;

  const setEditTitle = (v: string) => setEditForm((f) => ({ ...f, title: v }));
  const setEditUrl = (v: string) => setEditForm((f) => ({ ...f, url: v }));
  const setEditLearningStatus = (v: string) =>
    setEditForm((f) => ({ ...f, learningStatus: v }));
  const setEditType = (v: string) => setEditForm((f) => ({ ...f, type: v }));
  const setEditAuthor = (v: string) =>
    setEditForm((f) => ({ ...f, author: v }));
  const setEditPublisher = (v: string) =>
    setEditForm((f) => ({ ...f, publisher: v }));
  const setEditPublishedAt = (v: string) =>
    setEditForm((f) => ({ ...f, publishedAt: v }));
  const setEditLanguage = (v: string) =>
    setEditForm((f) => ({ ...f, language: v }));

  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [quickNoteContent, setQuickNoteContent] = useState("");
  const [annotationType, setAnnotationType] = useState<AnnotationType>(
    ANNOTATION_TYPE.NOTE,
  );
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);

  const articleRef = useRef<HTMLDivElement>(null);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();

    if (!text) {
      setSelection(null);
      return;
    }

    // Find the nearest chunk element
    let node: Node | null = range.startContainer;
    while (node && node !== articleRef.current) {
      if (node instanceof HTMLElement && node.dataset.chunkId) {
        setSelection({
          text,
          chunkId: node.dataset.chunkId,
          rect: range.getBoundingClientRect(),
        });
        return;
      }
      node = node.parentNode;
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  if (data?.document.id && data.document.id !== prevId) {
    setPrevId(data.document.id);
    if (data.document.sourceUrl && data.document.sourceType === "URL") {
      setViewType("source");
    } else {
      setViewType("reader");
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-6 space-y-8 animate-pulse">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="text-destructive mb-4">
          {error ? getApiErrorMessage(error) : "Document not found"}
        </div>
        <Button onClick={onBackAction}>Go back</Button>
      </div>
    );
  }

  const doc = data.document;

  const handleAddSelectionComment = () => {
    if (selection && noteContent.trim()) {
      addNote.mutate({
        documentId: doc.id,
        content: noteContent.trim(),
        type: annotationType,
        chunkId: selection.chunkId,
        selectedText: selection.text,
      });
      setNoteContent("");
      setSelection(null);
    }
  };

  const handleAddQuickNote = () => {
    if (!quickNoteContent.trim()) {
      return;
    }
    addNote.mutate({
      documentId: doc.id,
      content: quickNoteContent.trim(),
      type: annotationType,
    });
    setQuickNoteContent("");
  };

  return (
    <div
      className="relative min-h-screen bg-background"
      data-testid="document-detail"
    >
      {/* Header / Navigation */}
      <nav className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackAction}
              className="gap-2"
              data-testid="back-button"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Library</span>
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium truncate max-w-50 sm:max-w-md">
              {doc.title}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {doc.sourceType === "URL" && (
              <Tabs
                value={viewType}
                onValueChange={(v) => setViewType(v as "source" | "reader")}
                className="w-50"
              >
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="source" className="text-xs gap-1.5">
                    <Globe className="size-3" />
                    Source
                  </TabsTrigger>
                  <TabsTrigger value="reader" className="text-xs gap-1.5">
                    <Layout className="size-3" />
                    Reader
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <div className="flex items-center gap-2">
              <ExportActions chunkIds={doc.chunks.map((c) => c.id)} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingToCollection(true)}
                className="gap-2"
              >
                <Folder className="size-4" />
                Add to Collection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Done" : "Settings"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <AddToCollectionDialog
        documentId={doc.id}
        open={isAddingToCollection}
        onOpenChange={setIsAddingToCollection}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {viewType === "source" && doc.sourceUrl ? (
            <div className="space-y-4">
              <Alert className="bg-primary/5 border-primary/10">
                <Globe className="h-4 w-4" />
                <AlertDescription className="text-xs flex items-center justify-between w-full flex-wrap gap-2">
                  <span>
                    Viewing original website. Some sites may block embedding.{" "}
                    <a
                      href={doc.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline underline-offset-4"
                    >
                      Open in new tab
                    </a>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] px-2"
                    onClick={() => setViewType("reader")}
                  >
                    Switch to Reader
                  </Button>
                </AlertDescription>
              </Alert>
              <div className="w-full aspect-video bg-muted rounded-2xl border shadow-2xl overflow-hidden relative">
                <iframe
                  src={doc.sourceUrl}
                  className="w-full h-full border-0"
                  title={doc.title}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            </div>
          ) : (
            <article
              ref={articleRef}
              className="prose prose-slate dark:prose-invert prose-headings:font-serif prose-p:text-lg prose-p:leading-relaxed selection:bg-primary/20"
            >
              {/* Document Header in Article */}
              <header className="mb-12 not-prose">
                <div className="flex flex-wrap gap-2 mb-4">
                  {doc.tags.map((tag: string) => (
                    <span
                      key={tag}
                      data-testid={`tag-${tag}`}
                      className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() =>
                          removeTag.mutate({ documentId: doc.id, tagName: tag })
                        }
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  {isEditing && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (newTag.trim()) {
                          addTag.mutate({
                            documentId: doc.id,
                            tagName: newTag.trim(),
                          });
                          setNewTag("");
                        }
                      }}
                    >
                      <Input
                        placeholder="Add tag..."
                        className="h-6 w-24 text-xs"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        data-testid="add-tag-input"
                      />
                    </form>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-6 mb-8 p-6 rounded-xl border bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                      <Label
                        htmlFor="title"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Title
                      </Label>
                      <Input
                        id="title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-2xl font-bold h-auto py-2 bg-background/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="learningStatus"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          Learning Status
                        </Label>
                        <select
                          id="learningStatus"
                          value={editLearningStatus}
                          onChange={(e) =>
                            setEditLearningStatus(e.target.value)
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {Object.values(LEARNING_STATUS).map((status) => (
                            <option key={status} value={status}>
                              {status.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="type"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          Document Type
                        </Label>
                        <select
                          id="type"
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {Object.values(DOCUMENT_TYPE).map((type) => (
                            <option key={type} value={type}>
                              {type.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="sourceUrl"
                        className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Source URL
                      </Label>
                      <Input
                        id="sourceUrl"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="https://..."
                        className="bg-background/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="author"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          Author
                        </Label>
                        <Input
                          id="author"
                          value={editAuthor}
                          onChange={(e) => setEditAuthor(e.target.value)}
                          placeholder="Author name"
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="publisher"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          Publisher
                        </Label>
                        <Input
                          id="publisher"
                          value={editPublisher}
                          onChange={(e) => setEditPublisher(e.target.value)}
                          placeholder="Publisher name"
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="publishedAt"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          Published Date
                        </Label>
                        <Input
                          id="publishedAt"
                          type="date"
                          value={editPublishedAt}
                          onChange={(e) => setEditPublishedAt(e.target.value)}
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="language"
                          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          Language
                        </Label>
                        <Input
                          id="language"
                          value={editLanguage}
                          onChange={(e) => setEditLanguage(e.target.value)}
                          placeholder="e.g. en, es, fr"
                          className="bg-background/50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() =>
                          updateDocument.mutate(
                            {
                              id: doc.id,
                              title: editTitle,
                              sourceUrl: editUrl,
                              learningStatus: editLearningStatus,
                              type: editType,
                              author: editAuthor,
                              publisher: editPublisher,
                              publishedAt: editPublishedAt
                                ? new Date(editPublishedAt).toISOString()
                                : undefined,
                              language: editLanguage,
                            },
                            {
                              onSuccess: () => setIsEditing(false),
                            },
                          )
                        }
                        className="flex-1 shadow-lg shadow-primary/20"
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <h1 className="text-4xl sm:text-5xl font-bold font-serif leading-tight mb-4">
                    {doc.title}
                  </h1>
                )}

                <div className="flex items-center gap-4 text-muted-foreground text-sm italic">
                  <span>{doc.sourceType}</span>
                  <span>•</span>
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  {doc.sourceUrl && (
                    <>
                      <span>•</span>
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        Source <ExternalLink className="size-3" />
                      </a>
                    </>
                  )}
                </div>
              </header>

              {/* Render Segments */}
              <div className="space-y-0" data-testid="chunk-list">
                {doc.chunks.map((chunk) => {
                  const chunkNotes = doc.notes.filter(
                    (n) => n.chunkId === chunk.id,
                  );
                  return (
                    <div
                      key={chunk.id}
                      data-chunk-id={chunk.id}
                      className="relative group mb-4 last:mb-0"
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ node: _node, ...props }) => <p {...props} />,
                          img: ({ node: _node, ...props }) => (
                            <div className="my-8 flex justify-center flex-col items-center">
                              <Image
                                src={(props.src as string) || ""}
                                alt={props.alt || ""}
                                width={800}
                                height={450}
                                unoptimized
                                className="rounded-xl shadow-lg border max-w-full h-auto"
                              />
                              {props.alt && (
                                <span className="text-sm text-muted-foreground mt-2 italic">
                                  {props.alt}
                                </span>
                              )}
                            </div>
                          ),
                          code: ({ node: _node, ...props }) => (
                            <code
                              className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-sm border shadow-sm"
                              {...props}
                            />
                          ),
                          pre: ({ node: _node, ...props }) => (
                            <pre
                              className="p-4 rounded-xl bg-slate-900 border text-slate-100 overflow-x-auto my-6 shadow-inner font-mono text-sm"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {chunk.content}
                      </ReactMarkdown>

                      {/* Sidebar Indicators for notes */}
                      {chunkNotes.length > 0 && (
                        <div className="absolute -left-12 top-2 hidden xl:flex flex-col gap-1">
                          {chunkNotes.map((note) => (
                            <button
                              key={note.id}
                              onClick={() => setActiveNoteId(note.id)}
                              className={cn(
                                "p-1.5 rounded-full border bg-background shadow-sm transition-all hover:scale-110",
                                activeNoteId === note.id
                                  ? "border-primary text-primary"
                                  : "text-muted-foreground",
                              )}
                            >
                              <StickyNote className="size-4" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          )}
        </div>

        {/* Floating Sidebar / Annotations */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="sticky top-20">
            <div className="p-6 rounded-2xl border bg-card shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <StickyNote className="size-4 text-primary" />
                  Annotations
                </h3>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                  {doc.notes.length} total
                </span>
              </div>

              {/* Selection Menu / Composer */}
              {selection ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="text-xs font-semibold text-primary flex items-center gap-1 uppercase tracking-wider">
                    <MessageSquarePlus className="size-3" />
                    New Selection Note
                  </div>
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-sm italic line-clamp-3">
                    &quot;{selection.text}&quot;
                  </div>
                  <Textarea
                    placeholder="Write your thought..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-30 bg-background text-sm focus:ring-primary/20"
                    autoFocus
                    data-testid="add-note-input"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(ANNOTATION_TYPE).map((type) => (
                      <Button
                        key={type}
                        type="button"
                        size="sm"
                        variant={
                          annotationType === type ? "default" : "outline"
                        }
                        className="text-xs"
                        onClick={() => setAnnotationType(type)}
                        data-testid={`annotation-type-${type}`}
                      >
                        {type.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 rounded-full h-9"
                      onClick={handleAddSelectionComment}
                      disabled={!noteContent.trim() || addNote.isPending}
                    >
                      Annotate
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full h-9"
                      onClick={() => setSelection(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-3 p-3 rounded-xl border bg-muted/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Quick Annotation
                    </p>
                    <Textarea
                      placeholder="Add a general note, question, insight, or highlight..."
                      value={quickNoteContent}
                      onChange={(e) => setQuickNoteContent(e.target.value)}
                      className="min-h-25 bg-background text-sm"
                      data-testid="quick-note-input"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(ANNOTATION_TYPE).map((type) => (
                        <Button
                          key={type}
                          type="button"
                          size="sm"
                          variant={
                            annotationType === type ? "default" : "outline"
                          }
                          className="text-xs"
                          onClick={() => setAnnotationType(type)}
                          data-testid={`quick-annotation-type-${type}`}
                        >
                          {type.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddQuickNote}
                      disabled={!quickNoteContent.trim() || addNote.isPending}
                      data-testid="quick-note-submit"
                    >
                      Add Annotation
                    </Button>
                  </div>

                  {doc.notes.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-xl border border-dashed text-muted-foreground">
                      <StickyNote className="size-8 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">
                        Highlight text to add your first annotation
                      </p>
                    </div>
                  ) : (
                    doc.notes.map((note) => (
                      <div
                        key={note.id}
                        className={cn(
                          "group p-4 rounded-xl border transition-all cursor-pointer",
                          activeNoteId === note.id
                            ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                            : "hover:border-foreground/10 hover:bg-slate-50/50",
                        )}
                        onClick={() => setActiveNoteId(note.id)}
                      >
                        {note.selectedText && (
                          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1 italic border-l-2 border-primary/30 pl-2 line-clamp-2">
                            {note.selectedText}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">
                          {note.content}
                        </p>
                        <div className="mt-2">
                          <span
                            className="inline-flex items-center rounded-full border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                            data-testid={`note-type-${note.type}`}
                          >
                            {note.type.replace("_", " ")}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-destructive/50 hover:text-destructive hover:bg-destructive/5"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {/* Global Note - Check if there are any notes that are NOT selection-based or chunk-based */}
              {doc.notes.some((n) => !n.chunkId && !n.selectedText) && (
                <div className="space-y-2" data-testid="document-note">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    General Notes
                  </p>
                  {doc.notes
                    .filter((n) => !n.chunkId && !n.selectedText)
                    .map((n) => (
                      <div
                        key={n.id}
                        className="rounded-md bg-muted p-2 text-xs text-muted-foreground"
                      >
                        {n.content}
                      </div>
                    ))}
                </div>
              )}

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Related Resources
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => relatedDocuments.refetch()}
                    disabled={relatedDocuments.isFetching}
                    data-testid="related-refresh"
                  >
                    <RefreshCw
                      className={cn(
                        "size-3.5",
                        relatedDocuments.isFetching && "animate-spin",
                      )}
                    />
                  </Button>
                </div>

                {relatedDocuments.isLoading && (
                  <div
                    className="space-y-2"
                    data-testid="related-resources-loading"
                  >
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                )}

                {relatedDocuments.error && (
                  <div
                    className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive"
                    data-testid="related-resources-error"
                  >
                    {getApiErrorMessage(relatedDocuments.error)}
                  </div>
                )}

                {relatedDocuments.data && relatedDocuments.data.length === 0 && (
                  <div
                    className="rounded-md border border-dashed p-3 text-xs text-muted-foreground"
                    data-testid="related-resources-empty"
                  >
                    No related resources found for this document yet.
                  </div>
                )}

                {relatedDocuments.data && relatedDocuments.data.length > 0 && (
                  <div className="space-y-2" data-testid="related-resources-list">
                    {relatedDocuments.data.map((item) => (
                      <div
                        key={item.chunkId}
                        className="w-full rounded-lg border bg-background p-3 text-left hover:border-primary/40 transition-colors"
                      >
                        <p className="text-xs font-semibold line-clamp-1">
                          {item.documentTitle}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                          {item.content}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px]"
                            onClick={() => {
                              window.location.href = `/documents?id=${item.documentId}`;
                            }}
                            data-testid={`related-open-document-${item.documentId}`}
                          >
                            Open document
                          </Button>
                          {item.sourceUrl && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[10px]"
                              onClick={() => {
                                if (!item.sourceUrl) {
                                  return;
                                }
                                window.open(
                                  item.sourceUrl,
                                  "_blank",
                                  "noopener,noreferrer",
                                );
                              }}
                              data-testid={`related-open-source-${item.documentId}`}
                            >
                              Open source
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="pt-4 border-t space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Document Importance
                  </div>
                  <div className="flex justify-between gap-1">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() =>
                          updateImportance.mutate({ documentId: doc.id, score })
                        }
                        data-testid={`importance-btn-${score}`}
                        className={cn(
                          "flex-1 py-1.5 rounded-md text-xs font-bold transition-all",
                          doc.importanceScore === score
                            ? "bg-primary text-primary-foreground scale-105 shadow-sm"
                            : "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                      <Button
                        variant="destructive"
                        className="w-full text-xs h-9 rounded-full gap-2"
                        onClick={() => {
                          if (window.confirm("Permanently delete this document?")) {
                            deleteDocument.mutate(doc.id, {
                              onSuccess: onBackAction,
                            });
                          }
                        }}
                  >
                    <Trash2 className="size-3" />
                    Delete Document
                  </Button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {selection && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: selection.rect.top - 48,
            left: selection.rect.left + selection.rect.width / 2 - 24,
          }}
        >
          <div className="bg-foreground text-background px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 animate-in zoom-in-95 duration-200 pointer-events-auto">
            <MessageSquarePlus className="size-4" />
            <Separator
              orientation="vertical"
              className="h-4 bg-background/20"
            />
            <ChevronRight className="size-3 opacity-50" />
          </div>
        </div>
      )}
    </div>
  );
}
