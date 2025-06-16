
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';
import { DataSource, Category } from '@/types/config';
import ConfigBasicInfo from './ConfigBasicInfo';
import AttributionSection from './AttributionSection';
import CategoriesSection from './CategoriesSection';

interface LayerCardConfigSectionProps {
  formData: DataSource;
  interfaceGroups: string[];
  hasFeatureStatistics: boolean;
  newCategory: Category;
  showCategories: boolean;
  onUpdateFormData: (path: string, value: any) => void;
  onSetHasFeatureStatistics: (value: boolean) => void;
  onSetNewCategory: (category: Category) => void;
  onSetShowCategories: (show: boolean) => void;
  onAddCategory: () => void;
  onRemoveCategory: (index: number) => void;
}

const LayerCardConfigSection = ({
  formData,
  interfaceGroups,
  hasFeatureStatistics,
  newCategory,
  showCategories,
  onUpdateFormData,
  onSetHasFeatureStatistics,
  onSetNewCategory,
  onSetShowCategories,
  onAddCategory,
  onRemoveCategory
}: LayerCardConfigSectionProps) => {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Layers className="h-5 w-5" />
          Layer Card Configuration
        </CardTitle>
        <CardDescription>
          Configure how this layer appears in the UI, including metadata and categorization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ConfigBasicInfo
          formData={formData}
          interfaceGroups={interfaceGroups}
          hasFeatureStatistics={hasFeatureStatistics}
          onUpdateFormData={onUpdateFormData}
          onSetHasFeatureStatistics={onSetHasFeatureStatistics}
        />

        <AttributionSection
          formData={formData}
          onUpdateFormData={onUpdateFormData}
        />

        <CategoriesSection
          formData={formData}
          newCategory={newCategory}
          showCategories={showCategories}
          onSetNewCategory={onSetNewCategory}
          onSetShowCategories={onSetShowCategories}
          onAddCategory={onAddCategory}
          onRemoveCategory={onRemoveCategory}
        />
      </CardContent>
    </Card>
  );
};

export default LayerCardConfigSection;
