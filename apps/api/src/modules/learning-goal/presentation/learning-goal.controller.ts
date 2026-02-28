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
import { CreateLearningGoalUseCase } from '@/modules/learning-goal/application/create-learning-goal.use-case';
import { ListLearningGoalsUseCase } from '@/modules/learning-goal/application/list-learning-goals.use-case';
import { GetLearningGoalUseCase } from '@/modules/learning-goal/application/get-learning-goal.use-case';
import { UpdateLearningGoalUseCase } from '@/modules/learning-goal/application/update-learning-goal.use-case';
import { DeleteLearningGoalUseCase } from '@/modules/learning-goal/application/delete-learning-goal.use-case';
import { AddItemToLearningGoalUseCase } from '@/modules/learning-goal/application/add-item-to-learning-goal.use-case';
import { RemoveItemFromLearningGoalUseCase } from '@/modules/learning-goal/application/remove-item-from-learning-goal.use-case';
import {
  CreateLearningGoalDto,
  UpdateLearningGoalDto,
  AddItemToGoalDto,
} from '@/modules/learning-goal/presentation/learning-goal.dtos';

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
