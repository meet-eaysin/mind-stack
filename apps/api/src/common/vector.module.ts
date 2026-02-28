import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChromaVectorStore } from '@repo/vector-store';
import { VECTOR_STORE } from '@/common/tokens';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: VECTOR_STORE,
      useFactory: (config: ConfigService) => {
        return new ChromaVectorStore(
          config.getOrThrow('CHROMA_URL'),
          config.getOrThrow('CHROMA_COLLECTION'),
        );
      },
      inject: [ConfigService],
    },
  ],
  exports: [VECTOR_STORE],
})
export class VectorModule {}
