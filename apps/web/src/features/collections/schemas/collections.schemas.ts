import { z } from "zod";

export const CollectionListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  itemCount: z.number(),
  progress: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CollectionItemResponseSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  documentTitle: z.string(),
  learningStatus: z.string(),
  order: z.number(),
  prerequisiteId: z.string().nullable(),
});

export const CollectionDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  goal: z.string().nullable(),
  items: z.array(CollectionItemResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateCollectionRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  goal: z.string().optional(),
});

export const UpdateCollectionRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  goal: z.string().optional(),
});

export const AddDocumentToCollectionRequestSchema = z.object({
  documentId: z.string(),
  order: z.number().optional(),
  prerequisiteId: z.string().optional(),
});

export const ReorderCollectionItemsRequestSchema = z.object({
  itemIds: z.array(z.string()),
});
