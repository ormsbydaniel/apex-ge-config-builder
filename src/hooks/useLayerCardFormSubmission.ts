
import { DataSource } from '@/types/config';
import { useToast } from '@/hooks/use-toast';

import { TimeframeType } from '@/types/config';

interface SubmissionFormData {
  name: string;
  description: string;
  interfaceGroup: string;
  attributionText: string;
  attributionUrl: string;
  hasFeatureStatistics: boolean;
  units: string;
  toggleable: boolean;
  opacitySlider: boolean;
  zoomToCenter: boolean;
  download?: string;
  legendType: 'swatch' | 'gradient' | 'image';
  legendUrl: string;
  startColor: string;
  endColor: string;
  minValue: string;
  maxValue: string;
  categories: Array<{ label: string; color: string; value: number }>;
  timeframe: TimeframeType;
  defaultTimestamp?: number;
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

    // Prepare controls object with zoomToCenter and download
    const controlsObject = {
      opacitySlider: formData.opacitySlider,
      zoomToCenter: formData.zoomToCenter,
      ...(formData.download && formData.download.trim() && { download: formData.download.trim() })
    };

    // Prepare meta object with gradient fields if needed
    const metaObject = {
      description: formData.description.trim(),
      attribution: {
        text: formData.attributionText.trim(),
        url: formData.attributionUrl.trim() || undefined,
      },
      categories: processedCategories && processedCategories.length > 0 ? processedCategories : undefined,
      units: formData.units.trim() || undefined,
      // Add gradient fields if legend type is gradient
      ...(formData.legendType === 'gradient' && {
        startColor: formData.startColor.trim(),
        endColor: formData.endColor.trim(),
        min: parseFloat(formData.minValue),
        max: parseFloat(formData.maxValue)
      }),
      // Add temporal configuration if timeframe is not 'None'
      ...(formData.timeframe !== 'None' && {
        timeframe: formData.timeframe,
        ...(formData.defaultTimestamp !== undefined && { 
          defaultTimestamp: formData.defaultTimestamp 
        })
      })
    };

    const layerCard: DataSource = {
      name: formData.name.trim(),
      isActive: (formData as any).isActive || editingLayer?.isActive || false,
      hasFeatureStatistics: formData.hasFeatureStatistics || undefined,
      meta: metaObject,
      layout: {
        interfaceGroup: formData.interfaceGroup || undefined,
        layerCard: {
          toggleable: formData.toggleable,
          legend: legendObject,
          controls: controlsObject,
        },
      },
      data: editingLayer?.data || [],
      statistics: editingLayer?.statistics
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
