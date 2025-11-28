
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface ExportOptions {
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
      sortToMatchUiOrder: false
    }
  });

  const onSubmit = (data: ExportOptions) => {
    onExport(data);
    onOpenChange(false);
  };

  const handleQuickExport = () => {
    onExport({ 
      sortToMatchUiOrder: false
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Configuration</DialogTitle>
          <DialogDescription>
            Customize how your configuration is exported
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card">
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
              <div className="space-y-1 flex-1">
                <Label 
                  htmlFor="sortToMatchUiOrder" 
                  className="text-sm font-medium cursor-pointer"
                >
                  Sort JSON to match UI order
                </Label>
                <p className="text-sm text-muted-foreground">
                  Orders sources by interface group, services by type, and arranges properties to match the UI layout. 
                  Useful for version control and human readability.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleQuickExport}
            >
              Quick Export (Default)
            </Button>
            <Button type="submit">
              Export with Options
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExportOptionsDialog;
