
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Category } from '@/types/config';
import CategoryManualEditor from './CategoryManualEditor';
import CategoryCopyFromLayer from './CategoryCopyFromLayer';

interface AvailableSourceLayer {
  name: string;
  categories: Category[];
  hasValues: boolean;
}

interface CategoryEditorTabsProps {
  activeTab: string;
  localCategories: Category[];
  useValues: boolean;
  newCategory: Category;
  availableSourceLayers: AvailableSourceLayer[];
  selectedSourceLayer: string;
  onActiveTabChange: (tab: string) => void;
  onSetLocalCategories: (categories: Category[]) => void;
  onSetUseValues: (useValues: boolean) => void;
  onSetNewCategory: (category: Category) => void;
  onSetSelectedSourceLayer: (layer: string) => void;
  onCopyFromLayer: () => void;
}

const CategoryEditorTabs = ({
  activeTab,
  localCategories,
  useValues,
  newCategory,
  availableSourceLayers,
  selectedSourceLayer,
  onActiveTabChange,
  onSetLocalCategories,
  onSetUseValues,
  onSetNewCategory,
  onSetSelectedSourceLayer,
  onCopyFromLayer
}: CategoryEditorTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onActiveTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual" className="flex items-center gap-2">
          Manual Editor
          <Badge variant="secondary" className="text-xs">
            {localCategories.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger 
          value="copy" 
          disabled={availableSourceLayers.length === 0}
          className="flex items-center gap-2"
        >
          Copy from Layer
          <Badge variant="secondary" className="text-xs">
            {availableSourceLayers.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="manual">
        <CategoryManualEditor
          key={`manual-editor-${localCategories.length}-${localCategories.map(c => c.label).join('-')}`}
          localCategories={localCategories}
          setLocalCategories={onSetLocalCategories}
          useValues={useValues}
          setUseValues={onSetUseValues}
          newCategory={newCategory}
          setNewCategory={onSetNewCategory}
        />
      </TabsContent>

      <TabsContent value="copy">
        <CategoryCopyFromLayer
          availableSourceLayers={availableSourceLayers}
          selectedSourceLayer={selectedSourceLayer}
          setSelectedSourceLayer={onSetSelectedSourceLayer}
          onCopyFromLayer={onCopyFromLayer}
        />
      </TabsContent>
    </Tabs>
  );
};

export default CategoryEditorTabs;
