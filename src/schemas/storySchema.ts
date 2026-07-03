import { z } from 'zod';

/**
 * Storymaps schemas (Phase 1).
 *
 * These schemas validate the shape of `stories[]` on a Configuration.
 * They do NOT cross-reference layer names or constraint labels against
 * the surrounding config — that lives in Phase 2.
 */

// Panel identifiers are defined by the viewer, not the builder. Accept any
// string so new panels don't require a schema update here.
const StoryPanelKeySchema = z.string();

const StoryViewportZoomSchema = z.object({
  zoom: z.number().min(0).max(28),
  center: z.tuple([z.number(), z.number()]), // [longitude, latitude]
  duration: z.number().int().nonnegative().optional(),
});

const StoryViewportFitSchema = z.object({
  fitLayer: z.string().min(1),
});

export const StoryViewportSchema = z.union([
  StoryViewportZoomSchema,
  StoryViewportFitSchema,
]);

export const StoryConstraintSelectionSchema = z
  .object({
    label: z.string().min(1),
    lower: z.number().optional(),
    upper: z.number().optional(),
    values: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .refine(
    (v) =>
      (v.lower !== undefined && v.upper !== undefined) ||
      (v.values !== undefined && v.values.length > 0),
    {
      message:
        'Constraint selection must have either both lower and upper (continuous) or a non-empty values array (categorical)',
    },
  );

export const StoryStepControlSchema = z.object({
  layer: z.string().min(1),
  opacity: z.number().min(0).max(1).optional(),
  blend: z.boolean().optional(),
  constraints: z.array(StoryConstraintSelectionSchema).optional(),
});

export const StoryStepLayersSchema = z.object({
  active: z.array(z.string()),
});

export const StoryStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  focusLayer: z.string().optional(),
  expandPanels: z.array(StoryPanelKeySchema).optional(),
  layers: StoryStepLayersSchema,
  viewport: StoryViewportSchema,
  controls: z.array(StoryStepControlSchema).optional(),
});

export const StorySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(StoryStepSchema).min(1),
});

export type ValidatedStory = z.infer<typeof StorySchema>;
