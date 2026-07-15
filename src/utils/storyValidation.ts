import { DataSource, Story } from '@/types/config';
import type {
  StoryActiveLayer,
  StoryConstraintSelection,
  StoryStepAny,
  StoryStepLegacy,
  StoryStepV2,
} from '@/types/story';

/**
 * Cross-reference validation for storymaps.
 *
 * Runs in the browser against the current config and never blocks save.
 * Warnings surface as inline badges on step headers and next to offending
 * fields in the editor.
 *
 * Handles BOTH legacy (v1) and v2 step shapes so warnings continue to
 * render while the editor is being migrated. Field paths in emitted
 * warnings match the shape of the input step, so downstream filters in
 * `storymaps/actions/types.ts` continue to work for legacy steps.
 */

export type StoryWarningKind =
  | 'unknown-layer'
  | 'unknown-constraint'
  | 'selection-type-mismatch'
  | 'unknown-focus-layer'
  | 'unknown-active-chart'
  | 'missing-required-constraint'
  | 'duplicate-constraint-label'
  | 'rejected-band-index'
  | 'invalid-tab-id';

export interface StoryWarning {
  kind: StoryWarningKind;
  message: string;
  /** Optional field pointer for inline placement in the step editor. */
  field?: string;
}

export type StepWarningsMap = Map<string, StoryWarning[]>;

const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/\s+/g, '-');

const buildLayerLookup = (sources: DataSource[]) => {
  const byId = new Map<string, DataSource>();
  const byName = new Map<string, DataSource>();
  const bySlug = new Map<string, DataSource>();
  for (const src of sources) {
    if (!src) continue;
    if (typeof src.id === 'string' && src.id) byId.set(src.id, src);
    if (src.name) {
      byName.set(src.name, src);
      bySlug.set(slugify(src.name), src);
    }
  }
  return (ref: string): DataSource | undefined =>
    byId.get(ref) ?? byName.get(ref) ?? bySlug.get(slugify(ref));
};

export const stepKey = (storyIndex: number, stepIndex: number): string =>
  `${storyIndex}:${stepIndex}`;

const isV2Step = (step: StoryStepAny): step is StoryStepV2 =>
  Array.isArray((step as StoryStepV2).activeLayers);

const validateConstraintSelection = (
  source: DataSource,
  sel: StoryConstraintSelection,
  fieldPrefix: string,
): StoryWarning[] => {
  const warnings: StoryWarning[] = [];
  const defs = source.constraints ?? [];
  const def = defs.find((d) => d.label === sel.label);
  if (!def) {
    warnings.push({
      kind: 'unknown-constraint',
      field: `${fieldPrefix}.label`,
      message: `Constraint "${sel.label}" is not defined on layer "${source.name}".`,
    });
    return warnings;
  }
  const hasRange = sel.lower !== undefined || sel.upper !== undefined;
  const hasValues = Array.isArray(sel.values) && sel.values.length > 0;
  if (def.type === 'continuous' && hasValues) {
    warnings.push({
      kind: 'selection-type-mismatch',
      field: fieldPrefix,
      message: `Constraint "${sel.label}" is continuous — use lower/upper instead of values.`,
    });
  }
  if (def.type !== 'continuous' && hasRange) {
    warnings.push({
      kind: 'selection-type-mismatch',
      field: fieldPrefix,
      message: `Constraint "${sel.label}" is ${def.type} — use values instead of lower/upper.`,
    });
  }
  if ((sel as unknown as { bandIndex?: unknown }).bandIndex !== undefined) {
    warnings.push({
      kind: 'rejected-band-index',
      field: fieldPrefix,
      message: `bandIndex is not allowed on story-step constraint selections.`,
    });
  }
  return warnings;
};

