
import { useValidatedConfig } from '@/hooks/useValidatedConfig';
import { useLayoutState } from './useLayoutState';
import { useExclusivitySets } from './useExclusivitySets';
import { useServiceManagement } from './useServiceManagement';
import { useLayerOperations } from './useLayerOperations';
import { useWorkflowActions } from './useWorkflowActions';

export const useConfigBuilderState = () => {
  const { config, dispatch } = useValidatedConfig();

  // Ensure exclusivitySets is always an array for the hook
  const configWithExclusivitySets = {
    ...config,
    exclusivitySets: config.exclusivitySets || []
  };

  // Use focused hooks for different concerns
  const layoutState = useLayoutState({ dispatch });
  const exclusivitySets = useExclusivitySets({ config: configWithExclusivitySets, dispatch });
  const serviceManagement = useServiceManagement({ config, dispatch });
  const layerOperations = useLayerOperations({ config, dispatch });
  const workflowActions = useWorkflowActions({ config: config as any, dispatch });

  return {
    config,
    // Layout state
    ...layoutState,
    // Exclusivity sets
    ...exclusivitySets,
    // Service management
    ...serviceManagement,
    // Layer management
    ...layerOperations,
    // Workflow management
    ...workflowActions,
  };
};

