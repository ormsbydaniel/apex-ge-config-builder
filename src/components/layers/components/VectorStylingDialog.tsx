import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataSource } from '@/types/config';
import { DataSourceItem } from '@/types/dataSource';
import { isVectorFormat } from '@/utils/fieldDetection';
import MonacoJsonEditor from '@/components/config/components/MonacoJsonEditor';
import { useToast } from '@/hooks/use-toast';

interface VectorStylingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: DataSource;
  onUpdateMeta: (updates: Record<string, any>) => void;
  onUpdateDataSources: (updatedData: DataSourceItem[]) => void;
}

const VectorStylingDialog = ({ open, onOpenChange, source, onUpdateDataSources }: VectorStylingDialogProps) => {
  const { toast } = useToast();
  const [editedJson, setEditedJson] = useState('');

  const initialJson = useMemo(() => {
    if (!open) return '[]';
    const vectorItem = source.data.find(
      (item) => isVectorFormat(item.format) && Array.isArray(item.style)
    );
    return JSON.stringify(vectorItem?.style ?? [], null, 2);
  }, [open, source.data]);

  useEffect(() => {
    if (open) {
      setEditedJson(initialJson);
    }
  }, [open, initialJson]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editedJson);
      if (!Array.isArray(parsed)) {
        toast({ title: 'Invalid style', description: 'Style must be a JSON array.', variant: 'destructive' });
        return;
      }
      const updatedData = source.data.map((item) =>
        isVectorFormat(item.format) ? { ...item, style: parsed } : item
      );
      onUpdateDataSources(updatedData);
      onOpenChange(false);
      toast({ title: 'Vector styling saved' });
    } catch {
      toast({ title: 'Invalid JSON', description: 'Please fix syntax errors before saving.', variant: 'destructive' });
    }
  };

  const hasChanges = editedJson !== initialJson;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vector Styling — {source.name}</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground mb-1">
          Define a <code className="bg-muted px-1 rounded">style</code> array. On save, it will be applied to all vector data sources in this layer.
        </div>
        <MonacoJsonEditor
          value={editedJson}
          onChange={(v) => setEditedJson(v ?? '')}
          height="400px"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!hasChanges}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VectorStylingDialog;
