
import { useCallback } from 'react';
import { LayerType } from '@/types/config';

interface UseLayerTypeHandlersProps {
  setDefaultInterfaceGroup: (group: string | undefined) => void;
  setSelectedLayerType: (type: LayerType | null) => void;
  setShowLayerForm: (show: boolean) => void;
  setEditingLayerIndex: (index: number | null) => void;
}

export const useLayerTypeHandlers = ({
  setDefaultInterfaceGroup,
  setSelectedLayerType,
  setShowLayerForm,
  setEditingLayerIndex
}: UseLayerTypeHandlersProps) => {
  const handleAddLayerForGroup = useCallback((groupName: string) => {
    setDefaultInterfaceGroup(groupName);
    setSelectedLayerType(null);
    setShowLayerForm(true);
  }, [setDefaultInterfaceGroup, setSelectedLayerType, setShowLayerForm]);

  const handleAddBaseLayer = useCallback(() => {
    setSelectedLayerType('base');
    setShowLayerForm(true);
  }, [setSelectedLayerType, setShowLayerForm]);

  return {
    handleAddLayerForGroup,
    handleAddBaseLayer
  };
};
