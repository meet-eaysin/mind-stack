import * as dotenv from "dotenv";
import * as path from "path";
import { serverEnvSchema, type ServerEnv } from "./schemas";
export type AppConfig = ServerEnv;

let cachedConfig: AppConfig | undefined;

export function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Load .env from root (look up to 5 levels)
  let currentDir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const envPath = path.join(currentDir, ".env");
    dotenv.config({ path: envPath });
    currentDir = path.dirname(currentDir);
  }

  const parsed = serverEnvSchema.safeParse(process.env);
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

export { serverEnvSchema, webEnvSchema } from "./schemas";
export type { ServerEnv, WebEnv } from "./schemas";
