import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataSource } from '@/types/config';
import { DataSourceItem } from '@/types/dataSource';
import { isVectorFormat, detectFieldsFromSource } from '@/utils/fieldDetection';
import MonacoJsonEditor from '@/components/config/components/MonacoJsonEditor';
import { useToast } from '@/hooks/use-toast';
import { FileJson } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import RecipeGallery from '@/components/vectorStyle/RecipeGallery';
import RecipeWizard from '@/components/vectorStyle/RecipeWizard';
import { applyRecipeRules, type RecipeId } from '@/utils/vectorStyle/recipes';
import { sampleSourceData, canSampleSource } from '@/utils/vectorStyle/sampleSourceData';
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
  const [view, setView] = useState<'gallery' | 'wizard' | 'editor'>('editor');
  const [recipe, setRecipe] = useState<RecipeId | null>(null);
  const [wizardOrigin, setWizardOrigin] = useState<'gallery' | 'editor'>('gallery');
  // Index + nonce of a rule to select when the editor reopens (e.g. a rule just created by a recipe).
  const [focusRule, setFocusRule] = useState<{ index: number; nonce: number } | null>(null);

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
    // Empty styles open on the recipe gallery; existing styles open on their rules.
    setView(parsed.rules.length === 0 && parsed.fallbacks.length === 0 ? 'gallery' : 'editor');
    setRecipe(null);
    setWizardOrigin('gallery');
    setFocusRule(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleRecipeRules = (generated: StyleRule[]) => {
    const prev = new Set(rules);
    const next = applyRecipeRules(rules, generated, 'append');
    setRules(next);
    // Select the first newly added rule (append can shift it if an else branch moves last).
    const firstNew = next.findIndex((r) => !prev.has(r));
    setFocusRule({ index: firstNew >= 0 ? firstNew : Math.max(0, next.length - 1), nonce: Date.now() });
    setView('editor');
  };

  const handleStartFromScratch = () => {
    setRules([{ enabled: true, primitives: {} }]);
    setView('editor');
  };

  // Stable URL + format for the first vector data item — avoids re-fetching when
  // the parent re-renders with a new `source.data` array identity.
  const firstVectorItem = useMemo(() => {
    return source.data.find((item) => isVectorFormat(item.format) && item.url);
  }, [source.data]);
  const firstVectorUrl = firstVectorItem?.url ?? '';
  const firstVectorFormat = firstVectorItem?.format ?? '';

  // Sample attributes from the first data file for recipes (cached per URL, never throws).
  const sampleQuery = useQuery({
    queryKey: ['vector-style-sample', firstVectorUrl, firstVectorFormat],
    queryFn: () => sampleSourceData(firstVectorUrl, firstVectorFormat),
    enabled: open && view === 'wizard' && !!firstVectorUrl && canSampleSource(firstVectorFormat),
    staleTime: 10 * 60 * 1000,
  });

  // Auto-detect fields from the first vector source if none are configured.
  useEffect(() => {
    if (!open) return;
    if (configuredFields.length > 0) return;
    if (!firstVectorUrl) {
      setDetectedFields([]);
      return;
    }
    let cancelled = false;
    setDetectedFields([]);
    detectFieldsFromSource(firstVectorUrl, firstVectorFormat)
      .then((detected) => {
        if (cancelled) return;
        console.log('[VectorStylingDialog] auto-detected fields', detected);
        setDetectedFields(detected.map((d) => ({ name: d.name, type: d.type })));
      })
      .catch((err) => {
        console.warn('[VectorStylingDialog] field auto-detection failed', err);
        if (!cancelled) setDetectedFields([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, configuredFields.length, firstVectorUrl, firstVectorFormat]);

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
      <DialogContent className="max-w-5xl w-[calc(100vw-2rem)] h-[85vh] overflow-hidden flex flex-col gap-2">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle>Vector Styling — {source.name}</DialogTitle>
            <div className="flex items-center gap-2">
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
          ) : view === 'gallery' ? (
            <RecipeGallery
               onPick={(id) => { setWizardOrigin('gallery'); setRecipe(id); setView('wizard'); }}
              onScratch={handleStartFromScratch}
              hasExistingRules={rules.length > 0}
            />
          ) : view === 'wizard' && recipe ? (
            <RecipeWizard
              recipe={recipe}
              sample={sampleQuery.data}
              sampling={sampleQuery.isFetching}
              fallbackFields={fields.map((f) => f.name)}
               backLabel={wizardOrigin === 'editor' ? 'Back to rules' : 'Back to recipes'}
               onBack={() => setView(wizardOrigin)}
              onApply={handleRecipeRules}
            />
          ) : (
            <StyleEditor
              rules={rules}
              onChange={setRules}
              fields={fields}
              fallbackCount={fallbackCount}
              focusRule={focusRule}
              onPickRecipe={(id) => { setWizardOrigin('editor'); setRecipe(id); setView('wizard'); }}
              onRulesEmpty={() => setView('gallery')}
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
