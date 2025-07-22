
import { useCallback } from 'react';
import { LayerType } from '@/types/config';

interface UseLayerTypeHandlersProps {
  setDefaultInterfaceGroup: (group: string | undefined) => void;
  setSelectedLayerType: (type: LayerType | null) => void;
  setShowLayerForm: (show: boolean) => void;
  setEditingLayerIndex: (index: number | null) => void;
  setExpandedGroupAfterAction: (groupName: string | null) => void;
}

export const useLayerTypeHandlers = ({
  setDefaultInterfaceGroup,
  setSelectedLayerType,
  setShowLayerForm,
  setEditingLayerIndex,
  setExpandedGroupAfterAction
}: UseLayerTypeHandlersProps) => {
  const handleAddLayerForGroup = useCallback((groupName: string) => {
    setDefaultInterfaceGroup(groupName);
    setSelectedLayerType(null);
    setShowLayerForm(true);
  }, [setDefaultInterfaceGroup, setSelectedLayerType, setShowLayerForm]);

  const handleAddBaseLayer = useCallback(() => {
    setSelectedLayerType('base');
    setShowLayerForm(true);
    // Set the group to expand after base layer creation
    setExpandedGroupAfterAction('__BASE_LAYERS__');
  }, [setSelectedLayerType, setShowLayerForm, setExpandedGroupAfterAction]);

  return {
    handleAddLayerForGroup,
    handleAddBaseLayer
  };
};
