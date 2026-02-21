import { z } from 'zod';
import { RELATION_TYPE, type RelationType } from '@repo/shared-types';

export const RawRelationSchema = z.object({
  target: z.string().optional(),
  type: z.string().optional(),
});

interface RawRelation {
  target?: string;
  type?: string;
}

interface RawLLMOutput {
  label?: string | Record<string, string>;
  relations?: Array<RawRelation | string>;
  relation?: Array<RawRelation | string>;
  relation_type?: Array<RawRelation | string>;
}

export const ExtractedConceptSchema = z
  .object({
    label: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
    relations: z
      .union([z.array(RawRelationSchema), z.array(z.string())])
      .optional(),
    relation: z
      .union([z.array(RawRelationSchema), z.array(z.string())])
      .optional(),
    relation_type: z
      .union([z.array(RawRelationSchema), z.array(z.string())])
      .optional(),
  })
  .transform((data) => {
    // Determine label safely without using unknown/any
    const rawData = data as RawLLMOutput;
    let label = 'Unknown';

    if (typeof rawData.label === 'string') {
      label = rawData.label;
    } else if (rawData.label && typeof rawData.label === 'object') {
      const obj = rawData.label as Record<string, string>;
      label = obj['label'] || obj['name'] || 'Unknown';
    }

    const rawRelations =
      rawData.relations || rawData.relation || rawData.relation_type || [];

    const relations: RawRelation[] = rawRelations.map((rel) => {
      if (typeof rel === 'string') {
        return { target: 'Unknown', type: rel };
      }
      return {
        target: rel.target || 'Unknown',
        type: rel.type || '',
      };
    });

    return {
      label,
      relations: relations
        .map((rel) => ({
          target: String(rel.target),
          type: String(rel.type).toUpperCase() as RelationType,
        }))
        .filter((rel) =>
          [
            RELATION_TYPE.RELATES_TO,
            RELATION_TYPE.IS_PART_OF,
            RELATION_TYPE.DEPENDS_ON,
            RELATION_TYPE.SIMILAR_TO,
            RELATION_TYPE.LEADS_TO,
          ].includes(rel.type),
        ),
    };
  });

export const ExtractedConceptsSchema = z.array(ExtractedConceptSchema);
