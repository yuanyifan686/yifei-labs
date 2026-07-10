import { z } from "zod";
import { looseNumber } from "@/lib/ai/schemas/coerce";

export const structuredResumeSchema = z.object({
  basics: z
    .object({
      summary: z.string().optional(),
      yearsTotal: looseNumber.optional(),
      locations: z.array(z.string()).optional(),
      links: z.array(z.string()).optional(),
      headline: z.string().optional(),
    })
    .optional()
    .default({}),
  work: z
    .array(
      z.object({
        company: z.string().optional(),
        title: z.string().optional(),
        start: z.string().optional(),
        end: z.string().optional(),
        highlights: z.array(z.string()).optional().default([]),
        tech: z.array(z.string()).optional().default([]),
      }),
    )
    .optional()
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string().optional(),
        degree: z.string().optional(),
        field: z.string().optional(),
        year: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  skills: z
    .array(
      z.object({
        name: z.string(),
        level: z.enum(["basic", "proficient", "expert"]).optional(),
        evidence: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().optional(),
        impact: z.string().optional(),
        tech: z.array(z.string()).optional().default([]),
        metrics: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  awards: z
    .array(
      z.object({
        title: z.string(),
        year: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  certificates: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  profiles: z
    .array(
      z.object({
        network: z.string(),
        url: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export type StructuredResumeRaw = z.infer<typeof structuredResumeSchema>;
