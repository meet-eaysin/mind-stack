import { z } from "zod";

const loggerEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .optional(),
});

export type LoggerEnv = z.infer<typeof loggerEnvSchema>;

let cachedLoggerEnv: LoggerEnv | undefined;

export function loadLoggerEnv(): LoggerEnv {
  if (cachedLoggerEnv) {
    return cachedLoggerEnv;
  }

  const parsed = loggerEnvSchema.safeParse({
    NODE_ENV: process.env["NODE_ENV"],
    LOG_LEVEL: process.env["LOG_LEVEL"],
  });

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${(errors ?? []).join(", ")}`)
      .join("\n");
    throw new Error(`Invalid logger environment variables:\n${message}`);
  }

  cachedLoggerEnv = parsed.data;
  return cachedLoggerEnv;
}
