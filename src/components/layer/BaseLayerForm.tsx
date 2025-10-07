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
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  
  // Modal state
  const [showDataSourceModal, setShowDataSourceModal] = useState(false);

  useEffect(() => {
    if (isEditing && editingLayer) {
      setName(editingLayer.name);
      setIsActive(editingLayer.isActive ?? false);
      setDataSources(editingLayer.data || []);
      
      if (editingLayer.meta) {
      setAttributionText(editingLayer.meta.attribution?.text || '');
        setAttributionUrl(editingLayer.meta.attribution?.url || '');
        setPreviewUrl(editingLayer.meta.preview || '');
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
    if (attributionText || previewUrl) {
      baseLayer.meta = {
        description: '',
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
            Configure your base layer information and add data sources. Multiple sources will be displayed together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-end gap-4">
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
                <div className="flex-1 flex items-center gap-2 pb-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive" className="text-sm cursor-pointer">
                    Display on Load
                  </Label>
                </div>
              </div>

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
            </div>

            {/* Data Sources */}
            <div className="space-y-4">
              <Label>Data Sources ({dataSources.length})</Label>

              {dataSources.length === 0 ? (
                <div className="p-6 border-2 border-dashed rounded-lg">
                  <div className="flex items-center gap-4">
                    <Globe className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <p className="text-muted-foreground">
                      No data sources added yet. Click the button below to add your first data source.
                    </p>
                  </div>
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

              <div className="flex items-center gap-3">
                <p className="flex-[0.8] text-sm text-muted-foreground">
                  A Geospatial Explorer base map can include multiple data sources that are both displayed when the base map is selected.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDataSourceModal(true)}
                  className="flex-[0.2] min-w-fit"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {dataSources.length === 0 ? 'Add Data Source' : 'Add Another Source'}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={dataSources.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                Finish
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default BaseLayerForm;
