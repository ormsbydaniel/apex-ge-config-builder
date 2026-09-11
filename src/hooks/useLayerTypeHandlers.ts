
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
  /** URLs of base layers already in the config, used to exclude duplicates. */
  existingBaseLayerUrls?: string[];
}

export const useLayerTypeHandlers = ({
  setDefaultInterfaceGroup,
  setDefaultSubinterfaceGroup,
  setSelectedLayerType,
  setShowLayerForm,
  setEditingLayerIndex,
  setExpandedGroupAfterAction,
  addLayer,
  existingBaseLayerUrls = []
}: UseLayerTypeHandlersProps) => {
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [showRecommendedModal, setShowRecommendedModal] = useState(false);
  const [recommendedLayers, setRecommendedLayers] = useState<DataSource[]>([]);

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
      const fetchedLayers = await fetchRecommendedBaseLayers();

      if (fetchedLayers.length === 0) {
        toast({
          title: "No base layers found",
          description: "The recommended config doesn't contain any base layers.",
          variant: "default"
        });
        return;
      }

      // Exclude base layers already present in the config (matched by service URL)
      const existingUrls = new Set(existingBaseLayerUrls.filter(Boolean));
      const newLayers = fetchedLayers.filter(layer => {
        const url = layer.data?.[0]?.url;
        return !url || !existingUrls.has(url);
      });

      if (newLayers.length === 0) {
        toast({
          title: "Nothing new to add",
          description: "All recommended base layers have already been added.",
          variant: "default"
        });
        return;
      }

      setRecommendedLayers(newLayers);
      setShowRecommendedModal(true);
    } catch (error) {
      toast({
        title: "Failed to load base layers",
        description: error instanceof Error ? error.message : "An error occurred while fetching recommended base layers.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingRecommended(false);
    }
  }, [existingBaseLayerUrls]);

  const handleConfirmRecommendedBaseLayers = useCallback((selected: DataSource[]) => {
    selected.forEach(layer => {
      addLayer(layer);
    });

    toast({
      title: "Base layers added",
      description: `Successfully added ${selected.length} recommended base layer${selected.length !== 1 ? 's' : ''}.`,
      variant: "default"
    });

    setShowRecommendedModal(false);
    setRecommendedLayers([]);

    // Expand the base layers group
    setExpandedGroupAfterAction('__BASE_LAYERS__');
  }, [addLayer, setExpandedGroupAfterAction]);

  const handleCloseRecommendedModal = useCallback(() => {
    setShowRecommendedModal(false);
    setRecommendedLayers([]);
  }, []);

  return {
    handleAddLayerForGroup,
    handleAddBaseLayer,
    handleAddRecommendedBaseLayers,
    handleConfirmRecommendedBaseLayers,
    handleCloseRecommendedModal,
    isLoadingRecommended,
    showRecommendedModal,
    recommendedLayers
  };
};
