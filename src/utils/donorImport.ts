/**
 * Donor layer import utilities.
 *
 * Pure helpers used by the Import Layer Card flow to safely copy a layer
 * from a donor configuration into the active configuration:
 *  - deep clone (no shared references with the donor)
 *  - force `isBaseLayer: false` (only Layer Cards are importable)
 *  - rewrite layout.interfaceGroup / layout.subinterfaceGroup to the
 *    destination chosen by the user
 *  - guarantee a unique `name` against an existing-name set, mutating that
 *    set so consecutive clones in the same batch also stay unique
 */

const deepClone = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // fall through
    }
  }
  return JSON.parse(JSON.stringify(value));
};

export interface CloneDonorLayerOptions {
  interfaceGroup?: string;
  subinterfaceGroup?: string;
  /**
   * Mutated as new unique names are produced so that batch imports from
   * the same caller don't collide with each other.
   */
  existingNames: Set<string>;
}

const uniqueName = (base: string, taken: Set<string>): string => {
  if (!taken.has(base)) return base;
  const suffixed = `${base} (imported)`;
  if (!taken.has(suffixed)) return suffixed;
  let i = 2;
  while (taken.has(`${base} (imported ${i})`)) i++;
  return `${base} (imported ${i})`;
};

export const cloneDonorLayer = (
  source: any,
  { interfaceGroup, subinterfaceGroup, existingNames }: CloneDonorLayerOptions,
): any => {
  const cloned = deepClone(source);

  // Only Layer Cards are importable.
  cloned.isBaseLayer = false;

  // Ensure layout / layerCard exist (LayerCard requires layout.layerCard).
  if (!cloned.layout || typeof cloned.layout !== 'object') {
    cloned.layout = { layerCard: {} };
  }
  if (!cloned.layout.layerCard || typeof cloned.layout.layerCard !== 'object') {
    cloned.layout.layerCard = {};
  }

  // Rewrite destination groups (always — donor's groups are irrelevant here).
  if (interfaceGroup) {
    cloned.layout.interfaceGroup = interfaceGroup;
  } else {
    delete cloned.layout.interfaceGroup;
  }
  if (subinterfaceGroup) {
    cloned.layout.subinterfaceGroup = subinterfaceGroup;
  } else {
    delete cloned.layout.subinterfaceGroup;
  }

  // Resolve name collision and reserve the new name for subsequent clones.
  const baseName = typeof cloned.name === 'string' && cloned.name ? cloned.name : 'Imported layer';
  const finalName = uniqueName(baseName, existingNames);
  cloned.name = finalName;
  existingNames.add(finalName);

  return cloned;
};
