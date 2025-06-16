
import { useMemo } from 'react';

/**
 * A simplified hook composition utility for combining multiple hooks
 */
export const useSimpleHookComposition = <T extends Record<string, any>>(
  hooks: Array<() => any>
): T => {
  return useMemo(() => {
    const results: Record<string, any> = {};
    
    hooks.forEach((hook, index) => {
      const hookResult = hook();
      // If hook returns an object, spread its properties
      if (hookResult && typeof hookResult === 'object') {
        Object.assign(results, hookResult);
      } else {
        // If hook returns a primitive, store it with a generated key
        results[`hook${index}`] = hookResult;
      }
    });
    
    return results as T;
  }, [hooks]);
};
