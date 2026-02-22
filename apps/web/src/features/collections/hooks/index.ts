import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionsApi } from "../api";
import { QUERY_KEYS } from "@/constants/query-keys";
import type {
  CollectionListResponse,
  CollectionDetailResponse,
} from "../types";
import type { ApiError } from "@/lib/api-client";

export function useCollections() {
  return useQuery<CollectionListResponse, ApiError>({
    queryKey: QUERY_KEYS.COLLECTIONS.LIST,
    queryFn: () => collectionsApi.list(),
  });
}

export function useCollection(id: string) {
  return useQuery<CollectionDetailResponse, ApiError>({
    queryKey: QUERY_KEYS.COLLECTIONS.DETAIL(id),
    queryFn: () => collectionsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; goal?: string }) =>
      collectionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COLLECTIONS.LIST });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string;
      goal?: string;
    }) => collectionsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COLLECTIONS.LIST });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COLLECTIONS.DETAIL(variables.id),
      });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => collectionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COLLECTIONS.LIST });
    },
  });
}

export function useAddDocumentToCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionId,
      ...data
    }: {
      collectionId: string;
      documentId: string;
      order?: number;
      prerequisiteId?: string;
    }) => collectionsApi.addItem(collectionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COLLECTIONS.DETAIL(variables.collectionId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COLLECTIONS.LIST });
    },
  });
}

export function useRemoveDocumentFromCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionId,
      documentId,
    }: {
      collectionId: string;
      documentId: string;
    }) => collectionsApi.removeItem(collectionId, documentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COLLECTIONS.DETAIL(variables.collectionId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COLLECTIONS.LIST });
    },
  });
}

export function useReorderCollectionItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionId,
      itemIds,
    }: {
      collectionId: string;
      itemIds: string[];
    }) => collectionsApi.reorderItems(collectionId, itemIds),
    onMutate: async ({ collectionId, itemIds }) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.COLLECTIONS.DETAIL(collectionId),
      });
      const previousCollection =
        queryClient.getQueryData<CollectionDetailResponse>(
          QUERY_KEYS.COLLECTIONS.DETAIL(collectionId),
        );

      if (previousCollection) {
        // Optimistically update the items order
        const reorderedItems = [...previousCollection.items].sort((a, b) => {
          const aIndex = itemIds.indexOf(a.id);
          const bIndex = itemIds.indexOf(b.id);
          return aIndex - bIndex;
        });

        queryClient.setQueryData(QUERY_KEYS.COLLECTIONS.DETAIL(collectionId), {
          ...previousCollection,
          items: reorderedItems,
        });
      }

      return { previousCollection };
    },
    onError: (_err, variables, context) => {
      if (context?.previousCollection) {
        queryClient.setQueryData(
          QUERY_KEYS.COLLECTIONS.DETAIL(variables.collectionId),
          context.previousCollection,
        );
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COLLECTIONS.DETAIL(variables.collectionId),
      });
    },
  });
}
