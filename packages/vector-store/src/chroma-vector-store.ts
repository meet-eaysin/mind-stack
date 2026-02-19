import { ChromaClient, type Collection, type Metadata } from "chromadb";
import { createLogger } from "@repo/logger";
import {
  type VectorDocument,
  type VectorSearchOptions,
  type VectorSearchResult,
  type VectorStore,
} from "./vector-store.interface.js";

const logger = createLogger("ChromaVectorStore");

export class ChromaVectorStore implements VectorStore {
  private readonly client: ChromaClient;
  private readonly collectionName: string;
  private collection: Collection | null = null;

  constructor(url: string, collectionName: string) {
    this.client = new ChromaClient({ path: url });
    this.collectionName = collectionName;
  }

  private async getCollection(): Promise<Collection> {
    if (this.collection) return this.collection;

    try {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { "hnsw:space": "cosine" },
      });
      return this.collection;
    } catch (error) {
      logger.error("Failed to get Chroma collection", { error });
      throw error;
    }
  }

  async upsert(documents: VectorDocument[]): Promise<void> {
    const col = await this.getCollection();

    await col.upsert({
      ids: documents.map((doc) => doc.id),
      embeddings: documents.map((doc) => doc.embedding),
      metadatas: documents.map((doc) => (doc.metadata ?? {}) as Metadata),
      documents: documents.map((doc) => doc.content),
    });
  }

  async search(
    query: number[],
    options: VectorSearchOptions = { topK: 5 },
  ): Promise<VectorSearchResult[]> {
    const col = await this.getCollection();

    const results = await col.query({
      queryEmbeddings: [query],
      nResults: options.topK ?? 5,
      ...(options.filter ? { where: options.filter } : {}),
    });

    if (!results.ids[0] || !results.documents[0] || !results.metadatas[0]) {
      return [];
    }

    const searchResults: VectorSearchResult[] = [];
    const ids = results.ids[0];
    const docs = results.documents[0];
    const metadatas = results.metadatas[0];
    const distances = results.distances ? results.distances[0] : null;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const doc = docs[i];
      const metadata = metadatas[i];
      const distance = distances ? distances[i] : 0;

      if (
        id !== undefined &&
        doc !== null &&
        doc !== undefined &&
        metadata !== null
      ) {
        searchResults.push({
          id,
          content: doc,
          metadata: metadata as Record<string, string | number | boolean>,
          score: distance !== undefined ? 1 - distance : 0,
        });
      }
    }

    return searchResults;
  }

  async delete(ids: string[]): Promise<void> {
    const col = await this.getCollection();
    await col.delete({ ids });
  }

  async count(): Promise<number> {
    const col = await this.getCollection();
    return col.count();
  }
}
