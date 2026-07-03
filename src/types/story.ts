/**
 * Storymaps types.
 *
 * Phase 1: schema-level support only. These types describe the JSON shape
 * accepted by ConfigurationSchema.stories[]. Read-only rendering and any
 * cross-reference validation live in Phase 2.
 */

export type StoryPanelKey = 'layers' | 'legend' | 'constraints' | 'info';

export interface StoryViewportZoom {
  zoom: number;
  center: [number, number]; // [longitude, latitude]
  duration?: number; // ms
}

export interface StoryViewportFit {
  fitLayer: string;
}

export type StoryViewport = StoryViewportZoom | StoryViewportFit;

export interface StoryConstraintSelection {
  label: string;
  // Continuous / combined selection
  lower?: number;
  upper?: number;
  // Categorical selection — may be numeric codes or string keys
  values?: Array<string | number>;
}

export interface StoryStepControl {
  layer: string;
  opacity?: number; // 0..1
  blend?: boolean;
  constraints?: StoryConstraintSelection[];
}

export interface StoryStepLayers {
  active: string[];
}

export interface StoryStep {
  id: string;
  title: string;
  description?: string;
  focusLayer?: string;
  expandPanels?: StoryPanelKey[];
  layers: StoryStepLayers;
  viewport: StoryViewport;
  controls?: StoryStepControl[];
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  steps: StoryStep[];
}
