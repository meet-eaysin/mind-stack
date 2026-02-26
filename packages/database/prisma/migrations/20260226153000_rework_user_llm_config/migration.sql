-- AlterTable
ALTER TABLE "user_llm_configs"
  ADD COLUMN "provider" TEXT,
  ADD COLUMN "model" TEXT,
  ADD COLUMN "base_url" TEXT,
  ADD COLUMN "encrypted_api_key" TEXT,
  ADD COLUMN "enabled_capabilities" TEXT[] NOT NULL DEFAULT ARRAY['CHAT', 'EMBEDDING']::TEXT[];

UPDATE "user_llm_configs"
SET
  "provider" = "generation_provider",
  "model" = "generation_model";

ALTER TABLE "user_llm_configs"
  ALTER COLUMN "provider" SET NOT NULL,
  ALTER COLUMN "model" SET NOT NULL;

ALTER TABLE "user_llm_configs"
  DROP COLUMN "embedding_provider",
  DROP COLUMN "embedding_model",
  DROP COLUMN "generation_provider",
  DROP COLUMN "generation_model";
