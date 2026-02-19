import { z } from "zod";
import * as dotenv from "dotenv";
import * as path from "path";

// ── Environment Schema ──

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string(),
  API_PORT: z.coerce.number().default(4000),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("llama3"),
  OLLAMA_EMBED_MODEL: z.string().default("nomic-embed-text"),
  CHROMA_URL: z.string().default("http://localhost:8000"),
  CHROMA_COLLECTION: z.string().default("mind-stack"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  WEB_URL: z.string().default("http://localhost:3000"),
  API_URL: z.string().default("http://localhost:4000"),
});

export type AppConfig = z.infer<typeof envSchema>;

let cachedConfig: AppConfig | undefined;

export function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Load .env from root
  dotenv.config({ path: path.join(process.cwd(), "../../.env") });
  dotenv.config({ path: path.join(process.cwd(), ".env") }); // Also try local

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${(errors ?? []).join(", ")}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${message}`);
  }
  cachedConfig = parsed.data;
  return cachedConfig;
}

export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return loadConfig()[key];
}
