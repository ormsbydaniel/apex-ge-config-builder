
import { useValidatedConfig } from '@/hooks/useValidatedConfig';
import { useLayoutState } from './useLayoutState';
import { useExclusivitySets } from './useExclusivitySets';
import { useServiceManagement } from './useServiceManagement';
import { useLayerManagement } from './useLayerManagement';

export const useConfigBuilderState = () => {
  const { config, dispatch } = useValidatedConfig();

  // Use focused hooks for different concerns
  const layoutState = useLayoutState({ dispatch });
  const exclusivitySets = useExclusivitySets({ 
    config: { exclusivitySets: config.exclusivitySets || [] }, 
    dispatch 
  });
  const serviceManagement = useServiceManagement({ config, dispatch });
  const layerManagement = useLayerManagement({ config, dispatch });

  return {
    config,
    // Layout state
    ...layoutState,
    // Exclusivity sets
    ...exclusivitySets,
    // Service management
    ...serviceManagement,
    // Layer management
    ...layerManagement
  };
};
