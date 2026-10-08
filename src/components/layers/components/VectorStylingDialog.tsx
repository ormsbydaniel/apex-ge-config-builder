import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DataSource } from '@/types/config';
import { DataSourceItem } from '@/types/dataSource';
import { isVectorDataSource } from '@/utils/stacAssetFormat';
import { pickAttributeSource } from '@/utils/vectorStyle/pickAttributeSource';
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
      (item) => isVectorDataSource(item) && Array.isArray(item.style)
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
    setRules((current) => [{ enabled: true, primitives: {} }, ...current]);
    setFocusRule({ index: 0, nonce: Date.now() });
    setView('editor');
  };

  // Stable key of vector data files — avoids re-fetching when the parent
  // re-renders with a new `source.data` array identity.
  const vectorItems = useMemo(
    () => source.data
      .filter((item) => isVectorDataSource(item) && item.url)
      .map((item) => ({ url: item.url as string, format: item.format, assets: item.assets, assetFormats: item.assetFormats })),
    [source.data],
  );
  const vectorKey = vectorItems.map((i) => `${i.format}|${i.url}`).join('\n');

  // First data file that actually has attribute columns (some files in a layer may have none).
  const attributeSourceQuery = useQuery({
    queryKey: ['vector-attribute-source', vectorKey],
    queryFn: () => pickAttributeSource(vectorItems),
    enabled: open && vectorItems.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
  const attrSource = attributeSourceQuery.data ?? null;

  // Sample attributes for recipes (cached per URL, never throws).
  const sampleQuery = useQuery({
    queryKey: ['vector-style-sample', attrSource?.url, attrSource?.format],
    queryFn: () => sampleSourceData(attrSource!.url, attrSource!.format),
    enabled: open && view === 'wizard' && !!attrSource && canSampleSource(attrSource.format),
    staleTime: 10 * 60 * 1000,
  });
  const noAttributes = attributeSourceQuery.isSuccess && !attrSource;
  const wizardSample = noAttributes
    ? { featureCount: 0, fields: [], error: vectorItems.length > 1 ? 'none of the layer\'s files have attribute columns' : 'the file has no attribute columns' }
    : attributeSourceQuery.isError
      ? { featureCount: 0, fields: [], error: attributeSourceQuery.error instanceof Error ? attributeSourceQuery.error.message : 'could not reach the file' }
      : sampleQuery.data;
  const wizardSampling = attributeSourceQuery.isLoading || sampleQuery.isLoading;

  // Auto-detected fields are used when none are configured.
  useEffect(() => {
    setDetectedFields(configuredFields.length > 0 ? [] : (attrSource?.fields ?? []).map((d) => ({ name: d.name, type: d.type })));
  }, [attrSource, configuredFields.length]);

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
      isVectorDataSource(item) ? { ...item, style: parsedArr } : item
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
              sample={wizardSample}
              sampling={wizardSampling}
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
