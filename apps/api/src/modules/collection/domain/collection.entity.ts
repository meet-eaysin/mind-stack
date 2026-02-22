export type CollectionEntity = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CollectionItemEntity = {
  id: string;
  collectionId: string;
  documentId: string;
  order: number;
  prerequisiteId: string | null;
};
