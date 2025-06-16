
import { useMemo } from 'react';

export interface HookDependency {
  name: string;
  hook: (...args: any[]) => any;
  dependencies?: string[];
  args?: any[];
}

export interface HookRegistryConfig {
  hooks: HookDependency[];
  globalArgs?: Record<string, any>;
}

/**
 * A registry system for managing hook dependencies and execution order
 */
export const useHookRegistry = (config: HookRegistryConfig) => {
  const { hooks, globalArgs = {} } = config;

  const registry = useMemo(() => {
    // Create dependency graph
    const graph = new Map<string, HookDependency>();
    hooks.forEach(hookDef => {
      graph.set(hookDef.name, hookDef);
    });

    // Topological sort for dependency resolution
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string) => {
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving ${name}`);
      }
      if (visited.has(name)) return;

      visiting.add(name);
      const hookDef = graph.get(name);
      
      if (hookDef?.dependencies) {
        hookDef.dependencies.forEach(dep => {
          if (graph.has(dep)) {
            visit(dep);
          }
        });
      }

      visiting.delete(name);
      visited.add(name);
      sorted.push(name);
    };

    hooks.forEach(hookDef => visit(hookDef.name));

    return { graph, executionOrder: sorted };
  }, [hooks]);

  const executeHooks = useMemo(() => {
    const results: Record<string, any> = {};
    
    registry.executionOrder.forEach(hookName => {
      const hookDef = registry.graph.get(hookName);
      if (hookDef) {
        const args = [
          ...(hookDef.args || []),
          // Pass results from dependencies
          ...(hookDef.dependencies?.map(dep => results[dep]) || [])
        ];
        
        // Merge global args if they exist for this hook
        const finalArgs = globalArgs[hookName] 
          ? [...args, globalArgs[hookName]]
          : args;

        results[hookName] = hookDef.hook(...finalArgs);
      }
    });

    return results;
  }, [registry, globalArgs]);

  return {
    results: executeHooks,
    executionOrder: registry.executionOrder,
    getDependencies: (hookName: string) => registry.graph.get(hookName)?.dependencies || []
  };
};
