import { z } from 'zod';
import { RELATION_TYPE, type RelationType } from '@repo/shared-types';

export const RawRelationSchema = z.object({
  target: z.string().optional(),
  type: z.string().optional(),
});

export const ExtractedConceptSchema = z
  .object({
    label: z.string(),
    relations: z.array(RawRelationSchema).optional(),
    relation: z.array(RawRelationSchema).optional(),
  })
  .transform((data) => {
    const rawRelations = data.relations || data.relation || [];
    return {
      label: data.label,
      relations: rawRelations
        .map((rel) => ({
          target: String(rel.target || ''),
          type: String(rel.type || '').toUpperCase() as RelationType,
        }))
        .filter((rel) =>
          [
            RELATION_TYPE.RELATES_TO,
            RELATION_TYPE.IS_PART_OF,
            RELATION_TYPE.DEPENDS_ON,
            RELATION_TYPE.SIMILAR_TO,
            RELATION_TYPE.LEADS_TO,
          ].includes(rel.type as RelationType),
        ),
    };
  });

export const ExtractedConceptsSchema = z.array(ExtractedConceptSchema);
