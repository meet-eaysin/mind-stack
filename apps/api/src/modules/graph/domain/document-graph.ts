import { RELATION_TYPE, type RelationType } from '@repo/shared-types';

export const ROOT_LABEL = 'user brain';
export const ROOT_NODE_ID = 'root';
const DOCUMENT_NODE_PREFIX = 'doc:';

export const DOCUMENT_RELATION_TYPES: RelationType[] = [
  RELATION_TYPE.IS_PART_OF,
  RELATION_TYPE.IS_PREREQUISITE_OF,
  RELATION_TYPE.REFERENCES,
  RELATION_TYPE.EXTENDS,
  RELATION_TYPE.CONTRADICTS,
  RELATION_TYPE.SIMILAR_TO,
  RELATION_TYPE.FOLLOW_UP_TO,
];

export const HIERARCHY_RELATION_TYPES: RelationType[] = [
  RELATION_TYPE.IS_PART_OF,
  RELATION_TYPE.IS_PREREQUISITE_OF,
];

export const toDocumentNodeLabel = (documentId: string): string =>
  `${DOCUMENT_NODE_PREFIX}${documentId}`;

export const parseDocumentIdFromLabel = (label: string): string | null => {
  if (!label.startsWith(DOCUMENT_NODE_PREFIX)) return null;
  const id = label.slice(DOCUMENT_NODE_PREFIX.length).trim();
  return id.length > 0 ? id : null;
};

export const isRootLabel = (label: string): boolean => label === ROOT_LABEL;
