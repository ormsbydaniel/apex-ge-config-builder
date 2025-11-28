
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface ExportOptions {
  singleItemArrayToObject: boolean;
  configureCogsAsImages: boolean;
  removeEmptyCategories: boolean;
  includeCategoryValues: boolean;
  addNormalizeFalseToCogs: boolean;
  transformSwipeLayersToData: boolean;
  changeFormatToType: boolean;
  sortToMatchUiOrder: boolean;
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
      configureCogsAsImages: false,
      removeEmptyCategories: false,
      includeCategoryValues: true,
      addNormalizeFalseToCogs: false,
      transformSwipeLayersToData: false,
      changeFormatToType: false,
      sortToMatchUiOrder: false
    }
  });

  const onSubmit = (data: ExportOptions) => {
    
    onExport(data);
    onOpenChange(false);
  };

  const handleQuickExport = () => {
    onExport({ 
      singleItemArrayToObject: false, 
      configureCogsAsImages: false, 
      removeEmptyCategories: false,
      includeCategoryValues: true,
      addNormalizeFalseToCogs: false,
      transformSwipeLayersToData: false,
      changeFormatToType: false,
      sortToMatchUiOrder: false
    });
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

            <div className="flex items-center space-x-2">
              <Controller
                name="removeEmptyCategories"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="removeEmptyCategories"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="removeEmptyCategories" className="text-sm">
                Remove empty categories
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Remove categories arrays that are empty from the exported JSON
            </p>

            <div className="flex items-center space-x-2">
              <Controller
                name="includeCategoryValues"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="includeCategoryValues"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="includeCategoryValues" className="text-sm">
                Include category values
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Include numeric values in category definitions (if present)
            </p>

            <div className="flex items-center space-x-2">
              <Controller
                name="addNormalizeFalseToCogs"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="addNormalizeFalseToCogs"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="addNormalizeFalseToCogs" className="text-sm">
                Add normalize FALSE to COGs
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Add normalize: false property to all COG items in the exported configuration
            </p>

            <div className="flex items-center space-x-2">
              <Controller
                name="transformSwipeLayersToData"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="transformSwipeLayersToData"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="transformSwipeLayersToData" className="text-sm">
                Transform swipe layers to data objects
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Convert swipe layers from empty data arrays to structured data objects with clipped and base sources
            </p>

            <div className="flex items-center space-x-2">
              <Controller
                name="changeFormatToType"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="changeFormatToType"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="changeFormatToType" className="text-sm">
                Change data.format to data.type
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Convert format properties to type properties in data objects for external compatibility
            </p>

            <div className="flex items-center space-x-2">
              <Controller
                name="sortToMatchUiOrder"
                control={control}
                render={({ field }) => (
                  <Checkbox 
                    id="sortToMatchUiOrder"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="sortToMatchUiOrder" className="text-sm">
                Sort JSON to match UI order
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Orders sources by interface group, services by type, and arranges properties to match the UI layout
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
