import * as dotenv from "dotenv";
import * as path from "path";
import {
  serverEnvSchema,
  webEnvSchema,
  runtimeEnvSchema,
  type ServerEnv,
  type WebEnv,
  type RuntimeEnv,
} from "./schemas";
export type AppConfig = ServerEnv;

let cachedConfig: AppConfig | undefined;
let cachedWebConfig: WebEnv | undefined;
let cachedRuntimeEnv: RuntimeEnv | undefined;

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

export function loadWebConfig(): WebEnv {
  if (cachedWebConfig) {
    return cachedWebConfig;
  }

  const parsed = webEnvSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env["NEXT_PUBLIC_API_URL"],
  });

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${(errors ?? []).join(", ")}`)
      .join("\n");
    throw new Error(`Invalid web environment variables:\n${message}`);
  }

  cachedWebConfig = parsed.data;
  return cachedWebConfig;
}

export function loadRuntimeEnv(): RuntimeEnv {
  if (cachedRuntimeEnv) {
    return cachedRuntimeEnv;
  }

  const parsed = runtimeEnvSchema.safeParse({
    NODE_ENV: process.env["NODE_ENV"],
  });

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${(errors ?? []).join(", ")}`)
      .join("\n");
    throw new Error(`Invalid runtime environment variables:\n${message}`);
  }

  cachedRuntimeEnv = parsed.data;
  return cachedRuntimeEnv;
}

export { serverEnvSchema, webEnvSchema, runtimeEnvSchema } from "./schemas";
export type { ServerEnv, WebEnv, RuntimeEnv } from "./schemas";
export { encryptSecret, decryptSecret } from "./secret-crypto";
