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
import { CreateLearningGoalUseCase } from '../application/create-learning-goal.use-case.js';
import { ListLearningGoalsUseCase } from '../application/list-learning-goals.use-case.js';
import { GetLearningGoalUseCase } from '../application/get-learning-goal.use-case.js';
import { UpdateLearningGoalUseCase } from '../application/update-learning-goal.use-case.js';
import { DeleteLearningGoalUseCase } from '../application/delete-learning-goal.use-case.js';
import { AddItemToLearningGoalUseCase } from '../application/add-item-to-learning-goal.use-case.js';
import { RemoveItemFromLearningGoalUseCase } from '../application/remove-item-from-learning-goal.use-case.js';
import {
  CreateLearningGoalDto,
  UpdateLearningGoalDto,
  AddItemToGoalDto,
} from './learning-goal.dtos.js';

@Controller('learning-goals')
export class LearningGoalController {
  constructor(
    private readonly createGoal: CreateLearningGoalUseCase,
    private readonly listGoals: ListLearningGoalsUseCase,
    private readonly getGoal: GetLearningGoalUseCase,
    private readonly updateGoal: UpdateLearningGoalUseCase,
    private readonly deleteGoal: DeleteLearningGoalUseCase,
    private readonly addItem: AddItemToLearningGoalUseCase,
    private readonly removeItem: RemoveItemFromLearningGoalUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateLearningGoalDto) {
    return this.createGoal.execute(dto);
  }

  @Get()
  async list() {
    return this.listGoals.execute();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.getGoal.execute(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLearningGoalDto) {
    return this.updateGoal.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.deleteGoal.execute(id);
  }

  @Post(':id/items')
  async addItemToGoal(
    @Param('id') goalId: string,
    @Body() dto: AddItemToGoalDto,
  ) {
    await this.addItem.execute({
      goalId,
      ...dto,
    });
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeItemFromGoal(@Param('itemId') itemId: string) {
    await this.removeItem.execute(itemId);
  }
}
