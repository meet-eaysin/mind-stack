import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateCollectionUseCase } from '../application/create-collection.use-case.js';
import { ListCollectionsUseCase } from '../application/list-collections.use-case.js';
import { GetCollectionUseCase } from '../application/get-collection.use-case.js';
import { UpdateCollectionUseCase } from '../application/update-collection.use-case.js';
import { DeleteCollectionUseCase } from '../application/delete-collection.use-case.js';
import { AddDocumentToCollectionUseCase } from '../application/add-document-to-collection.use-case.js';
import { RemoveDocumentFromCollectionUseCase } from '../application/remove-document-from-collection.use-case.js';
import { ReorderCollectionItemsUseCase } from '../application/reorder-collection-items.use-case.js';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddDocumentToCollectionDto,
  ReorderCollectionItemsDto,
} from './collection.dtos.js';

@Controller('collections')
export class CollectionController {
  constructor(
    private readonly createCollection: CreateCollectionUseCase,
    private readonly listCollections: ListCollectionsUseCase,
    private readonly getCollection: GetCollectionUseCase,
    private readonly updateCollection: UpdateCollectionUseCase,
    private readonly deleteCollection: DeleteCollectionUseCase,
    private readonly addDocument: AddDocumentToCollectionUseCase,
    private readonly removeDocument: RemoveDocumentFromCollectionUseCase,
    private readonly reorderItems: ReorderCollectionItemsUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateCollectionDto) {
    return this.createCollection.execute(dto);
  }

  @Get()
  async list() {
    return this.listCollections.execute();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.getCollection.execute(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.updateCollection.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.deleteCollection.execute(id);
  }

  @Post(':id/items')
  async addItem(
    @Param('id') collectionId: string,
    @Body() dto: AddDocumentToCollectionDto,
  ) {
    await this.addDocument.execute({
      collectionId,
      ...dto,
    });
  }

  @Delete(':id/items/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItem(
    @Param('id') collectionId: string,
    @Param('documentId') documentId: string,
  ) {
    await this.removeDocument.execute(collectionId, documentId);
  }

  @Post(':id/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorder(
    @Param('id') collectionId: string,
    @Body() dto: ReorderCollectionItemsDto,
  ) {
    await this.reorderItems.execute(collectionId, dto.itemIds);
  }
}
