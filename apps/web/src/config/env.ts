import { webEnvSchema } from "@repo/config/schemas";

export const env = webEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env["NEXT_PUBLIC_API_URL"],
});
