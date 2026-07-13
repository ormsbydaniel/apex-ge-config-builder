/**
 * Storymaps types — v2 shape.
 *
 * Phase 2: the editor is fully migrated to v2. `StoryStep`, `StoryViewport`
 * and `Story.steps` now default to the v2 shape. Legacy interfaces are
 * retained for the upgrader / tests only and are marked `@deprecated`.
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
  duration?: number; // ms
}

export interface StoryViewportExtent {
  extent: [number, number, number, number]; // [minX, minY, maxX, maxY]
  projection?: string; // default 'EPSG:4326'
  maxZoom?: number;
  duration?: number;
}

/** All three v2 viewport modes. */
export type StoryViewport =
  | StoryViewportZoom
  | StoryViewportFit
  | StoryViewportExtent;

/** @deprecated Alias kept for legacy callers. Use {@link StoryViewport}. */
export type StoryViewportV2 = StoryViewport;

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

export interface StoryStepV2 {
  id: string;
  content?: StoryStepContent;
  viewport: StoryViewport;
  activeLayers: StoryActiveLayer[];
  panelState?: StoryPanelState;
  /** When set, auto-advance to the next step after this many ms. */
  autoAdvance?: number;
}

/** The editor and all runtime code now use the v2 shape. */
export type StoryStep = StoryStepV2;

// ============================================================================
// Legacy step shape (v1) — retained for the upgrader and back-compat tests
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
 * @deprecated Legacy step shape. Use {@link StoryStepV2}. Retained only so
 * the upgrader and dual-shape validator continue to compile.
 */
export interface StoryStepLegacy {
  id: string;
  title: string;
  description?: string;
  focusLayer?: string;
  expandPanels?: StoryPanelKey[];
  layers: StoryStepLayers;
  viewport: StoryViewportZoom | StoryViewportFit;
  controls?: StoryStepControl[];
}

/** Union used by validators / loaders that must accept both shapes. */
export type StoryStepAny = StoryStepLegacy | StoryStepV2;

// ============================================================================
// Story
// ============================================================================

export interface Story {
  id: string;
  title: string;
  /** URL for the `/stories` browser card. */
  thumbnail?: string;
  description?: string;
  isActive?: boolean;
  steps: StoryStepV2[];
}

/** @deprecated Alias kept for legacy imports. Use {@link Story}. */
export type StoryV2 = Story;
