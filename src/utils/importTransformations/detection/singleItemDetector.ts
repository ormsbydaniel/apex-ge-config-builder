
const isPlainObject = (v: any) =>
  v && typeof v === 'object' && !Array.isArray(v);

const workflowsNeedRepair = (workflows: any): boolean => {
  if (!Array.isArray(workflows)) return false;
  return workflows.some((wf: any) => wf && isPlainObject(wf.data));
};

/**
 * Detect if config has single-item objects where arrays are expected.
 * Covers sources[].data, sources[].statistics, sources[].workflows[].data,
 * and top-level workflows[].data.
 */
export const detectSingleItemArrayToObject = (config: any): boolean => {
  if (workflowsNeedRepair(config?.workflows)) return true;

  if (!Array.isArray(config?.sources)) return false;

  return config.sources.some((source: any) => {
    if (isPlainObject(source.data) && source.data.type !== 'swipe') return true;
    if (isPlainObject(source.statistics)) return true;
    if (workflowsNeedRepair(source.workflows)) return true;
    return false;
  });
};
