import type {
  Story,
  StoryV2,
  StoryStepLegacy,
  StoryStepV2,
  StoryStepAny,
  StoryActiveLayer,
  StoryStepControl,
  StoryPanelState,
  StoryPanelControls,
} from '@/types/story';

/**
 * Legacy → v2 story upgrader.
 *
 * Pure functions with no side effects. Safe to call on already-v2 input:
 * an object that already carries `activeLayers` is returned unchanged
 * (aside from a shallow clone).
 *
 * See `./README.md` for the rationale and integration notes.
 */

const isV2Step = (step: StoryStepAny): step is StoryStepV2 =>
  Array.isArray((step as StoryStepV2).activeLayers);

const buildActiveLayers = (step: StoryStepLegacy): StoryActiveLayer[] => {
  const activeIds = step.layers?.active ?? [];
  const controls = step.controls ?? [];
  const byLayer = new Map<string, StoryStepControl>();
  for (const c of controls) {
    if (c?.layer) byLayer.set(c.layer, c);
  }

  const result: StoryActiveLayer[] = [];
  const seen = new Set<string>();

  // Preserve the order in `layers.active`, layering in any matching control.
  for (const id of activeIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const control = byLayer.get(id);
    result.push(toActiveLayer(id, control));
  }

  // Include controls whose layer wasn't in `active` — they still express
  // per-layer state the author configured.
  for (const c of controls) {
    if (!c?.layer || seen.has(c.layer)) continue;
    seen.add(c.layer);
    result.push(toActiveLayer(c.layer, c));
  }

  return result;
};

const toActiveLayer = (
  id: string,
  control: StoryStepControl | undefined,
): StoryActiveLayer => {
  const layer: StoryActiveLayer = { id };
  if (control) {
    if (control.opacity !== undefined) layer.opacity = control.opacity;
    if (control.blend !== undefined) layer.blend = control.blend;
    if (control.constraints && control.constraints.length > 0) {
      layer.constraints = control.constraints;
    }
  }
  return layer;
};

const buildPanelState = (step: StoryStepLegacy): StoryPanelState | undefined => {
  const hasFocus = !!step.focusLayer;
  const expanded = step.expandPanels ?? [];
  if (!hasFocus && expanded.length === 0) return undefined;

  const controls: StoryPanelControls = {};
  for (const key of expanded) {
    // Only map keys that v2 recognises; ignore anything else silently.
    if (key === 'temporal' || key === 'styles' || key === 'filters') {
      controls[key] = { expanded: true };
    }
  }

  const panel: StoryPanelState = {};
  if (hasFocus) panel.focusLayer = step.focusLayer;
  if (Object.keys(controls).length > 0) panel.controls = controls;
  return panel;
};

/** Upgrade a single step. Idempotent — v2 input is returned as a clone. */
export const upgradeLegacyStep = (step: StoryStepAny): StoryStepV2 => {
  if (isV2Step(step)) {
    return { ...step };
  }
  const legacy = step as StoryStepLegacy;
  const v2: StoryStepV2 = {
    id: legacy.id,
    viewport: legacy.viewport,
    activeLayers: buildActiveLayers(legacy),
  };
  if (legacy.title || legacy.description) {
    v2.content = {
      ...(legacy.title && { title: legacy.title }),
      ...(legacy.description && { description: legacy.description }),
    };
  }
  const panel = buildPanelState(legacy);
  if (panel) v2.panelState = panel;
  return v2;
};

/** Upgrade every step on a story, preserving story-level fields. */
export const upgradeLegacyStory = (story: Story): StoryV2 => ({
  id: story.id,
  title: story.title,
  ...(story.thumbnail && { thumbnail: story.thumbnail }),
  ...(story.description !== undefined && { description: story.description }),
  ...(story.isActive !== undefined && { isActive: story.isActive }),
  steps: (story.steps ?? []).map(upgradeLegacyStep),
});

/** Upgrade a collection of stories (e.g. `config.stories`). */
export const upgradeLegacyStories = (
  stories: Story[] | undefined,
): StoryV2[] => (stories ?? []).map(upgradeLegacyStory);
