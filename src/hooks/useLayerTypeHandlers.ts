
import { useCallback, useState } from 'react';
import { LayerType, DataSource } from '@/types/config';
import { fetchRecommendedBaseLayers } from '@/utils/recommendedBaseLayers';
import { toast } from '@/hooks/use-toast';

interface UseLayerTypeHandlersProps {
  setDefaultInterfaceGroup: (group: string | undefined) => void;
  setDefaultSubinterfaceGroup?: (subGroup: string | undefined) => void;
  setSelectedLayerType: (type: LayerType | null) => void;
  setShowLayerForm: (show: boolean) => void;
  setEditingLayerIndex: (index: number | null) => void;
  setExpandedGroupAfterAction: (groupName: string | null) => void;
  addLayer: (layer: DataSource) => void;
}

export const useLayerTypeHandlers = ({
  setDefaultInterfaceGroup,
  setDefaultSubinterfaceGroup,
  setSelectedLayerType,
  setShowLayerForm,
  setEditingLayerIndex,
  setExpandedGroupAfterAction,
  addLayer
}: UseLayerTypeHandlersProps) => {
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);

  const handleAddLayerForGroup = useCallback((groupName: string, subGroupName?: string) => {
    setDefaultInterfaceGroup(groupName);
    setDefaultSubinterfaceGroup?.(subGroupName);
    setSelectedLayerType(null);
    setShowLayerForm(true);
  }, [setDefaultInterfaceGroup, setDefaultSubinterfaceGroup, setSelectedLayerType, setShowLayerForm]);

  const handleAddBaseLayer = useCallback(() => {
    setSelectedLayerType('base');
    setShowLayerForm(true);
  }, [setSelectedLayerType, setShowLayerForm]);

  const handleAddRecommendedBaseLayers = useCallback(async () => {
    setIsLoadingRecommended(true);
    try {
      const recommendedLayers = await fetchRecommendedBaseLayers();
      
      if (recommendedLayers.length === 0) {
        toast({
          title: "No base layers found",
          description: "The recommended config doesn't contain any base layers.",
          variant: "default"
        });
        return;
      }

      // Add each base layer
      recommendedLayers.forEach(layer => {
        addLayer(layer);
      });

      toast({
        title: "Base layers added",
        description: `Successfully added ${recommendedLayers.length} recommended base layer${recommendedLayers.length !== 1 ? 's' : ''}.`,
        variant: "default"
      });

      // Expand the base layers group
      setExpandedGroupAfterAction('__BASE_LAYERS__');
    } catch (error) {
      toast({
        title: "Failed to load base layers",
        description: error instanceof Error ? error.message : "An error occurred while fetching recommended base layers.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRecommended(false);
    }
  }, [addLayer, setExpandedGroupAfterAction]);

  return {
    handleAddLayerForGroup,
    handleAddBaseLayer,
    handleAddRecommendedBaseLayers,
    isLoadingRecommended
  };
};
