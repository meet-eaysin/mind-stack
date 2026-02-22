export type LearningGoalEntity = {
  id: string;
  name: string;
  deadline: Date | null;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
};

export type LearningGoalItemEntity = {
  id: string;
  goalId: string;
  collectionId: string | null;
  documentId: string | null;
};
