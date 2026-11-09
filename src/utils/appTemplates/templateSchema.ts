/**
 * Declarative format for community app templates (`wizard.json`).
 * Templates never contain code: data-aware behaviour is chosen by helper name.
 */
import { z } from 'zod';

export const TEMPLATE_FORMAT_VERSION = 1;

export type ValueExpr =
  | { value: unknown }
  | { from: string }
  | { ref: string }
  | { text: string }
  | { map: string; cases: Record<string, unknown>; default?: ValueExpr }
  | { use: string; args?: Record<string, ValueExpr> };

export const ValueExprSchema: z.ZodType<ValueExpr> = z.lazy(() =>
  z.union([
    z.object({ value: z.unknown() }).strict(),
    z.object({ from: z.string() }).strict(),
    z.object({ ref: z.string() }).strict(),
    z.object({ text: z.string() }).strict(),
    z.object({ map: z.string(), cases: z.record(z.unknown()), default: ValueExprSchema.optional() }).strict(),
    z.object({ use: z.string(), args: z.record(ValueExprSchema).optional() }).strict(),
  ]),
) as z.ZodType<ValueExpr>;

const ConditionSchema = z.object({
  field: z.string(),
  in: z.array(z.string()).optional(),
  notIn: z.array(z.string()).optional(),
});
export type Condition = z.infer<typeof ConditionSchema>;

const OptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

const FieldSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  type: z.enum(['choice', 'date', 'text', 'slider']),
  default: z.string(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  unit: z.string().optional(),
  options: z.array(OptionSchema).optional(),
  help: z.string().optional(),
  placeholder: z.string().optional(),
  showIf: z.object({ field: z.string(), in: z.array(z.string()) }).optional(),
  optionsFrom: z.string().optional(),
  rangeFrom: z.string().optional(),
});

const StepSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  fields: z.array(FieldSchema),
});

const HelperCallSchema = z.object({ use: z.string(), args: z.record(ValueExprSchema).optional() });

const PatchSchema = z.union([
  z.object({ set: z.string().startsWith('/'), when: ConditionSchema.optional() }).and(z.record(z.unknown())),
  z.object({ remove: z.string().startsWith('/'), when: ConditionSchema.optional() }),
]);

export const CommunityTemplateSchema = z.object({
  formatVersion: z.number().int().positive(),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'id must be lower-case letters, digits and dashes'),
  name: z.string().min(1),
  tagline: z.string().default(''),
  description: z.string().default(''),
  bestFor: z.array(z.string()).default([]),
  baseConfig: z.string().min(1),
  defaults: z.object({
    title: z.string(),
    center: z.tuple([z.number(), z.number()]),
    zoom: z.number(),
    layoutVariant: z.enum(['fullscreen', 'sidebar']).optional(),
  }),
  steps: z.object({ data: StepSchema, options: StepSchema }),
  computed: z.record(ValueExprSchema).default({}),
  probe: HelperCallSchema.optional(),
  liveCheck: HelperCallSchema.optional(),
  patches: z.array(PatchSchema).min(1),
});

export type CommunityTemplate = z.infer<typeof CommunityTemplateSchema>;
export type TemplatePatch = CommunityTemplate['patches'][number];
