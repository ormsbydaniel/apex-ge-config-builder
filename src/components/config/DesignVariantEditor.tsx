import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Layout } from 'lucide-react';
import { DesignConfig } from '@/types/format';

// Predefined design variants - only Fullscreen and Sidebar
const DESIGN_VARIANTS = [
  { value: 'fullscreen', label: 'Fullscreen' },
  { value: 'sidebar', label: 'Sidebar' },
] as const;

interface DesignVariantEditorProps {
  design?: DesignConfig;
  onUpdate: (design: DesignConfig | undefined) => void;
}

const DesignVariantEditor = ({ design, onUpdate }: DesignVariantEditorProps) => {
  const handleVariantChange = (value: string) => {
    onUpdate({
      variant: value,
      parameters: design?.parameters,
    });
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Design Variant</h3>
      
      {/* Variant Selector */}
      <div className="flex items-start gap-6">
        <div className="flex items-center gap-2 pt-2 w-[180px]">
          <Layout className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-medium whitespace-nowrap">Layout Variant</Label>
        </div>
        <div className="flex-1">
          <div className="flex gap-2">
            <Select value={design?.variant || ''} onValueChange={handleVariantChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a design variant..." />
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
          <p className="text-xs text-muted-foreground mt-1">
            Select the UI layout variant for the explorer
          </p>
        </div>
      </div>

      {/* Parameters Editor */}
      {design?.variant && (
        <div className="flex items-start gap-6">
          <div className="flex items-center gap-2 pt-2 w-[180px]">
            <Label className="text-base font-medium whitespace-nowrap">Parameters</Label>
          </div>
          <div className="flex-1 space-y-2">
            {parameters.length === 0 ? (
              <p className="text-sm text-muted-foreground pt-2">No parameters configured.</p>
            ) : (
              <div className="space-y-2">
                {parameters.map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <Input
                      value={key}
                      onChange={(e) => handleUpdateParameter(key, e.target.value, value)}
                      placeholder="Key"
                      className="w-[140px] text-sm"
                    />
                    <Input
                      value={String(value)}
                      onChange={(e) => handleUpdateParameter(key, key, e.target.value)}
                      placeholder="Value"
                      className="w-[140px] text-sm"
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
        </div>
      )}
    </div>
  );
};

export default DesignVariantEditor;
