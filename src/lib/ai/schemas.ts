import { z } from 'zod';

export const AIDesignPatchSchema = z.object({
  rationale: z.string().min(1),
  templateId: z.string().optional(),
  pageSize: z.enum(['A4', 'LETTER']).optional(),
  style: z
    .object({
      fontFamily: z.string().optional(),
      headingFontFamily: z.string().optional(),
      fontSizePt: z.number().min(8.5).max(12.5).optional(),
      lineHeight: z.number().min(1.1).max(1.75).optional(),
      accentColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
      density: z.enum(['compact', 'standard', 'spacious']).optional(),
      marginMm: z.number().min(8).max(26).optional(),
      sectionSpacingPx: z.number().min(6).max(28).optional(),
    })
    .optional(),
  sectionOrder: z.array(z.string()).optional(),
  sectionVisibility: z.record(z.string(), z.boolean()).optional(),
  sectionTitles: z.record(z.string(), z.string()).optional(),
  contentUpdates: z
    .object({
      headline: z.string().optional(),
      summary: z.string().optional(),
      skillsToAdd: z
        .array(
          z.object({
            category: z.string(),
            items: z.array(z.string()),
          })
        )
        .optional(),
      rewrittenBullets: z
        .array(
          z.object({
            section: z.enum(['experience', 'projects']),
            itemId: z.string(),
            bullets: z.array(z.string()),
          })
        )
        .optional(),
    })
    .optional(),
});

export type AIDesignPatch = z.infer<typeof AIDesignPatchSchema>;

export const AIRewriteResponseSchema = z.object({
  bullets: z.array(z.string().min(1)).min(1),
});

export const AISummaryResponseSchema = z.object({
  summary: z.string().min(10),
});

export const AISkillsResponseSchema = z.object({
  groups: z.array(
    z.object({
      category: z.string().min(1),
      items: z.array(z.string().min(1)).min(1),
    })
  ),
});
