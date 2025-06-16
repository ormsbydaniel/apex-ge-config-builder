import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Edit3, Copy } from 'lucide-react';
import { Category } from '@/types/config';
import { useConfig } from '@/contexts/ConfigContext';
import { useToast } from '@/hooks/use-toast';

interface CategoryEditorDialogProps {
  categories: Category[];
  onUpdate: (categories: Category[]) => void;
  trigger?: React.ReactNode;
  layerName?: string;
}

const CategoryEditorDialog = ({ categories, onUpdate, trigger, layerName }: CategoryEditorDialogProps) => {
  const { config } = useConfig();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [useValues, setUseValues] = useState(categories.some(cat => cat.value !== undefined));
  const [newCategory, setNewCategory] = useState<Category>({
    label: '',
    color: '#000000',
    value: 0
  });
  const [showCopyConfirmation, setShowCopyConfirmation] = useState(false);
  const [selectedSourceLayer, setSelectedSourceLayer] = useState<string>('');

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalCategories([...categories]);
      setUseValues(categories.some(cat => cat.value !== undefined));
    }
    setOpen(isOpen);
  };

  // Get available layers with categories for copying
  const availableSourceLayers = config.sources
    .filter(source => source.meta?.categories && source.meta.categories.length > 0)
    .map(source => {
      // Ensure categories have proper defaults for required properties
      const normalizedCategories: Category[] = (source.meta?.categories || []).map((cat, index) => ({
        label: cat.label || `Category ${index + 1}`,
        color: cat.color || '#000000',
        value: cat.value !== undefined ? cat.value : index
      }));

      return {
        name: source.name || 'Unnamed Layer',
        categories: normalizedCategories,
        hasValues: normalizedCategories.some(cat => cat.value !== undefined)
      };
    });

  const addCategory = () => {
    if (newCategory.label.trim()) {
      const categoryToAdd: Category = {
        color: newCategory.color,
        label: newCategory.label,
        value: useValues ? (newCategory.value !== undefined ? newCategory.value : localCategories.length) : localCategories.length
      };
      setLocalCategories([...localCategories, categoryToAdd]);
      setNewCategory({
        label: '',
        color: '#000000',
        value: 0
      });
    }
  };

  const updateCategory = (index: number, field: keyof Category, value: any) => {
    const updated = localCategories.map((cat, i) => {
      if (i === index) {
        if (field === 'value' && !useValues) {
          return cat;
        }
        return { ...cat, [field]: value };
      }
      return cat;
    });
    setLocalCategories(updated);
  };

  const removeCategory = (index: number) => {
    setLocalCategories(localCategories.filter((_, i) => i !== index));
  };

  const handleUseValuesToggle = (checked: boolean) => {
    setUseValues(checked);
    if (checked) {
      const updatedCategories = localCategories.map((cat, index) => ({
        ...cat,
        value: cat.value !== undefined ? cat.value : index
      }));
      setLocalCategories(updatedCategories);
      if (newCategory.value === undefined) {
        setNewCategory(prev => ({ ...prev, value: localCategories.length }));
      }
    } else {
      const updatedCategories = localCategories.map((cat, index) => ({
        ...cat,
        value: index
      }));
      setLocalCategories(updatedCategories);
      setNewCategory(prev => ({ ...prev, value: 0 }));
    }
  };

  const handleCopyFromLayer = () => {
    if (!selectedSourceLayer) return;
    
    const sourceLayer = availableSourceLayers.find(layer => layer.name === selectedSourceLayer);
    if (!sourceLayer) return;

    // Check if we have existing categories
    if (localCategories.length > 0) {
      setShowCopyConfirmation(true);
    } else {
      performCopy(sourceLayer);
    }
  };

  const performCopy = (sourceLayer: { categories: Category[]; hasValues: boolean; name: string }) => {
    // Deep copy categories to avoid reference issues
    const copiedCategories = sourceLayer.categories.map(cat => ({ ...cat }));
    
    setLocalCategories(copiedCategories);
    setUseValues(sourceLayer.hasValues);
    setShowCopyConfirmation(false);
    
    toast({
      title: "Categories Copied",
      description: `Copied ${copiedCategories.length} categories from "${sourceLayer.name}".`,
    });
  };

  const handleSave = () => {
    onUpdate(localCategories);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalCategories([...categories]);
    setUseValues(categories.some(cat => cat.value !== undefined));
    setOpen(false);
  };

  const selectedSourceLayerData = availableSourceLayers.find(layer => layer.name === selectedSourceLayer);

  const defaultTrigger = (
    <Button type="button" variant="outline" size="sm">
      <Edit3 className="h-4 w-4 mr-2" />
      Edit Categories ({categories.length})
    </Button>
  );

  // Determine default tab based on context
  const defaultTab = localCategories.length === 0 && availableSourceLayers.length > 0 ? "copy" : "manual";

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {layerName ? `Edit Categories for ${layerName}` : 'Edit Categories'}
            </DialogTitle>
            <DialogDescription>
              Add, edit, or remove categories for your legend.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue={defaultTab} className="w-full">
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

              <TabsContent value="manual" className="space-y-4 mt-4">
                {/* Use Values Toggle */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Use Category Values</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable numeric values for categories (useful for statistics and data mapping)
                    </p>
                  </div>
                  <Switch
                    checked={useValues}
                    onCheckedChange={handleUseValuesToggle}
                  />
                </div>

                {/* Add New Category */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                  <Label className="text-sm font-medium">Add New Category</Label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 rounded border cursor-pointer"
                      title="Category color"
                    />
                    <Input
                      value={newCategory.label}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="Category label"
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    />
                    {useValues && (
                      <Input
                        type="number"
                        value={newCategory.value !== undefined ? newCategory.value : ''}
                        onChange={(e) => setNewCategory(prev => ({ 
                          ...prev, 
                          value: e.target.value ? parseInt(e.target.value) : 0 
                        }))}
                        placeholder="Value"
                        className="w-20"
                      />
                    )}
                    <Button type="button" onClick={addCategory} disabled={!newCategory.label.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Existing Categories - Compact Table Style */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Categories ({localCategories.length})
                  </Label>
                  
                  {localCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No categories defined. Add your first category above.
                    </p>
                  ) : (
                    <div className="bg-muted/20 rounded-lg overflow-hidden">
                      {localCategories.map((category, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center gap-3 px-3 py-2 ${
                            index % 2 === 0 ? 'bg-background/50' : 'bg-transparent'
                          } hover:bg-muted/50 transition-colors`}
                        >
                          <input
                            type="color"
                            value={category.color}
                            onChange={(e) => updateCategory(index, 'color', e.target.value)}
                            className="w-8 h-8 rounded border cursor-pointer flex-shrink-0"
                            title="Category color"
                          />
                          
                          <Input
                            value={category.label}
                            onChange={(e) => updateCategory(index, 'label', e.target.value)}
                            placeholder="Category label"
                            className="flex-1 h-8 text-sm"
                          />
                          
                          {useValues && (
                            <Input
                              type="number"
                              value={category.value !== undefined ? category.value : ''}
                              onChange={(e) => updateCategory(index, 'value', e.target.value ? parseInt(e.target.value) : 0)}
                              placeholder="Value"
                              className="w-16 h-8 text-sm"
                            />
                          )}
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCategory(index)}
                            className="text-destructive hover:text-destructive h-8 w-8 p-0 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview */}
                {localCategories.length > 0 && (
                  <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                    <Label className="text-sm font-medium">Preview</Label>
                    <div className="flex flex-wrap gap-1">
                      {localCategories.map((category, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.label || `Category ${index + 1}`}
                          {useValues && category.value !== undefined && (
                            <span className="text-xs text-muted-foreground ml-1">({category.value})</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="copy" className="space-y-4 mt-4">
                {availableSourceLayers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No other layers with categories found. Create categories in other layers first to use this feature.
                  </p>
                ) : (
                  <>
                    {/* Layer Selection */}
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <Label className="text-sm font-medium">Copy from Another Layer</Label>
                      <div className="flex gap-3">
                        <Select value={selectedSourceLayer} onValueChange={setSelectedSourceLayer}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a layer to copy from..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSourceLayers.map((layer) => (
                              <SelectItem key={layer.name} value={layer.name}>
                                {layer.name} ({layer.categories.length} categories)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          onClick={handleCopyFromLayer}
                          disabled={!selectedSourceLayer}
                          variant="outline"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      {selectedSourceLayerData && (
                        <p className="text-xs text-muted-foreground">
                          Will copy {selectedSourceLayerData.categories.length} categories
                          {selectedSourceLayerData.hasValues ? ' (with values)' : ' (without values)'}
                        </p>
                      )}
                    </div>

                    {/* Source Layer Preview */}
                    {selectedSourceLayerData && (
                      <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                        <Label className="text-sm font-medium">Preview: {selectedSourceLayerData.name}</Label>
                        <div className="flex flex-wrap gap-1">
                          {selectedSourceLayerData.categories.map((category, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.label || `Category ${index + 1}`}
                              {selectedSourceLayerData.hasValues && category.value !== undefined && (
                                <span className="text-xs text-muted-foreground ml-1">({category.value})</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Dialog Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save Categories
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Copy Confirmation Dialog */}
      <AlertDialog open={showCopyConfirmation} onOpenChange={setShowCopyConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Existing Categories?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current {localCategories.length} categories with {selectedSourceLayerData?.categories.length} categories from "{selectedSourceLayer}".
              {selectedSourceLayerData?.hasValues !== useValues && (
                <span className="block mt-2 text-amber-600">
                  Note: The value settings will also change to match the source layer.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedSourceLayerData && performCopy(selectedSourceLayerData)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Replace All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CategoryEditorDialog;
