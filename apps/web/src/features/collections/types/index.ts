import { z } from "zod";
import * as schemas from "../schemas/collections.schemas";

export type CollectionListItem = z.infer<
  typeof schemas.CollectionListItemSchema
>;
export type CollectionItemResponse = z.infer<
  typeof schemas.CollectionItemResponseSchema
>;
export type CollectionDetailResponse = z.infer<
  typeof schemas.CollectionDetailResponseSchema
>;
export type CreateCollectionRequest = z.infer<
  typeof schemas.CreateCollectionRequestSchema
>;
export type UpdateCollectionRequest = z.infer<
  typeof schemas.UpdateCollectionRequestSchema
>;
export type AddDocumentToCollectionRequest = z.infer<
  typeof schemas.AddDocumentToCollectionRequestSchema
>;
export type ReorderCollectionItemsRequest = z.infer<
  typeof schemas.ReorderCollectionItemsRequestSchema
>;

export type CollectionListResponse = {
  collections: CollectionListItem[];
};
