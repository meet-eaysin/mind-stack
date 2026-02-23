import { z } from "zod";
import * as schemas from "../schemas/settings.schemas";

export type UserLlmConfig = z.infer<typeof schemas.UserLlmConfigSchema>;
export type UpdateUserLlmConfig = z.infer<
  typeof schemas.UpdateUserLlmConfigSchema
>;
export type EmbeddingModelHealth = z.infer<
  typeof schemas.EmbeddingModelHealthSchema
>;
