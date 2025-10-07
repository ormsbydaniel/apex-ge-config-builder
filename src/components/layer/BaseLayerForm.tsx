import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save, X, Globe, Plus, Trash2 } from 'lucide-react';
import { DataSource, DataSourceItem, Service } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DataSourceForm from '@/components/layers/DataSourceForm';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BaseLayerFormProps {
  onAddLayer: (layer: DataSource) => void;
  onCancel: () => void;
  editingLayer?: DataSource;
  isEditing?: boolean;
  services: Service[];
  onAddService: (service: Service) => void;
}

const BaseLayerForm = ({ onAddLayer, onCancel, editingLayer, isEditing = false, services, onAddService }: BaseLayerFormProps) => {
  const { toast } = useToast();
  
  // Form state
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [attributionText, setAttributionText] = useState('');
  const [attributionUrl, setAttributionUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [description, setDescription] = useState('');
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  
  // Modal state
  const [showDataSourceModal, setShowDataSourceModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<'basic' | 'datasources'>('basic');

  useEffect(() => {
    if (isEditing && editingLayer) {
      setName(editingLayer.name);
      setIsActive(editingLayer.isActive ?? false);
      setDataSources(editingLayer.data || []);
      
      if (editingLayer.meta) {
        setDescription(editingLayer.meta.description || '');
        setAttributionText(editingLayer.meta.attribution?.text || '');
        setAttributionUrl(editingLayer.meta.attribution?.url || '');
        setPreviewUrl(editingLayer.meta.preview || '');
      }
      
      // Start on datasources step if editing and already has name
      if (editingLayer.name) {
        setCurrentStep('datasources');
      }
    }
  }, [isEditing, editingLayer]);

  const handleAddDataSource = (dataSource: DataSourceItem) => {
    setDataSources(prev => [...prev, dataSource]);
    setShowDataSourceModal(false);
  };

  const handleRemoveDataSource = (index: number) => {
    setDataSources(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please provide a layer name.",
        variant: "destructive"
      });
      return;
    }

    if (dataSources.length === 0) {
      toast({
        title: "Missing Data Sources",
        description: "Please add at least one data source.",
        variant: "destructive"
      });
      return;
    }

    // Build the base layer object
    const baseLayer: DataSource = {
      name: name.trim(),
      isActive,
      isBaseLayer: true,
      data: dataSources,
      exclusivitySets: editingLayer?.exclusivitySets || ['basemaps'],
      statistics: editingLayer?.statistics,
    };

    // Add meta if any meta fields are provided
    if (description || attributionText || previewUrl) {
      baseLayer.meta = {
        description: description.trim(),
        attribution: {
          text: attributionText.trim(),
          ...(attributionUrl.trim() && { url: attributionUrl.trim() })
        },
        ...(previewUrl.trim() && { preview: previewUrl.trim() })
      };
    }

    onAddLayer(baseLayer);
    toast({
      title: isEditing ? "Base Layer Updated" : "Base Layer Added",
      description: `"${name}" has been ${isEditing ? 'updated' : 'added as a base layer'}.`,
    });
  };

  const handleNext = () => {
    if (!name.trim()) {
      toast({
        title: "Missing Layer Name",
        description: "Please provide a layer name before proceeding.",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep('datasources');
  };

  const handleBack = () => {
    setCurrentStep('basic');
  };

  return (
    <>
      {/* Data Source Modal */}
      <Dialog open={showDataSourceModal} onOpenChange={setShowDataSourceModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Data Source to Base Layer</DialogTitle>
          </DialogHeader>
          <DataSourceForm
            services={services}
            onAddDataSource={handleAddDataSource}
            onAddStatisticsLayer={handleAddDataSource}
            onAddService={onAddService}
            onCancel={() => setShowDataSourceModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Globe className="h-5 w-5" />
            {isEditing ? 'Edit Base Layer' : 'Add Base Layer'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'basic' 
              ? 'Configure basic information and metadata for your base layer.'
              : 'Add data sources to your base layer. You can add multiple sources to the same base map.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 'basic' ? (
              // Step 1: Basic Info
              <>
                <div className="flex items-start gap-4">
                  <div className="w-2/3 space-y-2">
                    <Label htmlFor="name">Layer Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., OpenStreetMap"
                      required
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="isActive">Display on Load</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isActive"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                      <span className="text-sm text-muted-foreground">
                        Toggle on when map loads
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this base layer"
                  />
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Attribution (Optional)</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="attributionText">Attribution Text</Label>
                    <Input
                      id="attributionText"
                      value={attributionText}
                      onChange={(e) => setAttributionText(e.target.value)}
                      placeholder="e.g., © OpenStreetMap contributors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attributionUrl">Attribution URL</Label>
                    <Input
                      id="attributionUrl"
                      type="url"
                      value={attributionUrl}
                      onChange={(e) => setAttributionUrl(e.target.value)}
                      placeholder="https://www.openstreetmap.org/copyright"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previewUrl">Preview Image URL (Optional)</Label>
                  <Input
                    id="previewUrl"
                    type="url"
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    placeholder="https://example.com/preview.png"
                  />
                  <p className="text-xs text-muted-foreground">
                    A thumbnail image shown in the base layer selector
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Next: Add Data Sources
                  </Button>
                </div>
              </>
            ) : (
              // Step 2: Data Sources
              <>
                <Alert>
                  <AlertDescription>
                    Add one or more data sources to this base layer. Multiple sources will be combined into the same base map layer.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Data Sources ({dataSources.length})</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDataSourceModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {dataSources.length === 0 ? 'Add Data Source' : 'Add Another Source'}
                    </Button>
                  </div>

                  {dataSources.length === 0 ? (
                    <div className="p-8 border-2 border-dashed rounded-lg text-center">
                      <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        No data sources added yet. Click the button above to add your first data source.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dataSources.map((source, index) => (
                        <Card key={index} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary">{source.format.toUpperCase()}</Badge>
                                  <Badge variant="outline">Z-Index: {source.zIndex}</Badge>
                                  {source.layers && (
                                    <Badge variant="outline" className="truncate max-w-[200px]">
                                      {source.layers}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {source.url || 'No URL specified'}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDataSource(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={dataSources.length === 0}>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? 'Update Base Layer' : 'Add Base Layer'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default BaseLayerForm;
