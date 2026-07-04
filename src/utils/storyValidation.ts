import { DataSource, Story } from '@/types/config';

/**
 * Cross-reference validation for storymaps.
 *
 * These checks run purely in the browser against the current config; they
 * never block save. Warnings surface as inline badges on step headers and
 * next to offending fields in the editor.
 */

export type StoryWarningKind =
  | 'unknown-layer'
  | 'unknown-constraint'
  | 'selection-type-mismatch';

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

export const validateStories = (
  stories: Story[] | undefined,
  sources: DataSource[],
): StepWarningsMap => {
  const map: StepWarningsMap = new Map();
  if (!stories || stories.length === 0) return map;

  const findLayer = buildLayerLookup(sources);

  stories.forEach((story, storyIndex) => {
    story.steps?.forEach((step, stepIndex) => {
      const warnings: StoryWarning[] = [];

      // focusLayer
      if (step.focusLayer && !findLayer(step.focusLayer)) {
        warnings.push({
          kind: 'unknown-layer',
          field: 'focusLayer',
          message: `Focus layer "${step.focusLayer}" does not match any source name.`,
        });
      }

      // active layers
      step.layers?.active?.forEach((ref, i) => {
        if (!findLayer(ref)) {
          warnings.push({
            kind: 'unknown-layer',
            field: `layers.active[${i}]`,
            message: `Active layer "${ref}" does not match any source name.`,
          });
        }
      });

      // controls -> layer + constraints
      step.controls?.forEach((control, ci) => {
        const source = control.layer ? findLayer(control.layer) : undefined;
        if (control.layer && !source) {
          warnings.push({
            kind: 'unknown-layer',
            field: `controls[${ci}].layer`,
            message: `Control layer "${control.layer}" does not match any source name.`,
          });
        }

        control.constraints?.forEach((sel, si) => {
          if (!source) return; // Can't validate constraint if source unknown
          const defs = source.constraints ?? [];
          const def = defs.find((d) => d.label === sel.label);
          if (!def) {
            warnings.push({
              kind: 'unknown-constraint',
              field: `controls[${ci}].constraints[${si}].label`,
              message: `Constraint "${sel.label}" is not defined on layer "${source.name}".`,
            });
            return;
          }
          // Type / selection alignment
          const hasRange = sel.lower !== undefined || sel.upper !== undefined;
          const hasValues = Array.isArray(sel.values) && sel.values.length > 0;
          if (def.type === 'continuous' && hasValues) {
            warnings.push({
              kind: 'selection-type-mismatch',
              field: `controls[${ci}].constraints[${si}]`,
              message: `Constraint "${sel.label}" is continuous — use lower/upper instead of values.`,
            });
          }
          if (def.type === 'categorical' && hasRange) {
            warnings.push({
              kind: 'selection-type-mismatch',
              field: `controls[${ci}].constraints[${si}]`,
              message: `Constraint "${sel.label}" is categorical — use values instead of lower/upper.`,
            });
          }
        });
      });

      if (warnings.length > 0) {
        map.set(stepKey(storyIndex, stepIndex), warnings);
      }
    });
  });

  return map;
};
