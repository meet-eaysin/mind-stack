"use client";

import { useState } from "react";
import {
  Folder,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollections, useDeleteCollection } from "../hooks";
import { getApiErrorMessage } from "@/lib/api-client";
import { Progress } from "@/components/ui/progress";
import { CreateCollectionModal } from "./create-collection-modal";

type CollectionListProps = {
  onSelectAction: (id: string) => void;
};

export function CollectionList({ onSelectAction }: CollectionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data, isLoading, error } = useCollections();
  const deleteCollection = useDeleteCollection();

  const filteredCollections = data?.collections.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
        <Button
          className="shrink-0 gap-2"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="size-4" />
          New Collection
        </Button>
      </div>

      <CreateCollectionModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {getApiErrorMessage(error)}
        </div>
      )}

      {filteredCollections && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCollections.map((collection) => (
            <div
              key={collection.id}
              className="group relative flex cursor-pointer flex-col gap-4 rounded-xl border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-sm"
              role="button"
              tabIndex={0}
              onClick={() => onSelectAction(collection.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectAction(collection.id);
                }
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Folder className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold leading-none group-hover:text-primary transition-colors">
                      {collection.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                      <Clock className="size-3" />
                      {new Date(collection.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

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
                      <Edit3 className="size-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-destructive focus:text-destructive"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this collection?",
                          )
                        ) {
                          deleteCollection.mutate(collection.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
                {collection.description || "No description provided."}
              </p>

              <div className="mt-auto space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    {collection.progress}% Complete
                  </span>
                  <span className="text-muted-foreground">
                    {collection.itemCount} Items
                  </span>
                </div>
                <Progress value={collection.progress} className="h-1.5" />
              </div>
            </div>
          ))}

          {filteredCollections.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 rounded-xl border border-dashed text-muted-foreground bg-muted/30">
              <Folder className="size-12 mb-4 opacity-20" />
              <p>No collections found matching your search.</p>
              <Button variant="link" onClick={() => setSearchTerm("")}>
                Clear search
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
