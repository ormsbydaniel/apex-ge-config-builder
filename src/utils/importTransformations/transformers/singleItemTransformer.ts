
/**
 * Repair pattern: when `data` (or `statistics`) is a single object instead of
 * an array, wrap it into a one-element array. Applied to:
 *   - sources[].data / sources[].statistics
 *   - sources[].workflows[].data
 *   - top-level workflows[].data
 *
 * Swipe layers are skipped — their `data` object shape is handled elsewhere.
 */

const wrapIfObject = (value: any, skipSwipe = false): any => {
  if (!value) return value;
  if (Array.isArray(value)) return value;
  if (typeof value !== 'object') return value;
  if (skipSwipe && value.type === 'swipe') return value;
  return [{ ...value }];
};

const repairWorkflows = (workflows: any): any => {
  if (!Array.isArray(workflows)) return workflows;
  return workflows.map((wf: any) => {
    if (!wf || typeof wf !== 'object') return wf;
    return { ...wf, data: wrapIfObject(wf.data) };
  });
};

export const reverseSingleItemTransformation = (config: any, enabled: boolean): any => {
  if (!enabled) return config;

  const repaired = { ...config };

  if (Array.isArray(repaired.sources)) {
    repaired.sources = repaired.sources.map((source: any) => {
      const normalizedSource = { ...source };
      normalizedSource.data = wrapIfObject(normalizedSource.data, true);
      normalizedSource.statistics = wrapIfObject(normalizedSource.statistics);
      if (normalizedSource.workflows) {
        normalizedSource.workflows = repairWorkflows(normalizedSource.workflows);
      }
      return normalizedSource;
    });
  }

  if (repaired.workflows) {
    repaired.workflows = repairWorkflows(repaired.workflows);
  }

  return repaired;
};
