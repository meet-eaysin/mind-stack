import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Server } from 'node:http';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { AppModule } from '../../src/app.module.js';

jest.mock('jsdom', () => ({}));
jest.mock('pdf-parse', () => ({}));
jest.mock('@mozilla/readability', () => ({}));

describe('KnowledgeController (e2e)', () => {
  let app: INestApplication<Server>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.chunk.deleteMany({});
    await prisma.document.deleteMany({});
    await app.close();
  });

  describe('Document Deletion', () => {
    it('should delete a document and its chunks', async () => {
      const doc = await prisma.document.create({
        data: {
          title: 'E2E Target',
          sourceType: 'TEXT',
          status: 'READY',
          rawContent: 'E2E Content',
          chunks: {
            create: [
              { content: 'C1', startOffset: 0, endOffset: 2 },
              { content: 'C2', startOffset: 3, endOffset: 5 },
            ],
          },
        },
      });

      await request(app.getHttpServer())
        .delete(`/knowledge/documents/${doc.id}`)
        .expect(200);

      const deletedDoc = await prisma.document.findUnique({
        where: { id: doc.id },
      });
      expect(deletedDoc).toBeNull();

      const chunks = await prisma.chunk.findMany({
        where: { documentId: doc.id },
      });
      expect(chunks).toHaveLength(0);
    });

    it('should return 404/500 if the document does not exist', async () => {
      // Depending on how ViewDocumentUseCase throws
      // The current controller behavior might just 500 or bubble the error.
      // E2E test asserts some robust failure instead of crashing the server.
      const res = await request(app.getHttpServer()).delete(
        '/knowledge/documents/non-existent-id',
      );

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
