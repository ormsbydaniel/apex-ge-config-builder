
import { useMemo } from 'react';

export type HookFunction = (...args: any[]) => any;
export type HookResult = Record<string, any>;

interface CompositeHookConfig {
  hooks: Record<string, HookFunction>;
  dependencies?: string[];
  transform?: (results: Record<string, HookResult>) => HookResult;
}

/**
 * A utility hook for composing multiple hooks together with dependency management
 */
export const useCompositeHook = <T extends HookResult>(
  config: CompositeHookConfig,
  hookArgs: Record<string, any[]> = {}
): T => {
  const { hooks, dependencies = [], transform } = config;

  const results = useMemo(() => {
    const hookResults: Record<string, HookResult> = {};
    
    // Execute hooks in dependency order
    const hookNames = Object.keys(hooks);
    const orderedHooks = dependencies.length > 0 
      ? [...dependencies, ...hookNames.filter(name => !dependencies.includes(name))]
      : hookNames;

    for (const hookName of orderedHooks) {
      if (hooks[hookName]) {
        const args = hookArgs[hookName] || [];
        hookResults[hookName] = hooks[hookName](...args);
      }
    }

    return hookResults;
  }, [hooks, dependencies, hookArgs]);

  return useMemo(() => {
    if (transform) {
      return transform(results) as T;
    }
    
    // Default: flatten all hook results into a single object
    const flattened: HookResult = {};
    Object.values(results).forEach(result => {
      Object.assign(flattened, result);
    });
    
    return flattened as T;
  }, [results, transform]);
};
