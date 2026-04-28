
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Globe, Download, ArrowLeft } from 'lucide-react';
import { LayerType } from '@/types/config';

interface LayerTypeSelectorProps {
  onSelectType: (type: LayerType) => void;
  onImportLayer?: () => void;
  onCancel?: () => void;
  defaultInterfaceGroup?: string;
}

const LayerTypeSelector = ({
  onSelectType,
  onImportLayer,
  onCancel,
  defaultInterfaceGroup
}: LayerTypeSelectorProps) => {
  const isFromInterfaceGroup = !!defaultInterfaceGroup;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-slate-50">
            {isFromInterfaceGroup ? `Add Layer to ${defaultInterfaceGroup}` : 'Add New Layer'}
          </h2>
          <p className="text-slate-400">
            {isFromInterfaceGroup
              ? 'Choose the type of layer you want to add to this interface group.'
              : 'Choose the type of layer you want to add to your configuration.'
            }
          </p>
        </div>
        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onSelectType('layerCard')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Layers className="h-6 w-6" />
              Add Layer Card
            </CardTitle>
            <CardDescription>
              A configurable layer with metadata, categories, and UI controls. Can contain multiple data sources and supports swipe, mirror, and spotlight functionality.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Add Layer Card
            </Button>
          </CardContent>
        </Card>

        {isFromInterfaceGroup ? (
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => onImportLayer?.()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Download className="h-6 w-6" />
                Import Layer Card
              </CardTitle>
              <CardDescription>
                Pick one or more Layer Cards from another configuration and add them to this interface group.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); onImportLayer?.(); }}>
                Import Layer Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onSelectType('base')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Globe className="h-6 w-6" />
                Base Layer
              </CardTitle>
              <CardDescription>
                A background map layer without UI controls or metadata. Used as the base map.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Add Base Layer
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LayerTypeSelector;
