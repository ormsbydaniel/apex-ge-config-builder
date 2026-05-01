import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataSource } from '@/types/config';
import { DataSourceItem } from '@/types/dataSource';
import { isVectorFormat } from '@/utils/fieldDetection';
import MonacoJsonEditor from '@/components/config/components/MonacoJsonEditor';
import { useToast } from '@/hooks/use-toast';
import { Palette, Braces } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type StylingMode = 'basic' | 'json';
let lastMode: StylingMode = 'json';

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
  const [mode, setMode] = useState<StylingMode>(lastMode);

  const initialJson = useMemo(() => {
    if (!open) return '[]';
    const vectorItem = source.data.find(
      (item) => isVectorFormat(item.format) && Array.isArray(item.style)
    );
    const styleArray = vectorItem?.style ?? [];
    return `"style": ${JSON.stringify(styleArray, null, 2)}`;
  }, [open, source.data]);

  useEffect(() => {
    if (open) {
      setEditedJson(initialJson);
      setMode(lastMode);
    }
  }, [open, initialJson]);

  const toggleMode = () => {
    const next: StylingMode = mode === 'json' ? 'basic' : 'json';
    setMode(next);
    lastMode = next;
  };

  const handleSave = () => {
    try {
      let arrayContent = editedJson.trim();
      const colonIndex = arrayContent.indexOf(':');
      if (colonIndex !== -1) {
        arrayContent = arrayContent.substring(colonIndex + 1).trim();
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(arrayContent);
      } catch {
        parsed = JSON.parse(editedJson.trim());
      }
      if (!Array.isArray(parsed)) {
        toast({ title: 'Invalid style', description: 'The style must be a JSON array.', variant: 'destructive' });
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
  const jsonActive = mode === 'json';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] overflow-hidden flex flex-col gap-2">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>Vector Styling — {source.name}</DialogTitle>
            <TooltipProvider delayDuration={400}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn('h-8 w-8', jsonActive && 'text-primary bg-muted')}
                    aria-pressed={jsonActive}
                    onClick={toggleMode}
                  >
                    <Braces className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {jsonActive ? 'Switch to basic styling' : 'Switch to JSON editor'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {jsonActive ? (
            <>
              <div className="text-xs text-muted-foreground mb-1">
                Edit the <code className="bg-muted px-1 rounded">style</code> array below. On save, it will be set as the <code className="bg-muted px-1 rounded">"style"</code> property on all vector data sources in this layer.
              </div>
              <MonacoJsonEditor
                value={editedJson}
                onChange={(v) => setEditedJson(v ?? '')}
                height="400px"
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Palette className="h-10 w-10 text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground">
                Marker, line, fill and label styling coming soon
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!hasChanges}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VectorStylingDialog;
