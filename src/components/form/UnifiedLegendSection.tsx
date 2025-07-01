
import React from 'react';
import { Category } from '@/types/config';
import LayerControlsSection from './LayerControlsSection';
import CategoryEditorDialog from './CategoryEditorDialog';
import CategoryPreview from './CategoryPreview';

interface UnifiedLegendSectionProps {
  toggleable: boolean;
  opacitySlider: boolean;
  zoomToCenter: boolean;
  legendType: 'swatch' | 'gradient' | 'image';
  legendUrl: string;
  startColor: string;
  endColor: string;
  minValue: string;
  maxValue: string;
  categories: Category[];
  onUpdate: (field: string, value: any) => void;
  layerName: string;
}

const UnifiedLegendSection = ({
  toggleable,
  opacitySlider,
  zoomToCenter,
  legendType,
  legendUrl,
  startColor,
  endColor,
  minValue,
  maxValue,
  categories,
  onUpdate,
  layerName
}: UnifiedLegendSectionProps) => {
  const handleCategoriesUpdate = (updatedCategories: Category[]) => {
    onUpdate('categories', updatedCategories);
  };

  return (
    <div className="space-y-6">
      <LayerControlsSection
        toggleable={toggleable}
        opacitySlider={opacitySlider}
        zoomToCenter={zoomToCenter}
        legendType={legendType}
        legendUrl={legendUrl}
        startColor={startColor}
        endColor={endColor}
        minValue={minValue}
        maxValue={maxValue}
        onUpdate={onUpdate}
      />

      {/* Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Categories</h4>
          <CategoryEditorDialog
            categories={categories}
            onUpdate={handleCategoriesUpdate}
            layerName={layerName}
          />
        </div>
        
        {categories.length > 0 && (
          <CategoryPreview 
            categories={categories} 
            useValues={true}
          />
        )}
      </div>
    </div>
  );
};

export default UnifiedLegendSection;
