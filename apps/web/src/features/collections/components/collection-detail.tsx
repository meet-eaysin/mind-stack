"use client";

import { useState } from "react";
import {
  ArrowLeft,
  GripVertical,
  Lock,
  Unlock,
  MoreVertical,
  Trash2,
  Settings,
  Plus,
  FileText,
  Video,
  Book,
  GraduationCap,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  useCollection,
  useRemoveDocumentFromCollection,
  useAddDocumentToCollection,
  useUpdateCollection,
} from "../hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDocuments } from "@/features/documents/hooks";
import type {
  CollectionDetailResponse,
  CollectionItemResponse,
} from "../types";
import type { DocumentListItem } from "@/features/documents/types";

const itemTypeIcons: Record<string, React.ElementType> = {
  ARTICLE: FileText,
  VIDEO: Video,
  COURSE_LESSON: GraduationCap,
  BOOK: Book,
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

export function CollectionDetail({
  id,
  onBackAction,
  onDocumentSelectAction,
}: {
  id: string;
  onBackAction: () => void;
  onDocumentSelectAction: (id: string) => void;
}) {
  const { data, isLoading, error } = useCollection(id);
  const removeItem = useRemoveDocumentFromCollection();
  const addItem = useAddDocumentToCollection();
  const updateCollection = useUpdateCollection();
  const documentsQuery = useDocuments(1, 100);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [settingsName, setSettingsName] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [settingsGoal, setSettingsGoal] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={onBackAction} className="mb-6 gap-2">
          <ArrowLeft className="size-4" /> Back to Collections
        </Button>
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {getApiErrorMessage(error)}
        </div>
      </div>
    );
  }

  if (!data) return null;
  const collection: CollectionDetailResponse = data;

  const existingDocumentIds = new Set<string>(
    collection.items.map((item: CollectionItemResponse) => item.documentId),
  );
  const availableDocuments: DocumentListItem[] = (
    documentsQuery.data?.documents ?? []
  ).filter(
    (document: DocumentListItem) => !existingDocumentIds.has(document.id),
  );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-8">
        <Button
          variant="ghost"
          onClick={onBackAction}
          className="mb-6 -ml-3 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Collections
        </Button>
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {collection.name}
            </h1>
            <p className="text-muted-foreground">
              {collection.description || "Project-based learning pathway."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSettingsName(collection.name);
                setSettingsDescription(collection.description ?? "");
                setSettingsGoal(collection.goal ?? "");
                setIsSettingsDialogOpen(true);
              }}
            >
              <Settings className="size-4" />
            </Button>
            <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="size-4" /> Add Document
            </Button>
          </div>
        </div>
        {collection.goal && (
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Goal
            </span>
            <p className="text-sm mt-1">{collection.goal}</p>
          </div>
        )}
      </header>

      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Curriculum</span>
          <span>{collection.items.length} items</span>
        </div>
        <Separator className="mb-4" />

        <div className="space-y-3">
          {collection.items
            .sort(
              (a: CollectionItemResponse, b: CollectionItemResponse) =>
                a.order - b.order,
            )
            .map((item: CollectionItemResponse) => {
              const Icon = itemTypeIcons[item.learningStatus] || FileText; // Simplified for now

              return (
                <div
                  key={item.id}
                  className="group relative flex cursor-pointer items-center gap-4 rounded-xl border bg-card p-1 transition-all hover:border-primary/20 hover:shadow-sm"
                  role="link"
                  tabIndex={0}
                  onClick={() => onDocumentSelectAction(item.documentId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onDocumentSelectAction(item.documentId);
                    }
                  }}
                >
                  <div className="flex items-center justify-center size-10 text-muted-foreground/30 group-hover:text-primary/40 transition-colors">
                    <GripVertical className="size-5" />
                  </div>

                  <div className="flex items-center gap-3 py-3 pr-2 min-w-0 flex-1">
                    <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-transparent group-hover:border-primary/10 transition-all">
                      <Icon className="size-5 opacity-50" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate font-medium transition-colors group-hover:text-primary">
                          {item.documentTitle}
                        </h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-4 text-[9px] uppercase font-bold tracking-tight px-1.5 py-0 rounded",
                            learningStatusColors[item.learningStatus] ||
                            learningStatusColors.UPCOMING,
                          )}
                        >
                          {item.learningStatus.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        {item.prerequisiteId ? (
                          <span className="flex items-center gap-1 text-amber-500/80">
                            <Lock className="size-3" /> Locked
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-500/80">
                            <Unlock className="size-3" /> Ready
                          </span>
                        )}
                        <span>·</span>
                        <span>Item #{item.order}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <DropdownMenuItem className="gap-2">
                            <Settings className="size-4" /> Set Prerequisite
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  "Remove this document from the collection?",
                                )
                              ) {
                                removeItem.mutate({
                                  collectionId: id,
                                  documentId: item.documentId,
                                });
                              }
                            }}
                          >
                            <Trash2 className="size-4" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}

          {collection.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed text-muted-foreground">
              <Play className="size-12 mb-4 opacity-10" />
              <p>This collection is empty.</p>
              <Button variant="link" onClick={() => setIsAddDialogOpen(true)}>
                Add your first document
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
            <DialogDescription>
              Select a document to add to this collection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="collectionDocument">Document</Label>
            <select
              id="collectionDocument"
              value={selectedDocumentId}
              onChange={(event) => setSelectedDocumentId(event.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Select a document</option>
              {availableDocuments.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.title}
                </option>
              ))}
            </select>
            {availableDocuments.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No available documents to add.
              </p>
            )}
            {addItem.error && (
              <p className="text-xs text-destructive">
                {getApiErrorMessage(addItem.error)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedDocumentId || addItem.isPending}
              onClick={() => {
                addItem.mutate(
                  {
                    collectionId: id,
                    documentId: selectedDocumentId,
                  },
                  {
                    onSuccess: () => {
                      setSelectedDocumentId("");
                      setIsAddDialogOpen(false);
                    },
                  },
                );
              }}
            >
              {addItem.isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collection Settings</DialogTitle>
            <DialogDescription>
              Update name, description, and learning goal.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="collectionName">Name</Label>
              <Input
                id="collectionName"
                value={settingsName}
                onChange={(event) => setSettingsName(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="collectionDescription">Description</Label>
              <Textarea
                id="collectionDescription"
                value={settingsDescription}
                onChange={(event) => setSettingsDescription(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="collectionGoal">Goal</Label>
              <Textarea
                id="collectionGoal"
                value={settingsGoal}
                onChange={(event) => setSettingsGoal(event.target.value)}
              />
            </div>
            {updateCollection.error && (
              <p className="text-xs text-destructive">
                {getApiErrorMessage(updateCollection.error)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsSettingsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={!settingsName.trim() || updateCollection.isPending}
              onClick={() => {
                updateCollection.mutate(
                  {
                    id,
                    name: settingsName.trim(),
                    description: settingsDescription.trim(),
                    goal: settingsGoal.trim(),
                  },
                  {
                    onSuccess: () => setIsSettingsDialogOpen(false),
                  },
                );
              }}
            >
              {updateCollection.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
