export class DeleteLlmConfigUseCase {
  constructor(
    private readonly repository: {
      deleteByUserId(userId: string): Promise<void>;
    },
  ) {}

  async execute(userId: string): Promise<void> {
    await this.repository.deleteByUserId(userId);
  }
}
