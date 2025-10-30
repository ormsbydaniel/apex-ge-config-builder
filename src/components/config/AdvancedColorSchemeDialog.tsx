import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RotateCcw } from 'lucide-react';

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
  const [originalColors, setOriginalColors] = useState<Record<string, string>>(DEFAULT_THEME_COLORS);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load colors when dialog opens
  useEffect(() => {
    if (open && config.layout?.theme) {
      const updatedColors = { ...DEFAULT_THEME_COLORS };
      Object.keys(DEFAULT_THEME_COLORS).forEach((key) => {
        if (config.layout.theme[key]) {
          updatedColors[key] = config.layout.theme[key];
        }
      });
      setColors(updatedColors);
      setOriginalColors(updatedColors);
    }
  }, [open, config.layout?.theme]);

  const hasChanges = () => {
    return Object.keys(colors).some(key => colors[key] !== originalColors[key]);
  };

  const handleColorChange = (key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleResetToDefault = (key: string) => {
    setColors(prev => ({ ...prev, [key]: DEFAULT_THEME_COLORS[key] }));
  };

  const handleApplyChanges = () => {
    Object.entries(colors).forEach(([key, value]) => {
      if (value !== originalColors[key]) {
        dispatch({
          type: 'UPDATE_THEME',
          payload: { field: key, value }
        });
      }
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    setColors(originalColors);
    onOpenChange(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open && hasChanges()) {
      setShowConfirmDialog(true);
    } else {
      onOpenChange(open);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Advanced Color Scheme</DialogTitle>
            <DialogDescription>
              Customize all color properties for your application theme
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[calc(90vh-200px)] pr-4">
            <div className="space-y-8">
              {COLOR_GROUPS.map((group) => (
                <div key={group.title} className="space-y-4">
                  <h3 className="font-semibold text-lg">{group.title}</h3>
                  <div className="grid gap-4">
                    {group.colors.map(({ key, label }) => (
                      <div key={key} className="grid grid-cols-[180px_70px_1fr_auto] gap-3 items-center">
                        <Label htmlFor={key} className="text-sm">
                          {label}
                        </Label>
                        <Input
                          id={key}
                          type="color"
                          value={colors[key]}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          className="h-10 w-16 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={colors[key]}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          placeholder="#000000"
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetToDefault(key)}
                          title="Reset to default"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleApplyChanges}>
              Apply Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved color changes. Do you want to apply them before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowConfirmDialog(false);
              handleCancel();
            }}>
              Cancel Changes
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowConfirmDialog(false);
              handleApplyChanges();
            }}>
              Apply Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
