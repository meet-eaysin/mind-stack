import { z } from "zod";

export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string(),
  API_PORT: z.coerce.number().default(4000),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OPENAI_BASE_URL: z.string().url().optional(),
  OPENROUTER_BASE_URL: z.string().url().optional(),
  GEMINI_BASE_URL: z.string().url().optional(),
  OLLAMA_MODEL: z.string().min(1),
  OLLAMA_EMBED_MODEL: z.string().min(1),
  CHROMA_URL: z.string().default("http://localhost:8000"),
  CHROMA_COLLECTION: z.string().default("mind-stack"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  API_KEY: z.string().optional(),
  YOUTUBE_COOKIE: z.string().optional(),
  YOUTUBE_PROXY_URL: z.string().url().optional(),
  WEB_URL: z.string().default("http://localhost:3000"),
  API_URL: z.string().default("http://localhost:4000"),
  LLM_CONFIG_ENCRYPTION_KEY: z.string().min(32).optional(),
});

export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000/api/v1"),
});

export const runtimeEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;