const validateLegacyStep = (
  step: StoryStepLegacy,
  findLayer: (ref: string) => DataSource | undefined,
): StoryWarning[] => {
  const warnings: StoryWarning[] = [];

  if (step.focusLayer && !findLayer(step.focusLayer)) {
    warnings.push({
      kind: 'unknown-layer',
      field: 'focusLayer',
      message: `Focus layer "${step.focusLayer}" does not match any source id or name.`,
    });
  }

  step.layers?.active?.forEach((ref, i) => {
    if (!findLayer(ref)) {
      warnings.push({
        kind: 'unknown-layer',
        field: `layers.active[${i}]`,
        message: `Active layer "${ref}" does not match any source id or name.`,
      });
    }
  });

  step.controls?.forEach((control, ci) => {
    const source = control.layer ? findLayer(control.layer) : undefined;
    if (control.layer && !source) {
      warnings.push({
        kind: 'unknown-layer',
        field: `controls[${ci}].layer`,
        message: `Control layer "${control.layer}" does not match any source id or name.`,
      });
    }
    if (!source) return;
    const seen = new Set<string>();
    control.constraints?.forEach((sel, si) => {
      const prefix = `controls[${ci}].constraints[${si}]`;
      if (seen.has(sel.label)) {
        warnings.push({
          kind: 'duplicate-constraint-label',
          field: `${prefix}.label`,
          message: `Constraint "${sel.label}" is listed more than once on layer "${source.name}".`,
        });
      }
      seen.add(sel.label);
      warnings.push(...validateConstraintSelection(source, sel, prefix));
    });
  });

  return warnings;
};

const VALID_TAB_IDS = new Set([
  'overview',
  'statistics',
  'query',
  'charts',
  'parameters',
]);

const validateV2Step = (
  step: StoryStepV2,
  findLayer: (ref: string) => DataSource | undefined,
): StoryWarning[] => {
  const warnings: StoryWarning[] = [];
  const activeIds = new Set<string>();

  step.activeLayers.forEach((layer: StoryActiveLayer, i) => {
    const source = layer.id ? findLayer(layer.id) : undefined;
    if (layer.id && !source) {
      warnings.push({
        kind: 'unknown-layer',
        field: `activeLayers[${i}].id`,
        message: `Active layer "${layer.id}" does not match any source id or name.`,
      });
    }
    if (layer.id) activeIds.add(layer.id);
    if (!source) return;

    const definedLabels = new Set(
      (source.constraints ?? []).filter((c) => c.interactive).map((c) => c.label),
    );
    const seen = new Set<string>();
    layer.constraints?.forEach((sel, si) => {
      const prefix = `activeLayers[${i}].constraints[${si}]`;
      if (seen.has(sel.label)) {
        warnings.push({
          kind: 'duplicate-constraint-label',
          field: `${prefix}.label`,
          message: `Constraint "${sel.label}" is listed more than once on layer "${source.name}".`,
        });
      }
      seen.add(sel.label);
      warnings.push(...validateConstraintSelection(source, sel, prefix));
    });

    // Coverage: every interactive constraint on the source must have a match.
    definedLabels.forEach((label) => {
      if (!seen.has(label)) {
        warnings.push({
          kind: 'missing-required-constraint',
          field: `activeLayers[${i}].constraints`,
          message: `Layer "${source.name}" defines interactive constraint "${label}" but the step does not set a value.`,
        });
      }
    });
  });

  const panel = step.panelState;
  if (panel?.focusLayer) {
    if (!findLayer(panel.focusLayer)) {
      warnings.push({
        kind: 'unknown-layer',
        field: 'panelState.focusLayer',
        message: `Focus layer "${panel.focusLayer}" does not match any source id or name.`,
      });
    } else if (!activeIds.has(panel.focusLayer)) {
      warnings.push({
        kind: 'unknown-focus-layer',
        field: 'panelState.focusLayer',
        message: `Focus layer "${panel.focusLayer}" must also appear in activeLayers.`,
      });
    }
  }
  if (panel?.tab?.id && !VALID_TAB_IDS.has(panel.tab.id)) {
    warnings.push({
      kind: 'invalid-tab-id',
      field: 'panelState.tab.id',
      message: `Panel tab "${panel.tab.id}" is not a recognised tab.`,
    });
  }
  return warnings;
};

export const validateStories = (
  stories: Story[] | undefined,
  sources: DataSource[],
): StepWarningsMap => {
  const map: StepWarningsMap = new Map();
  if (!stories || stories.length === 0) return map;

  const findLayer = buildLayerLookup(sources);

  stories.forEach((story, storyIndex) => {
    story.steps?.forEach((step: StoryStepAny, stepIndex) => {
      const warnings = isV2Step(step)
        ? validateV2Step(step, findLayer)
        : validateLegacyStep(step as StoryStepLegacy, findLayer);
      if (warnings.length > 0) {
        map.set(stepKey(storyIndex, stepIndex), warnings);
      }
    });
  });

  return map;
};
