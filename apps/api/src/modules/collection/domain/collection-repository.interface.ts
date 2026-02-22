import type {
  CollectionEntity,
  CollectionItemEntity,
} from './collection.entity.js';

export type CollectionWithItems = CollectionEntity & {
  items: (CollectionItemEntity & {
    documentTitle: string;
    learningStatus: string;
  })[];
};

export interface CollectionRepository {
  save(collection: CollectionEntity): Promise<CollectionEntity>;
  findById(id: string): Promise<CollectionEntity | null>;
  findWithItems(id: string): Promise<CollectionWithItems | null>;
  findAll(): Promise<
    (CollectionEntity & { itemCount: number; progress: number })[]
  >;
  update(
    id: string,
    data: Partial<CollectionEntity>,
  ): Promise<CollectionEntity>;
  delete(id: string): Promise<void>;

  addItem(
    item: Omit<CollectionItemEntity, 'id'>,
  ): Promise<CollectionItemEntity>;
  removeItem(id: string): Promise<void>;
  updateItemOrder(id: string, order: number): Promise<void>;
  findItemByCollectionAndDocument(
    collectionId: string,
    documentId: string,
  ): Promise<CollectionItemEntity | null>;
}
