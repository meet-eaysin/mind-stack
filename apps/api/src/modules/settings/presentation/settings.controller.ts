import { Body, Controller, Delete, Get, Headers, Put } from '@nestjs/common';
import { GetLlmConfigUseCase } from '../application/get-llm-config.use-case.js';
import { UpdateLlmConfigUseCase } from '../application/update-llm-config.use-case.js';
import { DeleteLlmConfigUseCase } from '../application/delete-llm-config.use-case.js';
import { ResolveLlmConfigUseCase } from '../application/resolve-llm-config.use-case.js';
import { UpdateLlmConfigDto } from './settings.dtos.js';
import { getUserIdFromHeader } from '../../../common/request-user.js';
import type { UserLlmConfigResponse } from '@repo/shared-types';

type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta: {
    timestamp: string;
  };
};

@Controller('me')
export class SettingsController {
  constructor(
    private readonly getConfig: GetLlmConfigUseCase,
    private readonly updateConfig: UpdateLlmConfigUseCase,
    private readonly deleteConfig: DeleteLlmConfigUseCase,
    private readonly resolveConfig: ResolveLlmConfigUseCase,
  ) {}

  @Get('llm-config')
  async getLlmConfig(
    @Headers('x-user-id') userId?: string,
  ): Promise<ApiSuccessResponse<UserLlmConfigResponse>> {
    const data = await this.getConfig.execute(getUserIdFromHeader(userId));
    return this.wrap(data);
  }

  @Put('llm-config')
  async updateLlmConfig(
    @Body() dto: UpdateLlmConfigDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<ApiSuccessResponse<UserLlmConfigResponse>> {
    const resolvedUserId = getUserIdFromHeader(userId);
    const current = await this.resolveConfig.execute(resolvedUserId);
    const candidateBaseUrl =
      dto.baseUrl ??
      (current.provider === dto.provider ? current.baseUrl : null);
    const resolvedBaseUrl = this.resolveConfig.resolveBaseUrlForProvider(
      dto.provider,
      candidateBaseUrl,
    );

    const data = await this.updateConfig.execute(resolvedUserId, {
      provider: dto.provider,
      model: dto.model,
      baseUrl: resolvedBaseUrl,
      enabledCapabilities: dto.enabledCapabilities,
      ...(dto.apiKey !== undefined ? { apiKey: dto.apiKey } : {}),
    });

    return this.wrap(data);
  }

  @Delete('llm-config')
  async deleteLlmConfig(
    @Headers('x-user-id') userId?: string,
  ): Promise<ApiSuccessResponse<{ deleted: true }>> {
    await this.deleteConfig.execute(getUserIdFromHeader(userId));
    return this.wrap({ deleted: true });
  }

  private wrap<T>(data: T): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
