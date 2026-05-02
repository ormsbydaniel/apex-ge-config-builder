import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataSource } from '@/types/config';
import { DataSourceItem } from '@/types/dataSource';
import { isVectorFormat, detectFieldsFromSource } from '@/utils/fieldDetection';
import MonacoJsonEditor from '@/components/config/components/MonacoJsonEditor';
import { useToast } from '@/hooks/use-toast';
import { FileJson } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import StyleEditor from '@/components/vectorStyle/StyleEditor';
import type { VectorFieldDescriptor } from '@/components/vectorStyle/types';
import type { StyleRule } from '@/types/vectorStyle';
import { fromFlatStyleArray } from '@/utils/vectorStyle/fromFlatStyleArray';
import { toFlatStyleArray } from '@/utils/vectorStyle/toFlatStyleArray';

type StylingMode = 'basic' | 'json';
let lastMode: StylingMode = 'basic';

interface VectorStylingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: DataSource;
  onUpdateMeta: (updates: Record<string, any>) => void;
  onUpdateDataSources: (updatedData: DataSourceItem[]) => void;
}

const stripStylePrefix = (text: string): string => {
  const trimmed = text.trim();
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx !== -1 && trimmed.slice(0, colonIdx).includes('style')) {
    return trimmed.slice(colonIdx + 1).trim();
  }
  return trimmed;
};

const VectorStylingDialog = ({ open, onOpenChange, source, onUpdateDataSources }: VectorStylingDialogProps) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<StylingMode>(lastMode);
  const [editedJson, setEditedJson] = useState('');
  const [rules, setRules] = useState<StyleRule[]>([]);
  const [fallbackCount, setFallbackCount] = useState(0);
  const [detectedFields, setDetectedFields] = useState<VectorFieldDescriptor[]>([]);

  const initialStyle: unknown[] = useMemo(() => {
    if (!open) return [];
    const vectorItem = source.data.find(
      (item) => isVectorFormat(item.format) && Array.isArray(item.style)
    );
    return (vectorItem?.style as unknown[]) ?? [];
  }, [open, source.data]);

  const initialJson = useMemo(
    () => `"style": ${JSON.stringify(initialStyle, null, 2)}`,
    [initialStyle],
  );

  const configuredFields: VectorFieldDescriptor[] = useMemo(() => {
    const f = source.meta?.fields;
    if (!f || typeof f !== 'object') return [];
    return Object.entries(f)
      .filter(([, cfg]) => cfg !== null)
      .map(([name, cfg]) => ({
        name,
        type: (cfg as { type?: string } | undefined)?.type,
      }));
  }, [source.meta?.fields]);

  // Prefer configured fields; fall back to fields auto-detected from the first vector data item.
  const fields: VectorFieldDescriptor[] = configuredFields.length > 0
    ? configuredFields
    : detectedFields;

  // Reset only when the dialog transitions to open, to avoid wiping
  // in-progress edits when parent re-renders produce new array identities.
  useEffect(() => {
    if (!open) return;
    setEditedJson(initialJson);
    const parsed = fromFlatStyleArray(initialStyle);
    setRules(parsed.rules);
    setFallbackCount(parsed.fallbacks.length);
    setMode(lastMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-detect fields from the first vector source if none are configured.
  useEffect(() => {
    if (!open) return;
    if (configuredFields.length > 0) return;
    const vectorItem = source.data.find((item) => isVectorFormat(item.format) && item.url);
    if (!vectorItem?.url) {
      setDetectedFields([]);
      return;
    }
    let cancelled = false;
    detectFieldsFromSource(vectorItem.url, vectorItem.format)
      .then((detected) => {
        if (cancelled) return;
        setDetectedFields(detected.map((d) => ({ name: d.name, type: d.type })));
      })
      .catch((err) => {
        console.warn('Vector styling: field auto-detection failed', err);
        if (!cancelled) setDetectedFields([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, configuredFields.length, source.data]);

  const toggleMode = () => {
    if (mode === 'basic') {
      // Switching to JSON: serialise current rules.
      const arr = toFlatStyleArray(rules);
      setEditedJson(`"style": ${JSON.stringify(arr, null, 2)}`);
      setMode('json');
      lastMode = 'json';
    } else {
      // Switching back to basic: parse the JSON the user may have edited.
      try {
        const arr = JSON.parse(stripStylePrefix(editedJson));
        if (!Array.isArray(arr)) throw new Error('not an array');
        const parsed = fromFlatStyleArray(arr);
        setRules(parsed.rules);
        setFallbackCount(parsed.fallbacks.length);
        setMode('basic');
        lastMode = 'basic';
      } catch {
        toast({
          title: 'Invalid JSON',
          description: 'Fix the JSON before switching back to basic mode.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSave = () => {
    let parsedArr: unknown;
    try {
      if (mode === 'json') {
        parsedArr = JSON.parse(stripStylePrefix(editedJson));
      } else {
        parsedArr = toFlatStyleArray(rules);
      }
    } catch {
      toast({ title: 'Invalid JSON', description: 'Please fix syntax errors before saving.', variant: 'destructive' });
      return;
    }
    if (!Array.isArray(parsedArr)) {
      toast({ title: 'Invalid style', description: 'The style must be a JSON array.', variant: 'destructive' });
      return;
    }
    const updatedData = source.data.map((item) =>
      isVectorFormat(item.format) ? { ...item, style: parsedArr } : item
    );
    onUpdateDataSources(updatedData);
    onOpenChange(false);
    toast({ title: 'Vector styling saved' });
  };

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
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-7 w-7 p-0 border-orange-500/30 text-orange-600 hover:bg-orange-50 hover:text-orange-700',
                      jsonActive && 'bg-orange-100 hover:bg-orange-100',
                    )}
                    aria-pressed={jsonActive}
                    onClick={toggleMode}
                  >
                    <FileJson className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" sideOffset={6}>
                  {jsonActive ? 'Switch to basic styling' : 'Switch to JSON editor'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
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
            <StyleEditor
              rules={rules}
              onChange={setRules}
              fields={fields}
              fallbackCount={fallbackCount}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VectorStylingDialog;
