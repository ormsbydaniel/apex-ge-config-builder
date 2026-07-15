import { z } from 'zod';

/**
 * Storymaps schemas.
 *
 * v2 (current target — see `STORY_SCHEMA_1.md`) introduces `content`,
 * `activeLayers`, `panelState`, `autoAdvance`, viewport `extent` mode, per
 * active-layer `date`, and story `thumbnail`.
 *
 * The exported `StorySchema` accepts BOTH the legacy v1 shape and the new v2
 * shape so existing configs keep loading while the editor is migrated
 * (phase 2). Cross-reference validation against sources/constraints lives in
 * `src/utils/storyValidation.ts`.
 */

// Panel identifiers are defined by the viewer, not the builder.
const StoryPanelKeySchema = z.string();

// ============================================================================
// Shared
// ============================================================================

export const StoryConstraintSelectionSchema = z
  .object({
    label: z.string().min(1),
    lower: z.number().optional(),
    upper: z.number().optional(),
    values: z.array(z.union([z.string(), z.number()])).optional(),
    // bandIndex is explicitly rejected in v2 story selections.
    bandIndex: z.never().optional(),
  })
  .refine(
    (v) =>
      (v.lower !== undefined && v.upper !== undefined) ||
      (v.values !== undefined && v.values.length > 0),
    {
      message:
        'Constraint selection must have either both lower and upper (continuous) or a non-empty values array (categorical/combined)',
    },
  );

// ============================================================================
// Viewport — three modes
// ============================================================================

const StoryViewportZoomSchema = z.object({
  zoom: z.number().min(0).max(28),
  center: z.tuple([z.number(), z.number()]),
  duration: z.number().int().nonnegative().optional(),
});

const StoryViewportFitSchema = z.object({
  fitLayer: z.string().min(1),
  duration: z.number().int().nonnegative().optional(),
});

const StoryViewportExtentSchema = z.object({
  extent: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  projection: z.string().optional(),
  maxZoom: z.number().optional(),
  duration: z.number().int().nonnegative().optional(),
});

export const StoryViewportSchema = z.union([
  StoryViewportExtentSchema,
  StoryViewportFitSchema,
  StoryViewportZoomSchema,
]);

// ============================================================================
// v2 step
// ============================================================================

const StoryStepContentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

const StoryActiveLayerDateSchema = z.union([z.number(), z.string()]);

export const StoryActiveLayerSchema = z.object({
  id: z.string().min(1),
  opacity: z.number().min(0).max(1).optional(),
  blend: z.boolean().optional(),
  date: StoryActiveLayerDateSchema.optional(),
  constraints: z.array(StoryConstraintSelectionSchema).optional(),
});

const StoryPanelControlStateSchema = z.object({
  expanded: z.boolean().optional(),
  disabled: z.boolean().optional(),
});

const StoryPanelControlsSchema = z.object({
  temporal: StoryPanelControlStateSchema.optional(),
  styles: StoryPanelControlStateSchema.optional(),
  filters: StoryPanelControlStateSchema.optional(),
});

const StoryPanelTabIdSchema = z.enum([
  'overview',
  'statistics',
  'query',
  'charts',
  'parameters',
]);

const StoryPanelTabSchema = z.object({
  id: StoryPanelTabIdSchema,
  activeChart: z.string().optional(),
});

export const StoryPanelStateSchema = z.object({
  focusLayer: z.string().optional(),
  controls: StoryPanelControlsSchema.optional(),
  tab: StoryPanelTabSchema.optional(),
});

export const StoryStepV2Schema = z.object({
  id: z.string().min(1),
  content: StoryStepContentSchema.optional(),
  viewport: StoryViewportSchema,
  // Empty arrays are valid — intro / text-only steps may have no active layers.
  activeLayers: z.array(StoryActiveLayerSchema),
  panelState: StoryPanelStateSchema.optional(),
  autoAdvance: z.number().int().nonnegative().optional(),
});

// ============================================================================
// Legacy v1 step (kept while the editor still produces this shape)
// ============================================================================

const StoryStepControlSchema = z.object({
  layer: z.string().min(1),
  opacity: z.number().min(0).max(1).optional(),
  blend: z.boolean().optional(),
  constraints: z.array(StoryConstraintSelectionSchema).optional(),
});

const StoryStepLayersSchema = z.object({
  active: z.array(z.string()),
});

/** @deprecated Legacy step schema — accepted for backwards compatibility. */
export const StoryStepLegacySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  focusLayer: z.string().optional(),
  expandPanels: z.array(StoryPanelKeySchema).optional(),
  layers: StoryStepLayersSchema,
  viewport: StoryViewportSchema,
  controls: z.array(StoryStepControlSchema).optional(),
});

/**
 * A step that discriminates on shape: v2 steps have `activeLayers`, legacy
 * steps have `layers.active`.
 */
export const StoryStepSchema = z.union([StoryStepV2Schema, StoryStepLegacySchema]);

// Legacy schema aliases (kept for downstream imports).
export { StoryStepControlSchema };

// ============================================================================
// Story
// ============================================================================

export const StorySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  thumbnail: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  steps: z.array(StoryStepSchema).min(1),
});

export type ValidatedStory = z.infer<typeof StorySchema>;
