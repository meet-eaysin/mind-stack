"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCollections, useAddDocumentToCollection } from "../hooks";
import { Loader2, Folder } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function AddToCollectionDialog({
  documentId,
  open,
  onOpenChange,
}: {
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useCollections();
  const addToCollection = useAddDocumentToCollection();
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

  const handleAdd = () => {
    if (!selectedCollectionId) return;
    addToCollection.mutate(
      { collectionId: selectedCollectionId, documentId },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedCollectionId(null);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>
            Select a collection to add this document to.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] pr-4 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-2">
              {data?.collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => setSelectedCollectionId(collection.id)}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-all hover:bg-accent hover:border-primary/20",
                    selectedCollectionId === collection.id &&
                      "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20",
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-md bg-muted text-muted-foreground transition-colors",
                      selectedCollectionId === collection.id &&
                        "bg-primary/10 text-primary",
                    )}
                  >
                    <Folder className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {collection.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {collection.itemCount} items
                    </p>
                  </div>
                </button>
              ))}
              {data?.collections.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground border border-dashed rounded-lg">
                  <Folder className="size-8 mb-2 opacity-20" />
                  <p className="text-sm">No collections yet.</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedCollectionId || addToCollection.isPending}
            className="gap-2"
          >
            {addToCollection.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Add to Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
