import { type RelationType } from '@repo/shared-types';

export type ExtractedConcept = {
  label: string;
  relations: Array<{
    target: string;
    type: RelationType;
  }>;
};
