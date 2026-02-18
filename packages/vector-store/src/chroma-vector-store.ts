import { ChromaClient } from "chromadb";
import type { Collection } from "chromadb";
import { createLogger } from "@repo/logger";
import type {
  VectorStore,
  VectorDocument,
  VectorSearchResult,
  VectorSearchOptions,
} from "./vector-store.interface.js";

export class ChromaVectorStore implements VectorStore {
  private readonly logger = createLogger("ChromaVectorStore");
  private readonly client: ChromaClient;
  private readonly collectionName: string;
  private collection: Collection | undefined;

  constructor(chromaUrl: string, collectionName: string) {
    this.client = new ChromaClient({ path: chromaUrl });
    this.collectionName = collectionName;
  }

  private async getCollection(): Promise<Collection> {
    if (!this.collection) {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { "hnsw:space": "cosine" },
      });
    }
    return this.collection;
  }

  async upsert(documents: VectorDocument[]): Promise<void> {
    if (documents.length === 0) return;

    const collection = await this.getCollection();

    const BATCH_SIZE = 100;
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      await collection.upsert({
        ids: batch.map((d) => d.id),
        embeddings: batch.map((d) => d.embedding),
        metadatas: batch.map((d) => d.metadata),
        documents: batch.map((d) => d.content),
      });
    }

    this.logger.debug("Upserted documents to vector store", {
      count: documents.length,
    });
  }

  async query(
    embedding: number[],
    options: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    const collection = await this.getCollection();

    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: options.topK,
      ...(options.filter ? { where: options.filter } : {}),
    });

    const ids = results.ids[0] ?? [];
    const distances = results.distances?.[0] ?? [];
    const metadatas = results.metadatas?.[0] ?? [];
    const documents = results.documents?.[0] ?? [];

    const searchResults: VectorSearchResult[] = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const distance = distances[i];
      const metadata = metadatas[i];
      const content = documents[i];

      if (id === undefined || distance === undefined) continue;

      const score = 1 - distance;

      if (options.minScore !== undefined && score < options.minScore) continue;

      searchResults.push({
        id,
        score,
        metadata: (metadata ?? {}) as Record<string, string | number | boolean>,
        content: content ?? "",
      });
    }

    return searchResults;
  }

  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const collection = await this.getCollection();
    await collection.delete({ ids });
    this.logger.debug("Deleted documents from vector store", {
      count: ids.length,
    });
  }

  async count(): Promise<number> {
    const collection = await this.getCollection();
    return collection.count();
  }
}
