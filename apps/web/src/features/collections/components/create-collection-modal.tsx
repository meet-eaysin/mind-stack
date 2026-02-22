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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCollection } from "../hooks";
import { Loader2 } from "lucide-react";

export function CreateCollectionModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const createCollection = useCreateCollection();

  const handleCreate = () => {
    createCollection.mutate(
      { name, description, goal },
      {
        onSuccess: () => {
          onOpenChange(false);
          setName("");
          setDescription("");
          setGoal("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Collection</DialogTitle>
          <DialogDescription>
            Group related documents into a structured learning path or project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Distributed Systems 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this collection about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="goal">Learning Goal (Optional)</Label>
            <Textarea
              id="goal"
              placeholder="e.g. Master the CAP theorem and Raft consensus."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || createCollection.isPending}
            className="gap-2"
          >
            {createCollection.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Create Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
