import { DeleteLlmConfigUseCase } from '../delete-llm-config.use-case.js';

class FakeLlmConfigRepository {
  public deletedUserIds: string[] = [];

  async deleteByUserId(userId: string): Promise<void> {
    this.deletedUserIds.push(userId);
  }
}

describe('DeleteLlmConfigUseCase', () => {
  it('deletes user configuration by userId', async () => {
    const repository = new FakeLlmConfigRepository();
    const useCase = new DeleteLlmConfigUseCase(repository);

    await useCase.execute('u-1');

    expect(repository.deletedUserIds).toEqual(['u-1']);
  });
});
