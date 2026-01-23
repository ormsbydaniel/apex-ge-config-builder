
import { DataSource, Colormap, TimeframeType } from '@/types/config';
import { FieldsConfig } from '@/types/category';
import { useToast } from '@/hooks/use-toast';

interface SubmissionFormData {
  name: string;
  description: string;
  interfaceGroup: string;
  attributionText: string;
  attributionUrl: string;
  hasFeatureStatistics: boolean;
  isActive: boolean;
  exclusivitySets: string[];
  units: string;
  contentLocation: 'layerCard' | 'infoPanel'; // NEW: Content location
  toggleable: boolean;
  opacitySlider: boolean;
  zoomToCenter: boolean;
  download?: string;
  temporalControls: boolean;
  constraintSlider: boolean;
  blendControls: boolean;
  legendType: 'swatch' | 'gradient' | 'image';
  legendUrl: string;
  startColor: string;
  endColor: string;
  minValue: string;
  maxValue: string;
  categories: Array<{ label: string; color: string; value: number }>;
  colormaps: Colormap[];
  timeframe: TimeframeType;
  defaultTimestamp?: number;
  fields: FieldsConfig;
}

export const useLayerCardFormSubmission = (
  editingLayer?: DataSource,
  isEditing: boolean = false
) => {
  const { toast } = useToast();

  const createLayerFromFormData = (formData: SubmissionFormData): DataSource => {
    // Process categories to ensure they have the required value property
    const processedCategories = formData.categories?.map((cat, index) => ({
      label: cat.label || '',
      color: cat.color || '#000000',
      value: (cat as any).value ?? index
    }));

    // Prepare legend object
    const legendObject = {
      type: formData.legendType,
      ...(formData.legendType === 'image' && formData.legendUrl.trim() && { url: formData.legendUrl.trim() })
    };

    // Prepare controls object with all control fields
    const controlsObject = {
      opacitySlider: formData.opacitySlider,
      zoomToCenter: formData.zoomToCenter,
      temporalControls: formData.temporalControls,
      constraintSlider: formData.constraintSlider,
      blendControls: formData.blendControls,
      ...(formData.download && formData.download.trim() && { download: formData.download.trim() })
    };

    // Prepare meta object with gradient fields if needed
    const hasColormaps = formData.colormaps && formData.colormaps.length > 0;
    
    const metaObject = {
      description: formData.description.trim(),
      attribution: {
        text: formData.attributionText.trim(),
        ...(formData.attributionUrl.trim() && { url: formData.attributionUrl.trim() }),
      },
      ...(processedCategories && processedCategories.length > 0 && { categories: processedCategories }),
      ...(formData.colormaps && formData.colormaps.length > 0 && { colormaps: formData.colormaps }),
      ...(formData.units.trim() && { units: formData.units.trim() }),
      // Add fields if present
      ...(formData.fields && Object.keys(formData.fields).length > 0 && { fields: formData.fields }),
      // Add gradient fields if legend type is gradient
      ...(formData.legendType === 'gradient' && {
        // Only include startColor and endColor if there are no colormaps
        ...(!hasColormaps && {
          startColor: formData.startColor.trim(),
          endColor: formData.endColor.trim(),
        }),
        min: parseFloat(formData.minValue),
        max: parseFloat(formData.maxValue)
      }),
    };

    // Create layout structure based on contentLocation
    const layoutObject: any = {
      ...(formData.interfaceGroup && { interfaceGroup: formData.interfaceGroup }),
      contentLocation: formData.contentLocation, // Store content location
    };

    // Place legend and controls in the correct location
    if (formData.contentLocation === 'infoPanel') {
      layoutObject.infoPanel = {
        legend: legendObject,
        controls: controlsObject
      };
      // Keep toggleable in layerCard even when content is in infoPanel
      layoutObject.layerCard = {
        toggleable: formData.toggleable
      };
    } else {
      layoutObject.layerCard = {
        toggleable: formData.toggleable,
        legend: legendObject,
        controls: controlsObject
      };
    }

    const layerCard: DataSource = {
      name: formData.name.trim(),
      isActive: formData.isActive,
      ...(formData.exclusivitySets.length > 0 && { exclusivitySets: formData.exclusivitySets }),
      ...(formData.hasFeatureStatistics && { hasFeatureStatistics: formData.hasFeatureStatistics }),
      // Add temporal configuration at top level if timeframe is not 'None'
      ...(formData.timeframe !== 'None' && {
        timeframe: formData.timeframe,
        ...(formData.defaultTimestamp !== undefined && { 
          defaultTimestamp: formData.defaultTimestamp 
        })
      }),
      meta: metaObject,
      layout: layoutObject,
      data: editingLayer?.data || [],
      // Preserve existing arrays when editing
      ...(editingLayer?.statistics && { statistics: editingLayer.statistics }),
      ...(editingLayer?.constraints && { constraints: editingLayer.constraints }),
      ...(editingLayer?.workflows && { workflows: editingLayer.workflows })
    };

    return layerCard;
  };

  const handleSuccessfulSubmission = (layerName: string) => {
    toast({
      title: isEditing ? "Layer Card Updated" : "Layer Card Created",
      description: isEditing 
        ? `"${layerName}" has been updated successfully.`
        : `"${layerName}" has been created. Now add data sources to it.`,
    });
  };

  return {
    createLayerFromFormData,
    handleSuccessfulSubmission
  };
};
