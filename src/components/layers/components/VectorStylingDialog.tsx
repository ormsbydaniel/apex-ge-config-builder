import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataSource } from '@/types/config';

interface VectorStylingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: DataSource;
  onUpdateMeta: (updates: Record<string, any>) => void;
}

const VectorStylingDialog = ({ open, onOpenChange, source }: VectorStylingDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Vector Styling — {source.name}</DialogTitle>
        </DialogHeader>
        <div className="py-6 text-center text-muted-foreground text-sm italic">
          Vector styling options coming soon.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VectorStylingDialog;
