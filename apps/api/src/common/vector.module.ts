import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChromaVectorStore } from '@repo/vector-store';
import { EMBEDDING_PROVIDER, VECTOR_STORE } from './tokens.js';
import { QueryModule } from '../modules/query/presentation/query.module.js';
import type { EmbeddingProvider } from '@repo/embeddings';

@Global()
@Module({
  imports: [ConfigModule, forwardRef(() => QueryModule)],
  providers: [
    {
      provide: VECTOR_STORE,
      useFactory: (config: ConfigService, embedding: EmbeddingProvider) => {
        return new ChromaVectorStore(
          config.getOrThrow('CHROMA_URL'),
          config.getOrThrow('CHROMA_COLLECTION'),
          {
            generate: async (texts: string[]) => {
              const results = await embedding.embedBatch(texts);
              return results.map((r) => r.embedding);
            },
          },
        );
      },
      inject: [ConfigService, EMBEDDING_PROVIDER],
    },
  ],
  exports: [VECTOR_STORE],
})
export class VectorModule {}
