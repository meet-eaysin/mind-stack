export const SOURCE_TYPE = {
  URL: "URL",
  TEXT: "TEXT",
  PDF: "PDF",
  YOUTUBE: "YOUTUBE",
} as const;

export type SourceType = (typeof SOURCE_TYPE)[keyof typeof SOURCE_TYPE];

export const INGESTION_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export type IngestionStatus =
  (typeof INGESTION_STATUS)[keyof typeof INGESTION_STATUS];

export const RELATION_TYPE = {
  RELATES_TO: "RELATES_TO",
  IS_PART_OF: "IS_PART_OF",
  DEPENDS_ON: "DEPENDS_ON",
  SIMILAR_TO: "SIMILAR_TO",
  LEADS_TO: "LEADS_TO",
} as const;

export type RelationType =
  (typeof RELATION_TYPE)[keyof typeof RELATION_TYPE];

export const JOB_TYPE = {
  CHUNKING: "CHUNKING",
  EMBEDDING: "EMBEDDING",
  CONCEPT_EXTRACTION: "CONCEPT_EXTRACTION",
  DAILY_REVIEW: "DAILY_REVIEW",
} as const;

export type JobType = (typeof JOB_TYPE)[keyof typeof JOB_TYPE];
