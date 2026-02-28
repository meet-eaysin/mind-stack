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
import { CreateCollectionUseCase } from '@/modules/collection/application/create-collection.use-case';
import { ListCollectionsUseCase } from '@/modules/collection/application/list-collections.use-case';
import { GetCollectionUseCase } from '@/modules/collection/application/get-collection.use-case';
import { UpdateCollectionUseCase } from '@/modules/collection/application/update-collection.use-case';
import { DeleteCollectionUseCase } from '@/modules/collection/application/delete-collection.use-case';
import { AddDocumentToCollectionUseCase } from '@/modules/collection/application/add-document-to-collection.use-case';
import { RemoveDocumentFromCollectionUseCase } from '@/modules/collection/application/remove-document-from-collection.use-case';
import { ReorderCollectionItemsUseCase } from '@/modules/collection/application/reorder-collection-items.use-case';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  AddDocumentToCollectionDto,
  ReorderCollectionItemsDto,
} from '@/modules/collection/presentation/collection.dtos';

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
