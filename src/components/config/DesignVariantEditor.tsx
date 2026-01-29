import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { DesignConfig } from '@/types/format';

// Predefined design variants
const DESIGN_VARIANTS = [
  { value: 'fullscreen', label: 'Fullscreen' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'custom', label: 'Custom...' },
] as const;

interface DesignVariantEditorProps {
  design?: DesignConfig;
  onUpdate: (design: DesignConfig | undefined) => void;
}

const DesignVariantEditor = ({ design, onUpdate }: DesignVariantEditorProps) => {
  const [customVariant, setCustomVariant] = React.useState('');
  const isCustom = design?.variant && !DESIGN_VARIANTS.some(v => v.value === design.variant && v.value !== 'custom');

  const handleVariantChange = (value: string) => {
    if (value === 'custom') {
      // Don't update yet, wait for custom input
      return;
    }
    onUpdate({
      variant: value,
      parameters: design?.parameters,
    });
  };

  const handleCustomVariantSubmit = () => {
    if (customVariant.trim()) {
      onUpdate({
        variant: customVariant.trim(),
        parameters: design?.parameters,
      });
      setCustomVariant('');
    }
  };

  const handleAddParameter = () => {
    const currentParams = design?.parameters || {};
    const newKey = `param${Object.keys(currentParams).length + 1}`;
    onUpdate({
      variant: design?.variant || 'fullscreen',
      parameters: {
        ...currentParams,
        [newKey]: '',
      },
    });
  };

  const handleUpdateParameter = (oldKey: string, newKey: string, value: unknown) => {
    const currentParams = { ...(design?.parameters || {}) };
    
    if (oldKey !== newKey) {
      delete currentParams[oldKey];
    }
    currentParams[newKey] = value;

    onUpdate({
      variant: design?.variant || 'fullscreen',
      parameters: currentParams,
    });
  };

  const handleRemoveParameter = (key: string) => {
    const currentParams = { ...(design?.parameters || {}) };
    delete currentParams[key];

    onUpdate({
      variant: design?.variant || 'fullscreen',
      parameters: Object.keys(currentParams).length > 0 ? currentParams : undefined,
    });
  };

  const handleClearDesign = () => {
    onUpdate(undefined);
  };

  const parameters = Object.entries(design?.parameters || {});
  const selectedValue = isCustom ? 'custom' : (design?.variant || '');

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-primary text-base">Design Variant</CardTitle>
        <CardDescription>
          Configure the UI layout variant and its parameters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Variant Selector */}
        <div className="space-y-2">
          <Label htmlFor="variant" className="text-slate-700 font-medium">Variant</Label>
          <div className="flex gap-2">
            <Select value={selectedValue} onValueChange={handleVariantChange}>
              <SelectTrigger className="border-primary/30 focus:border-primary">
                <SelectValue placeholder="Select a design variant">
                  {isCustom ? design?.variant : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {DESIGN_VARIANTS.map((variant) => (
                  <SelectItem key={variant.value} value={variant.value}>
                    {variant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {design?.variant && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearDesign}
                className="text-destructive hover:text-destructive"
                title="Clear design configuration"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Custom variant input */}
        {selectedValue === 'custom' && !isCustom && (
          <div className="flex gap-2">
            <Input
              value={customVariant}
              onChange={(e) => setCustomVariant(e.target.value)}
              placeholder="Enter custom variant name"
              className="border-primary/30 focus:border-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleCustomVariantSubmit()}
            />
            <Button onClick={handleCustomVariantSubmit} className="bg-primary hover:bg-primary/90">
              Set
            </Button>
          </div>
        )}

        {/* Show current custom variant */}
        {isCustom && (
          <div className="text-sm text-muted-foreground">
            Custom variant: <span className="font-medium text-foreground">{design?.variant}</span>
          </div>
        )}

        {/* Parameters Editor */}
        {design?.variant && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-700 font-medium">Parameters</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddParameter}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Parameter
              </Button>
            </div>
            
            {parameters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No parameters configured.</p>
            ) : (
              <div className="space-y-2">
                {parameters.map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <Input
                      value={key}
                      onChange={(e) => handleUpdateParameter(key, e.target.value, value)}
                      placeholder="Key"
                      className="flex-1 border-primary/30 focus:border-primary text-sm"
                    />
                    <Input
                      value={String(value)}
                      onChange={(e) => handleUpdateParameter(key, key, e.target.value)}
                      placeholder="Value"
                      className="flex-1 border-primary/30 focus:border-primary text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveParameter(key)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DesignVariantEditor;
