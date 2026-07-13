/**
 * Storymaps types.
 *
 * Phase 1 (v2 schema): adds `content`, `activeLayers`, `panelState`,
 * `autoAdvance`, `viewport.extent` mode, `date`, and story `thumbnail`.
 * Legacy interfaces below are kept for the current editor UI and are marked
 * `@deprecated`. They will be removed once the editor is migrated (phase 2).
 */

// ============================================================================
// Shared primitives
// ============================================================================

export type StoryPanelKey = string;

export interface StoryConstraintSelection {
  label: string;
  /** Continuous constraints: minimum (inclusive). */
  lower?: number;
  /** Continuous constraints: maximum (inclusive). */
  upper?: number;
  /**
   * Categorical (numeric codes) or combined (`"min_max"` string keys)
   * allowed values.
   */
  values?: Array<string | number>;
}

// ============================================================================
// Viewport (all modes)
// ============================================================================

export interface StoryViewportZoom {
  zoom: number;
  center: [number, number]; // [longitude, latitude]
  duration?: number; // ms
}

export interface StoryViewportFit {
  fitLayer: string;
  duration?: number; // ms — new in v2
}

/** v2 addition — fit map to an explicit bounding box. */
export interface StoryViewportExtent {
  extent: [number, number, number, number]; // [minX, minY, maxX, maxY]
  projection?: string; // default 'EPSG:4326'
  maxZoom?: number;
  duration?: number;
}

/**
 * The editor currently only reads the two legacy viewport modes. The v2
 * extent mode is accepted by the schema/upgrader but not yet consumed by the
 * UI. Keeping this union limited to the legacy modes preserves editor type
 * safety until phase 2. Full v2 union: {@link StoryViewportV2}.
 */
export type StoryViewport = StoryViewportZoom | StoryViewportFit;

export type StoryViewportV2 =
  | StoryViewportZoom
  | StoryViewportFit
  | StoryViewportExtent;

// ============================================================================
// v2 step shape
// ============================================================================

export interface StoryStepContent {
  title?: string;
  description?: string;
}

/** Temporal selection for an active layer. */
export type StoryActiveLayerDate =
  | number
  | 'earliest'
  | 'latest'
  | string; // ISO or display value

export interface StoryActiveLayer {
  /** Source `id` from `sources[].id`. */
  id: string;
  opacity?: number; // 0..1, default 1
  blend?: boolean; // default false
  date?: StoryActiveLayerDate;
  constraints?: StoryConstraintSelection[];
}

export type StoryPanelTabId =
  | 'overview'
  | 'statistics'
  | 'query'
  | 'charts'
  | 'parameters';

export interface StoryPanelControlState {
  expanded?: boolean;
  disabled?: boolean;
}

export interface StoryPanelControls {
  temporal?: StoryPanelControlState;
  styles?: StoryPanelControlState;
  filters?: StoryPanelControlState;
}

export interface StoryPanelTab {
  id: StoryPanelTabId;
  /** When `id === 'charts'`, the chart `title` to preselect. */
  activeChart?: string;
}

export interface StoryPanelState {
  /** Source id — must appear in `activeLayers`. */
  focusLayer?: string;
  controls?: StoryPanelControls;
  tab?: StoryPanelTab;
}

/** v2 step. Editor still consumes {@link StoryStepLegacy} until phase 2. */
export interface StoryStepV2 {
  id: string;
  content?: StoryStepContent;
  viewport: StoryViewport;
  activeLayers: StoryActiveLayer[];
  panelState?: StoryPanelState;
  /** When set, auto-advance to the next step after this many ms. */
  autoAdvance?: number;
}

// ============================================================================
// Legacy step shape (v1) — still used by the editor
// ============================================================================

/**
 * @deprecated Legacy step layer selection. Superseded by
 * {@link StoryActiveLayer} inside {@link StoryStepV2.activeLayers}.
 */
export interface StoryStepLayers {
  active: string[];
}

/**
 * @deprecated Legacy per-layer control. Merged into {@link StoryActiveLayer}
 * in the v2 schema (opacity/blend/constraints move under the active layer).
 */
export interface StoryStepControl {
  layer: string;
  opacity?: number;
  blend?: boolean;
  constraints?: StoryConstraintSelection[];
}

/**
 * @deprecated Legacy step shape. Use {@link StoryStepV2}. This interface
 * remains only so the current editor keeps compiling until phase 2 rewires
 * it to the v2 structure. See `src/utils/deprecated/storyLegacy/`.
 */
export interface StoryStepLegacy {
  id: string;
  title: string;
  description?: string;
  focusLayer?: string;
  expandPanels?: StoryPanelKey[];
  layers: StoryStepLayers;
  viewport: StoryViewport;
  controls?: StoryStepControl[];
}

/**
 * Backwards-compatible alias — during phase 1 the editor imports `StoryStep`
 * and receives the legacy shape. Phase 2 will flip this to `StoryStepV2`.
 */
export type StoryStep = StoryStepLegacy;

/** Union used by validators / loaders that must accept both shapes. */
export type StoryStepAny = StoryStepLegacy | StoryStepV2;

// ============================================================================
// Story
// ============================================================================

export interface Story {
  id: string;
  title: string;
  /** v2 addition — URL for the `/stories` browser card. */
  thumbnail?: string;
  description?: string;
  isActive?: boolean;
  /**
   * Steps use the legacy shape during phase 1 so the current editor keeps
   * compiling. The Zod schema separately accepts v2 shape via
   * {@link StoryStepAny}; use {@link StoryV2} when consuming validated /
   * upgraded configs.
   */
  steps: StoryStepLegacy[];
}

/** v2 story with upgraded step shape — produced by the legacy upgrader. */
export interface StoryV2 extends Omit<Story, 'steps'> {
  steps: StoryStepV2[];
}

