import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constants/endpoints";
import * as schemas from "../schemas/collections.schemas";
import { z } from "zod";

export const collectionsApi = {
  list: () =>
    apiClient.get(
      ENDPOINTS.COLLECTIONS.ALL,
      schemas.CollectionListItemSchema.array().transform((collections) => ({
        collections,
      })),
    ),

  get: (id: string) =>
    apiClient.get(
      ENDPOINTS.COLLECTIONS.DETAIL(id),
      schemas.CollectionDetailResponseSchema,
    ),

  create: (data: { name: string; description?: string; goal?: string }) =>
    apiClient.post(
      ENDPOINTS.COLLECTIONS.ALL,
      data,
      schemas.CollectionDetailResponseSchema,
    ),

  update: (
    id: string,
    data: { name?: string; description?: string; goal?: string },
  ) =>
    apiClient.put(
      ENDPOINTS.COLLECTIONS.DETAIL(id),
      data,
      schemas.CollectionDetailResponseSchema,
    ),

  delete: (id: string) =>
    apiClient.delete(ENDPOINTS.COLLECTIONS.DETAIL(id), {}, z.void()),

  addItem: (
    collectionId: string,
    data: { documentId: string; order?: number; prerequisiteId?: string },
  ) =>
    apiClient.post(ENDPOINTS.COLLECTIONS.ITEMS(collectionId), data, z.void()),

  removeItem: (collectionId: string, documentId: string) =>
    apiClient.delete(
      ENDPOINTS.COLLECTIONS.REMOVE_ITEM(collectionId, documentId),
      {},
      z.void(),
    ),

  reorderItems: (collectionId: string, itemIds: string[]) =>
    apiClient.post(
      ENDPOINTS.COLLECTIONS.REORDER(collectionId),
      { itemIds },
      z.void(),
    ),
};
