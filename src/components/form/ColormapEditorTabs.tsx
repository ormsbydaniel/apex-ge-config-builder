import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Colormap } from '@/types/config';
import ColormapDefineTab from './ColormapDefineTab';
import ColormapCopyFromLayer from './ColormapCopyFromLayer';

interface AvailableSourceLayer {
  name: string;
  colormaps: Colormap[];
}

interface ColormapEditorTabsProps {
  activeTab: string;
  localColormaps: Colormap[];
  editingIndex: number | null;
  isAddingNew: boolean;
  currentColormap: Colormap;
  availableSourceLayers: AvailableSourceLayer[];
  selectedSourceLayer: string;
  onActiveTabChange: (tab: string) => void;
  onSetLocalColormaps: (colormaps: Colormap[]) => void;
  onSetEditingIndex: (index: number | null) => void;
  onSetIsAddingNew: (isAdding: boolean) => void;
  onSetCurrentColormap: (colormap: Colormap) => void;
  onResetColormap: () => void;
  onSetSelectedSourceLayer: (layer: string) => void;
  onCopyFromLayer: () => void;
}

const ColormapEditorTabs = ({
  activeTab,
  localColormaps,
  editingIndex,
  isAddingNew,
  currentColormap,
  availableSourceLayers,
  selectedSourceLayer,
  onActiveTabChange,
  onSetLocalColormaps,
  onSetEditingIndex,
  onSetIsAddingNew,
  onSetCurrentColormap,
  onResetColormap,
  onSetSelectedSourceLayer,
  onCopyFromLayer
}: ColormapEditorTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={onActiveTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="define" className="flex items-center gap-2">
          Define colormaps
          <Badge variant="secondary" className="text-xs">
            {localColormaps.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger 
          value="copy" 
          disabled={availableSourceLayers.length === 0}
          className="flex items-center gap-2"
        >
          Copy from existing layer
          <Badge variant="secondary" className="text-xs">
            {availableSourceLayers.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

        <TabsContent value="define">
          <ColormapDefineTab
            localColormaps={localColormaps}
            editingIndex={editingIndex}
            isAddingNew={isAddingNew}
            currentColormap={currentColormap}
            onSetLocalColormaps={onSetLocalColormaps}
            onSetEditingIndex={onSetEditingIndex}
            onSetIsAddingNew={onSetIsAddingNew}
            onSetCurrentColormap={onSetCurrentColormap}
            onResetColormap={onResetColormap}
          />
        </TabsContent>

      <TabsContent value="copy">
        <ColormapCopyFromLayer
          availableSourceLayers={availableSourceLayers}
          selectedSourceLayer={selectedSourceLayer}
          setSelectedSourceLayer={onSetSelectedSourceLayer}
          onCopyFromLayer={onCopyFromLayer}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ColormapEditorTabs;