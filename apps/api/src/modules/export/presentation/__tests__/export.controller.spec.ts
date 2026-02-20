import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ExportController } from '../export.controller.js';
import { ExportMarkdownUseCase } from '../../application/export-markdown.use-case.js';
import { ExportNotionUseCase } from '../../application/export-notion.use-case.js';
import { ConfigService } from '@nestjs/config';

describe('ExportController (e2e)', () => {
  let app: INestApplication<Server>;

  const mockExportMarkdown = { execute: jest.fn() };
  const mockExportNotion = { execute: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue(null) };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        { provide: ExportMarkdownUseCase, useValue: mockExportMarkdown },
        { provide: ExportNotionUseCase, useValue: mockExportNotion },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('POST /export/markdown', () => {
    it('should return 201 with markdown content', async () => {
      mockExportMarkdown.execute.mockResolvedValue('# Test Content');
      const response = await request(app.getHttpServer())
        .post('/export/markdown')
        .send({ chunkIds: ['chunk-1', 'chunk-2'] });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ markdown: '# Test Content' });
    });

    it('should return 400 when chunkIds is not an array', async () => {
      const response = await request(app.getHttpServer())
        .post('/export/markdown')
        .send({ chunkIds: 'not-an-array' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when chunkIds is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/export/markdown')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /export/notion', () => {
    it('should return 201 for valid notion export', async () => {
      mockExportNotion.execute.mockResolvedValue({ id: 'notion-page-id' });
      const response = await request(app.getHttpServer())
        .post('/export/notion')
        .send({ chunkIds: ['chunk-1'] });

      expect(response.status).toBe(201);
      expect(response.body.payload).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when use case fails', async () => {
      mockExportMarkdown.execute.mockRejectedValue(new Error('Export failed'));
      const response = await request(app.getHttpServer())
        .post('/export/markdown')
        .send({ chunkIds: ['chunk-1'] });

      expect(response.status).toBe(500);
    });
  });
});
