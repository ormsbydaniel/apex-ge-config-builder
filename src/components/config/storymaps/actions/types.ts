import type { StoryStep } from '@/types/config';
import type { StoryWarning } from '@/utils/storyValidation';

export type ActionKind =
  | 'navigation'      // viewport
  | 'activeLayers'    // layers.active[]
  | 'focusLayer'      // focusLayer
  | 'layerControl'    // controls[i] (one per layer)
  | 'expandPanels';   // expandPanels[]

export type ActionCategory = 'Navigation' | 'Layer display' | 'Layer control' | 'UI';

export interface ActionMeta {
  kind: ActionKind;
  category: ActionCategory;
  label: string;
  description: string;
  /** True if only a single instance of this action can exist per step. */
  singleton: boolean;
}

export const ACTION_META: Record<ActionKind, ActionMeta> = {
  navigation: {
    kind: 'navigation',
    category: 'Navigation',
    label: 'Navigation',
    description: 'Move the map to a zoom + centre or fit it to a specific layer.',
    singleton: true,
  },
  activeLayers: {
    kind: 'activeLayers',
    category: 'Layer display',
    label: 'Active layers',
    description: 'Choose which layers are visible during this step.',
    singleton: true,
  },
  focusLayer: {
    kind: 'focusLayer',
    category: 'Layer display',
    label: 'Focus layer',
    description: 'Highlight one layer as the focus of this step.',
    singleton: true,
  },
  layerControl: {
    kind: 'layerControl',
    category: 'Layer control',
    label: 'Layer control',
    description: 'Set opacity, blending, and constraint selections for one layer.',
    singleton: false,
  },
  expandPanels: {
    kind: 'expandPanels',
    category: 'UI',
    label: 'Expand panels',
    description: 'Auto-open specific UI panels when this step is active.',
    singleton: true,
  },
};

export const CATEGORY_ORDER: ActionCategory[] = [
  'Navigation',
  'Layer display',
  'Layer control',
  'UI',
];

/** Which singleton actions are currently present on the step. */
export const hasKind = (step: StoryStep, kind: ActionKind): boolean => {
  switch (kind) {
    case 'navigation':
      return !!step.viewport;
    case 'activeLayers':
      return (step.layers?.active?.length ?? 0) > 0;
    case 'focusLayer':
      return !!step.focusLayer;
    case 'layerControl':
      return (step.controls?.length ?? 0) > 0;
    case 'expandPanels':
      return (step.expandPanels?.length ?? 0) > 0;
  }
};

/** Warning field-prefix that belongs to a given action / control index. */
export const warningsForAction = (
  all: StoryWarning[] | undefined,
  kind: ActionKind,
  controlIndex?: number,
): StoryWarning[] => {
  if (!all) return [];
  switch (kind) {
    case 'navigation':
      return []; // viewport has no cross-ref warnings currently
    case 'focusLayer':
      return all.filter((w) => w.field === 'focusLayer');
    case 'activeLayers':
      return all.filter((w) => w.field?.startsWith('layers.active'));
    case 'expandPanels':
      return [];
    case 'layerControl':
      return all.filter((w) => w.field?.startsWith(`controls[${controlIndex}]`));
  }
};
