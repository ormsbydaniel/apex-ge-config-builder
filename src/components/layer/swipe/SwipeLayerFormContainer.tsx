import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Save, X, SwitchCamera, AlertTriangle } from 'lucide-react';
import { DataSource, Category } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UnifiedBasicInfoSection from '@/components/form/UnifiedBasicInfoSection';
import UnifiedAttributionSection from '@/components/form/UnifiedAttributionSection';
import UnifiedLegendSection from '@/components/form/UnifiedLegendSection';
import SwipeLayerSourceSelection from './SwipeLayerSourceSelection';

interface SwipeLayerFormContainerProps {
  availableSources: DataSource[];
  interfaceGroups: string[];
  defaultInterfaceGroup?: string;
  onAddLayer: (layer: DataSource) => void;
  onCancel: () => void;
  editingLayer?: DataSource;
  isEditing?: boolean;
}

const SwipeLayerFormContainer = ({ 
  availableSources, 
  interfaceGroups, 
  defaultInterfaceGroup,
  onAddLayer, 
  onCancel, 
  editingLayer, 
  isEditing = false 
}: SwipeLayerFormContainerProps) => {
  const { toast } = useToast();
  
  // Basic info state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [interfaceGroup, setInterfaceGroup] = useState(defaultInterfaceGroup || '');
  const [isActive, setIsActive] = useState(false);
  
  // Source selection state
  const [clippedSourceName, setClippedSourceName] = useState('');
  const [baseSourceNames, setBaseSourceNames] = useState<string[]>([]);
  
  // Attribution state
  const [attributionText, setAttributionText] = useState('');
  const [attributionUrl, setAttributionUrl] = useState('');
  
  // Legend configuration state
  const [toggleable, setToggleable] = useState(true);
  const [opacitySlider, setOpacitySlider] = useState(false);
  const [zoomToCenter, setZoomToCenter] = useState(false);
  const [legendType, setLegendType] = useState<'swatch' | 'gradient' | 'image'>('swatch');
  const [legendUrl, setLegendUrl] = useState('');
  const [startColor, setStartColor] = useState('#000000');
  const [endColor, setEndColor] = useState('#ffffff');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  // Filter sources for validation
  const clippedSourceOptions = availableSources.filter(source => {
    const isBaseLayer = source.data.some(item => item.isBaseLayer === true);
    const isSwipeLayer = source.meta?.swipeConfig !== undefined;
    return !isBaseLayer && !isSwipeLayer;
  });

  const baseSourceOptions = availableSources.filter(source => {
    const isSwipeLayer = source.meta?.swipeConfig !== undefined;
    return !isSwipeLayer;
  });

  // Initialize form when editing
  useEffect(() => {
    if (isEditing && editingLayer) {
      setName(editingLayer.name);
      setDescription(editingLayer.meta?.description || '');
      setInterfaceGroup(editingLayer.layout?.interfaceGroup || '');
      setIsActive(editingLayer.isActive ?? false);
      setAttributionText(editingLayer.meta?.attribution?.text || '');
      setAttributionUrl(editingLayer.meta?.attribution?.url || '');
      
      if (editingLayer.meta?.swipeConfig) {
        setClippedSourceName(editingLayer.meta.swipeConfig.clippedSourceName);
        if ('baseSourceName' in editingLayer.meta.swipeConfig) {
          setBaseSourceNames([(editingLayer.meta.swipeConfig as any).baseSourceName]);
        } else {
          setBaseSourceNames(editingLayer.meta.swipeConfig.baseSourceNames || []);
        }
      }

      if (editingLayer.layout?.layerCard) {
        setToggleable(editingLayer.layout.layerCard.toggleable ?? true);
        setOpacitySlider(editingLayer.layout.layerCard.controls?.opacitySlider ?? false);
        setZoomToCenter((editingLayer.layout.layerCard.controls as any)?.zoomToCenter ?? false);
        
        if (editingLayer.layout.layerCard.legend) {
          setLegendType(editingLayer.layout.layerCard.legend.type);
          setLegendUrl(editingLayer.layout.layerCard.legend.url || '');
        }
        
        if (editingLayer.meta) {
          setStartColor(editingLayer.meta.startColor || '#000000');
          setEndColor(editingLayer.meta.endColor || '#ffffff');
          setMinValue(editingLayer.meta.min?.toString() || '');
          setMaxValue(editingLayer.meta.max?.toString() || '');
          setCategories(editingLayer.meta.categories || []);
        }
      }
    }
  }, [isEditing, editingLayer]);

  // Update base source options when clipped source changes
  useEffect(() => {
    if (clippedSourceName && baseSourceNames.includes(clippedSourceName)) {
      setBaseSourceNames(baseSourceNames.filter(name => name !== clippedSourceName));
    }
  }, [clippedSourceName, baseSourceNames]);

  const handleBasicInfoUpdate = (field: string, value: string) => {
    switch (field) {
      case 'name': setName(value); break;
      case 'description': setDescription(value); break;
      case 'interfaceGroup': setInterfaceGroup(value); break;
    }
  };

  const handleSourceSelectionUpdate = (field: string, value: any) => {
    switch (field) {
      case 'clippedSourceName': setClippedSourceName(value); break;
      case 'baseSourceNames': setBaseSourceNames(value); break;
    }
  };

  const handleAttributionUpdate = (field: string, value: string) => {
    switch (field) {
      case 'attributionText': setAttributionText(value); break;
      case 'attributionUrl': setAttributionUrl(value); break;
    }
  };

  const handleLegendConfigUpdate = (field: string, value: any) => {
    switch (field) {
      case 'toggleable': setToggleable(value); break;
      case 'opacitySlider': setOpacitySlider(value); break;
      case 'zoomToCenter': setZoomToCenter(value); break;
      case 'legendType': setLegendType(value); break;
      case 'legendUrl': setLegendUrl(value); break;
      case 'startColor': setStartColor(value); break;
      case 'endColor': setEndColor(value); break;
      case 'minValue': setMinValue(value); break;
      case 'maxValue': setMaxValue(value); break;
      case 'categories': setCategories(value); break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !clippedSourceName || baseSourceNames.length === 0 || !interfaceGroup) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields and select at least one base source.",
        variant: "destructive"
      });
      return;
    }

    if (baseSourceNames.includes(clippedSourceName)) {
      toast({
        title: "Invalid Configuration",
        description: "Clipped source cannot be included in base sources.",
        variant: "destructive"
      });
      return;
    }

    // Validate legend fields
    if (legendType === 'image' && !legendUrl.trim()) {
      toast({
        title: "Missing Legend URL",
        description: "Please provide a legend image URL.",
        variant: "destructive"
      });
      return;
    }

    if (legendType === 'gradient' && (!startColor || !endColor || !minValue || !maxValue)) {
      toast({
        title: "Missing Gradient Configuration",
        description: "Please provide all gradient configuration fields.",
        variant: "destructive"
      });
      return;
    }

    if (legendType === 'swatch' && categories.length === 0) {
      toast({
        title: "Missing Categories",
        description: "Swatch legends require at least one category.",
        variant: "destructive"
      });
      return;
    }

    const swipeLayer: DataSource = {
      name: name.trim(),
      isActive: isActive,
      data: [],
      meta: {
        description: description.trim(),
        attribution: {
          text: attributionText.trim(),
          url: attributionUrl.trim() || undefined
        },
        swipeConfig: {
          clippedSourceName,
          baseSourceNames
        },
        categories: legendType === 'swatch' ? categories : undefined,
        ...(legendType === 'gradient' && {
          min: parseFloat(minValue),
          max: parseFloat(maxValue),
          startColor,
          endColor
        })
      },
      layout: {
        interfaceGroup,
        layerCard: {
          toggleable,
          legend: {
            type: legendType,
            ...(legendType === 'image' && { url: legendUrl })
          },
          controls: {
            opacitySlider,
            zoomToCenter
          }
        }
      }
    };

    console.log('Submitting swipe layer:', swipeLayer);
    onAddLayer(swipeLayer);
    toast({
      title: isEditing ? "Swipe Layer Updated" : "Swipe Layer Added",
      description: `"${name}" has been ${isEditing ? 'updated' : 'added as a swipe layer'}.`,
    });
  };

  if (clippedSourceOptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <AlertTriangle className="h-5 w-5" />
            Cannot Create Swipe Layer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You need at least one regular layer card to use as a clipped source for a swipe layer. 
              Base layers and existing swipe layers cannot be used as clipped sources.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (baseSourceOptions.length < 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <AlertTriangle className="h-5 w-5" />
            Cannot Create Swipe Layer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You need at least one layer (base layer or layer card) to use as a base source for a swipe layer.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <SwitchCamera className="h-5 w-5" />
          {isEditing ? 'Edit Swipe Layer' : 'Add Swipe Layer'}
        </CardTitle>
        <CardDescription>
          Create a layer that allows users to swipe between a clipped layer and multiple base layers for comparison.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <UnifiedBasicInfoSection
            name={name}
            description={description}
            interfaceGroup={interfaceGroup}
            interfaceGroups={interfaceGroups}
            onUpdate={handleBasicInfoUpdate}
          />

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">Layer Settings</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive" className="text-sm">
                Active By Default
              </Label>
            </div>
            <p className="text-xs text-slate-500">
              When enabled, this layer will be active when the interface loads.
            </p>
          </div>

          <SwipeLayerSourceSelection
            clippedSourceName={clippedSourceName}
            baseSourceNames={baseSourceNames}
            availableSources={availableSources}
            onUpdate={handleSourceSelectionUpdate}
          />

          <UnifiedAttributionSection
            attributionText={attributionText}
            attributionUrl={attributionUrl}
            onUpdate={handleAttributionUpdate}
          />

          <UnifiedLegendSection
            toggleable={toggleable}
            opacitySlider={opacitySlider}
            zoomToCenter={zoomToCenter}
            legendType={legendType}
            legendUrl={legendUrl}
            startColor={startColor}
            endColor={endColor}
            minValue={minValue}
            maxValue={maxValue}
            categories={categories}
            onUpdate={handleLegendConfigUpdate}
            layerName={name}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Swipe Layer' : 'Add Swipe Layer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SwipeLayerFormContainer;
