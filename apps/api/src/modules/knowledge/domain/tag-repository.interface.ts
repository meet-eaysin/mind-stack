import type { TagEntity } from "./tag.entity.js";

export interface TagRepository {
  findOrCreate(name: string): Promise<TagEntity>;
  addTagToChunk(chunkId: string, tagId: string): Promise<void>;
  removeTagFromChunk(chunkId: string, tagName: string): Promise<void>;
  findByChunkId(chunkId: string): Promise<TagEntity[]>;
}
