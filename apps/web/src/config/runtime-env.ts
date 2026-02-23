import { z } from "zod";

const runtimeEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const runtimeEnv = runtimeEnvSchema.parse({
  NODE_ENV: process.env["NODE_ENV"],
});
