-- AlterTable
ALTER TABLE "annotations" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "selected_text" TEXT;
