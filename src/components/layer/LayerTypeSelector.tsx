
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, Globe, SwitchCamera } from 'lucide-react';
import { LayerType } from '@/types/config';

interface LayerTypeSelectorProps {
  onSelectType: (type: LayerType) => void;
  defaultInterfaceGroup?: string;
}

const LayerTypeSelector = ({
  onSelectType,
  defaultInterfaceGroup
}: LayerTypeSelectorProps) => {
  const isFromInterfaceGroup = !!defaultInterfaceGroup;

  return (
    <div className="space-y-6">
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

      <div className={`grid grid-cols-1 ${isFromInterfaceGroup ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onSelectType('layerCard')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Layers className="h-6 w-6" />
              Layer Card
            </CardTitle>
            <CardDescription>
              A configurable layer with metadata, categories, and UI controls. Can contain multiple data sources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Add Layer Card
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => onSelectType('swipe')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <SwitchCamera className="h-6 w-6" />
              Swipe Layer
            </CardTitle>
            <CardDescription>
              Compare two layers with a swipe interaction. References existing layers in your configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full">
              Add Swipe Layer
            </Button>
          </CardContent>
        </Card>

        {!isFromInterfaceGroup && (
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
