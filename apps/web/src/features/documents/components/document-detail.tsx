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
  useUpdateImportance,
  useDeleteDocument,
  useUpdateDocument,
} from "../hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { ExportActions } from "@/features/export/components/export-actions";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type SelectionState = {
  text: string;
  chunkId: string;
  rect: DOMRect;
};

export function DocumentDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { data, isLoading, error } = useDocument(id);
  const addTag = useAddTag();
  const removeTag = useRemoveTag();
  const addNote = useAddNote();
  const updateImportance = useUpdateImportance();
  const deleteDocument = useDeleteDocument();
  const updateDocument = useUpdateDocument();

  const [newTag, setNewTag] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [viewType, setViewType] = useState<"source" | "reader">("reader");
  const [prevId, setPrevId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");

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
        <Button onClick={onBack}>Go back</Button>
      </div>
    );
  }

  const doc = data.document;

  const handleAddSelectionComment = () => {
    if (selection && noteContent.trim()) {
      addNote.mutate({
        documentId: doc.id,
        content: noteContent.trim(),
        chunkId: selection.chunkId,
        selectedText: selection.text,
      });
      setNoteContent("");
      setSelection(null);
    }
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
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Library</span>
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <h1 className="text-sm font-medium truncate max-w-[200px] sm:max-w-md">
              {doc.title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {doc.sourceType === "URL" && (
              <Tabs
                value={viewType}
                onValueChange={(v) => setViewType(v as "source" | "reader")}
                className="w-[200px]"
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
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Done" : "Settings"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {viewType === "source" && doc.sourceUrl ? (
            <div className="space-y-4">
              <Alert className="bg-primary/5 border-primary/10">
                <Globe className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Viewing original website. Some sites may block embedding.{" "}
                  <a
                    href={doc.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-4"
                  >
                    Open in new tab
                  </a>
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
                      />
                    </form>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4 mb-8">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-3xl font-bold h-auto py-2"
                    />
                    <Input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="Source URL"
                    />
                    <Button
                      onClick={() =>
                        updateDocument.mutate({
                          id: doc.id,
                          title: editTitle,
                          sourceUrl: editUrl,
                        })
                      }
                    >
                      Save Changes
                    </Button>
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
              <div className="space-y-0">
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
                    className="min-h-[120px] bg-background text-sm focus:ring-primary/20"
                    autoFocus
                  />
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
                        deleteDocument.mutate(doc.id, { onSuccess: onBack });
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

      {/* Floating Toolbar on selection (Mobile/Quick action) */}
      {selection && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: selection.rect.top - 48,
            left: selection.rect.left + selection.rect.width / 2 - 24,
          }}
        >
          <div className="bg-foreground text-background px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 animate-in zoom-in-95 duration-200 pointer-events-auto">
            <button
              onClick={() => {}} // Could be quick copy
              className="hover:text-primary transition-colors p-1"
            >
              <MessageSquarePlus className="size-4" />
            </button>
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
