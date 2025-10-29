import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

const DEFAULT_THEME_COLORS = {
  'primary-color': '#003247',
  'secondary-color': '#335e6f',
  'tertiary-color': '#008e7a',
  'accent-color': '#fbab18',
  'background-color': '#f3f7f8',
  'foreground-color': '#ffffff',
  'text-color-primary': '#ffffff',
  'text-color-secondary': '#333333',
  'disabled-color': '#dfdfdf',
  'border-color': '#8197a6',
  'success-color': '#28a745',
  'text-color-on-success': '#ffffff',
  'error-color': '#dc3545',
  'text-color-on-error': '#ffffff',
  'warning-color': '#ffc107',
  'text-color-on-warning': '#212529',
};

const COLOR_GROUPS = [
  {
    title: 'Base Colors',
    colors: [
      { key: 'primary-color', label: 'Primary' },
      { key: 'secondary-color', label: 'Secondary' },
      { key: 'tertiary-color', label: 'Tertiary' },
      { key: 'accent-color', label: 'Accent' },
    ]
  },
  {
    title: 'Background & Foreground',
    colors: [
      { key: 'background-color', label: 'Background' },
      { key: 'foreground-color', label: 'Foreground' },
    ]
  },
  {
    title: 'Text Colors',
    colors: [
      { key: 'text-color-primary', label: 'Text Primary' },
      { key: 'text-color-secondary', label: 'Text Secondary' },
    ]
  },
  {
    title: 'UI Element Colors',
    colors: [
      { key: 'disabled-color', label: 'Disabled' },
      { key: 'border-color', label: 'Border' },
    ]
  },
  {
    title: 'State Colors',
    colors: [
      { key: 'success-color', label: 'Success' },
      { key: 'text-color-on-success', label: 'Text on Success' },
      { key: 'error-color', label: 'Error' },
      { key: 'text-color-on-error', label: 'Text on Error' },
      { key: 'warning-color', label: 'Warning' },
      { key: 'text-color-on-warning', label: 'Text on Warning' },
    ]
  },
];

interface AdvancedColorSchemeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: any;
  dispatch: any;
}

export function AdvancedColorSchemeDialog({ 
  open, 
  onOpenChange, 
  config, 
  dispatch 
}: AdvancedColorSchemeDialogProps) {
  const [colors, setColors] = useState<Record<string, string>>(DEFAULT_THEME_COLORS);

  useEffect(() => {
    if (config.layout?.theme) {
      const updatedColors = { ...DEFAULT_THEME_COLORS };
      Object.keys(DEFAULT_THEME_COLORS).forEach((key) => {
        if (config.layout.theme[key]) {
          updatedColors[key] = config.layout.theme[key];
        }
      });
      setColors(updatedColors);
    }
  }, [config.layout?.theme]);

  const handleColorChange = (key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
    dispatch({
      type: 'UPDATE_THEME',
      payload: { field: key, value }
    });
  };

  const handleResetAll = () => {
    Object.entries(DEFAULT_THEME_COLORS).forEach(([key, value]) => {
      dispatch({
        type: 'UPDATE_THEME',
        payload: { field: key, value }
      });
    });
    setColors(DEFAULT_THEME_COLORS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Advanced Color Scheme</DialogTitle>
          <DialogDescription>
            Customize all color properties for your application theme
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-8">
            {COLOR_GROUPS.map((group) => (
              <div key={group.title} className="space-y-4">
                <h3 className="font-semibold text-lg">{group.title}</h3>
                <div className="grid gap-4">
                  {group.colors.map(({ key, label }) => (
                    <div key={key} className="grid grid-cols-[200px_80px_1fr_60px] gap-4 items-center">
                      <Label htmlFor={key} className="text-sm">
                        {label}
                      </Label>
                      <Input
                        id={key}
                        type="color"
                        value={colors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="h-10 w-20 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={colors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        placeholder="#000000"
                        className="font-mono text-sm"
                      />
                      <div
                        className="h-10 w-full rounded border border-border"
                        style={{ backgroundColor: colors[key] }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleResetAll}>
            Reset All to Defaults
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
