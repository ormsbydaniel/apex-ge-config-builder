import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X, Globe } from 'lucide-react';
import { DataSource } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { sanitizeUrl, isValidUrl } from '@/utils/urlSanitizer';

interface BaseLayerFormProps {
  onAddLayer: (layer: DataSource) => void;
  onCancel: () => void;
  editingLayer?: DataSource;
  isEditing?: boolean;
}

const BaseLayerForm = ({ onAddLayer, onCancel, editingLayer, isEditing = false }: BaseLayerFormProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<string>('xyz');
  const [zIndex, setZIndex] = useState(0);

  useEffect(() => {
    if (isEditing && editingLayer) {
      setName(editingLayer.name);
      // Data is always an array now
      if (editingLayer.data.length > 0) {
        const firstDataSource = editingLayer.data[0];
        const sanitizedUrl = sanitizeUrl(firstDataSource.url || '');
        setUrl(sanitizedUrl);
        setFormat(firstDataSource.format);
        setZIndex(firstDataSource.zIndex || 0);
      }
    }
  }, [isEditing, editingLayer]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawUrl = e.target.value;
    console.log(`URL input change: "${rawUrl}"`);
    setUrl(rawUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedUrl = sanitizeUrl(url);
    console.log(`Form submission - Original URL: "${url}", Sanitized: "${sanitizedUrl}"`);
    
    if (!name.trim() || !sanitizedUrl.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in name and URL.",
        variant: "destructive"
      });
      return;
    }

    if (!isValidUrl(sanitizedUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL or relative path.",
        variant: "destructive"
      });
      return;
    }

    // Data is always an array - even for single items
    const baseLayer: DataSource = {
      name: name.trim(),
      isActive: editingLayer?.isActive ?? true,
      data: [
        {
          url: sanitizedUrl,
          format,
          zIndex,
          isBaseLayer: true
        }
      ],
      statistics: editingLayer?.statistics, // Preserve existing statistics when editing
      ...(editingLayer?.meta && { meta: editingLayer.meta })
    };

    console.log(`Submitting base layer with URL: "${sanitizedUrl}"`);
    onAddLayer(baseLayer);
    toast({
      title: isEditing ? "Base Layer Updated" : "Base Layer Added",
      description: `"${name}" has been ${isEditing ? 'updated' : 'added as a base layer'}.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Globe className="h-5 w-5" />
          {isEditing ? 'Edit Base Layer' : 'Add Base Layer'}
        </CardTitle>
        <CardDescription>
          Configure a background map layer for your geospatial explorer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Layer Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., OpenStreetMap"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Tile URL *</Label>
            <Input
              id="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xyz">XYZ Tiles</SelectItem>
                <SelectItem value="wms">WMS</SelectItem>
                <SelectItem value="wmts">WMTS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zIndex">Z-Index</Label>
            <Input
              id="zIndex"
              type="number"
              value={zIndex}
              onChange={(e) => setZIndex(parseInt(e.target.value) || 0)}
              min="0"
              max="100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Base Layer' : 'Add Base Layer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BaseLayerForm;
