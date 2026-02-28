import type {
  LearningGoalEntity,
  LearningGoalItemEntity,
} from '@/modules/learning-goal/domain/learning-goal.entity';

export type LearningGoalWithItems = LearningGoalEntity & {
  items: (LearningGoalItemEntity & {
    collectionName?: string | null;
    documentTitle?: string | null;
  })[];
};

export type LearningGoalRepository = {
  save(goal: LearningGoalEntity): Promise<LearningGoalEntity>;
  findById(id: string): Promise<LearningGoalEntity | null>;
  findWithItems(id: string): Promise<LearningGoalWithItems | null>;
  findAll(): Promise<(LearningGoalEntity & { itemCount: number })[]>;
  update(
    id: string,
    data: Partial<LearningGoalEntity>,
  ): Promise<LearningGoalEntity>;
  delete(id: string): Promise<void>;

  addItem(
    item: Omit<LearningGoalItemEntity, 'id'>,
  ): Promise<LearningGoalItemEntity>;
  removeItem(id: string): Promise<void>;
  findItemByGoalAndCollection(
    goalId: string,
    collectionId: string,
  ): Promise<LearningGoalItemEntity | null>;
  findItemByGoalAndDocument(
    goalId: string,
    documentId: string,
  ): Promise<LearningGoalItemEntity | null>;
};
