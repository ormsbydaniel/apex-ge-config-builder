import type { StoryStep, StoryPanelTabId } from '@/types/config';
import type { StoryWarning } from '@/utils/storyValidation';

/**
 * v2 action kinds surfaced by the editor.
 * - `navigation`   — step.viewport
 * - `activeLayers` — step.activeLayers[]
 * - `panelState`   — step.panelState (focus + controls + tab)
 */
export type ActionKind =
  | 'navigation'
  | 'activeLayers'
  | 'baseLayer'
  | 'constraints'
  | 'panelState';

export type ActionCategory = 'Navigation' | 'Layer display' | 'Panels';

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
    description: 'Move the map by zoom + centre, fitting a layer, or an explicit extent.',
    singleton: true,
  },
  activeLayers: {
    kind: 'activeLayers',
    category: 'Layer display',
    label: 'Active layers',
    description: 'Choose which layers are visible and configure opacity, blend, date and constraints per layer.',
    singleton: true,
  },
  baseLayer: {
    kind: 'baseLayer',
    category: 'Layer display',
    label: 'Base map',
    description: 'Choose which base map is visible for this step.',
    singleton: true,
  },
  constraints: {
    kind: 'constraints',
    category: 'Layer display',
    label: 'Apply constraints',
    description: "Apply data constraints (ranges, category filters) to the step's active layers.",
    singleton: true,
  },
  panelState: {
    kind: 'panelState',
    category: 'Panels',
    label: 'Panel state',
    description: 'Focus a layer, expand or disable controls, and open a specific panel tab.',
    singleton: true,
  },
};

export const CATEGORY_ORDER: ActionCategory[] = [
  'Navigation',
  'Layer display',
  'Panels',
];

export const VALID_TAB_IDS: StoryPanelTabId[] = [
  'overview',
  'statistics',
  'query',
  'charts',
  'parameters',
];

/** Which singleton actions are currently present on the step. */
export const hasKind = (step: StoryStep, kind: ActionKind): boolean => {
  switch (kind) {
    case 'navigation':
      return !!step.viewport;
    case 'activeLayers':
      return (step.activeLayers?.length ?? 0) > 0;
    case 'baseLayer':
      return !!step.baseLayer;
    case 'constraints':
      return (step.activeLayers ?? []).some((l) => (l.constraints?.length ?? 0) > 0);
    case 'panelState':
      return !!step.panelState && (
        !!step.panelState.focusLayer ||
        !!step.panelState.tab ||
        !!step.panelState.controls
      );
  }
};

/** Warning field-prefix that belongs to a given action. */
export const warningsForAction = (
  all: StoryWarning[] | undefined,
  kind: ActionKind,
): StoryWarning[] => {
  if (!all) return [];
  switch (kind) {
    case 'navigation':
      return [];
    case 'activeLayers':
      return all.filter((w) => w.field?.startsWith('activeLayers') && !w.field?.includes('constraints'));
    case 'baseLayer':
      return [];
    case 'constraints':
      return all.filter((w) => w.field?.startsWith('activeLayers') && w.field?.includes('constraints'));
    case 'panelState':
      return all.filter((w) => w.field?.startsWith('panelState'));
  }
};
