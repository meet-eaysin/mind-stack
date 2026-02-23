import { Controller, Get, Put, Body, Headers } from '@nestjs/common';
import { GetLlmConfigUseCase } from '../application/get-llm-config.use-case.js';
import { UpdateLlmConfigUseCase } from '../application/update-llm-config.use-case.js';
import { UpdateLlmConfigDto } from './settings.dtos.js';
import { getUserIdFromHeader } from '../../../common/request-user.js';
import type { UserLlmConfigResponse } from '@repo/shared-types';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly getConfig: GetLlmConfigUseCase,
    private readonly updateConfig: UpdateLlmConfigUseCase,
  ) {}

  @Get('llm')
  async getLlmConfig(
    @Headers('x-user-id') userId?: string,
  ): Promise<UserLlmConfigResponse> {
    return this.getConfig.execute(getUserIdFromHeader(userId));
  }

  @Put('llm')
  async updateLlmConfig(
    @Body() dto: UpdateLlmConfigDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<UserLlmConfigResponse> {
    return this.updateConfig.execute(getUserIdFromHeader(userId), dto);
  }
}
