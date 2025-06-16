
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface ExportOptions {
  singleItemArrayToObject: boolean;
  configureCogsAsImages: boolean;
}

interface ExportOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => void;
}

const ExportOptionsDialog = ({ open, onOpenChange, onExport }: ExportOptionsDialogProps) => {
  const { control, handleSubmit, watch } = useForm<ExportOptions>({
    defaultValues: {
      singleItemArrayToObject: false,
      configureCogsAsImages: false
    }
  });

  const onSubmit = (data: ExportOptions) => {
    console.log('Form submitted with data:', data);
    onExport(data);
    onOpenChange(false);
  };

  const handleQuickExport = () => {
    onExport({ singleItemArrayToObject: false, configureCogsAsImages: false });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Configuration</DialogTitle>
          <DialogDescription>
            Choose export options to customize the output format.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Controller
                name="singleItemArrayToObject"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="singleItemArrayToObject"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="singleItemArrayToObject" className="text-sm">
                Export single item data arrays as data object
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Convert layers with single data items from arrays to objects for simpler format
            </p>

            <div className="flex items-center space-x-2">
              <Controller
                name="configureCogsAsImages"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="configureCogsAsImages"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="configureCogsAsImages" className="text-sm">
                Configure COGs as images
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Consolidate COG items into single objects with images arrays
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleQuickExport}>
              Quick Export (Default)
            </Button>
            <Button type="submit">
              Export with Options
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExportOptionsDialog;
