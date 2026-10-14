import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Braces, AlertTriangle, RotateCcw, Wand2 } from 'lucide-react';
import { DataSource } from '@/types/config';
import { DataSourceItem } from '@/types/dataSource';
import MonacoJsonEditor from '@/components/config/components/MonacoJsonEditor';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import {
  STYLE_KEY_GROUPS, StyleKeyGroup, applyStyleFields, diffKeys, extractStyleFields, validateStyleFields,
} from '@/utils/styleJson/styleJsonScope';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: DataSource;
  onUpdateDataSources: (updatedData: DataSourceItem[]) => void;
}

type Scope = 'all' | 'selected' | 'one';
const ALL_GROUPS = Object.keys(STYLE_KEY_GROUPS) as StyleKeyGroup[];
const DEFAULT_GROUPS = ALL_GROUPS.filter(g => STYLE_KEY_GROUPS[g].defaultOn);

const fileName = (item: DataSourceItem, i: number) => {
  const u = item.url || '';
  const name = u.split('?')[0].split('/').filter(Boolean).pop();
  return name || `Dataset ${i + 1}`;
};

const JsonStyleEditorDialog = ({ open, onOpenChange, source, onUpdateDataSources }: Props) => {
  const data = source.data || [];
  const [scope, setScope] = useState<Scope>('all');
  const [selected, setSelected] = useState<number[]>([]);
  const [one, setOne] = useState(0);
  const [groups, setGroups] = useState<StyleKeyGroup[]>(DEFAULT_GROUPS);
  const [text, setText] = useState('');
  const [initialText, setInitialText] = useState('');
  const { editorTheme: theme } = useEditorTheme();

  const indices = useMemo(() => (
    scope === 'all' ? data.map((_, i) => i) : scope === 'one' ? [one] : selected
  ), [scope, one, selected, data]);

  const scoped = useMemo(() => indices.map(i => data[i]).filter(Boolean), [indices, data]);
  const differing = useMemo(() => diffKeys(scoped, groups), [scoped, groups]);

  // Initialise on open
  useEffect(() => {
    if (!open) return;
    setScope('all'); setSelected(data.map((_, i) => i)); setOne(0); setGroups(DEFAULT_GROUPS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reload editor content only when the actual scoped content changes (not on
  // every parent re-render, which would wipe in-progress edits).
  const sourceText = useMemo(
    () => JSON.stringify(extractStyleFields(scoped[0], groups), null, 2),
    [scoped, groups],
  );
  const reloadKey = `${open}|${indices.join(',')}|${groups.join(',')}|${sourceText}`;
  useEffect(() => {
    if (!open) return;
    setText(sourceText); setInitialText(sourceText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const dirty = text !== initialText;
  const parsed = useMemo(() => { try { return { value: JSON.parse(text) }; } catch (e) { return { error: (e as Error).message }; } }, [text]);
  const errors = 'error' in parsed ? [`Invalid JSON: ${parsed.error}`] : validateStyleFields(parsed.value, groups);
  if (indices.length === 0) errors.push('Select at least one dataset');

  const recipeOwned = scoped.some(d => d.spectralIndex || d.computedComposite || d.styleSource === 'batch');
  const styleEdited = !('error' in parsed) && JSON.stringify((parsed.value as any)?.style) !== JSON.stringify(scoped[0]?.style);

  const confirmDiscard = () => !dirty || window.confirm('Discard unsaved JSON changes?');
  const close = () => { if (confirmDiscard()) onOpenChange(false); };
  const changeScope = (fn: () => void) => { if (confirmDiscard()) fn(); };

  const apply = () => {
    if (errors.length || 'error' in parsed) return;
    if (differing.length && !window.confirm(`The datasets currently differ in: ${differing.join(', ')}. Applying will make them identical. Continue?`)) return;
    onUpdateDataSources(applyStyleFields(data, indices, parsed.value as Record<string, unknown>, groups));
    onOpenChange(false);
  };

  const format = () => { if (!('error' in parsed)) setText(JSON.stringify(parsed.value, null, 2)); };

  return (
    <Dialog open={open} onOpenChange={o => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Braces className="h-5 w-5" />JSON Style Editor: {source.name}</DialogTitle>
          <DialogDescription>Edit the rendering settings of this layer's datasets directly. Other dataset settings are not changed.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-medium">Apply to:</span>
            <RadioGroup value={scope} onValueChange={v => changeScope(() => setScope(v as Scope))} className="flex gap-4">
              {(['all', 'selected', 'one'] as Scope[]).map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <RadioGroupItem value={s} id={`jse-${s}`} />
                  <Label htmlFor={`jse-${s}`}>{s === 'all' ? `All datasets (${data.length})` : s === 'selected' ? 'Selected datasets' : 'One dataset'}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {scope !== 'all' && (
            <div className="max-h-32 overflow-auto border rounded-md p-2 space-y-1">
              {data.map((d, i) => (
                <label key={i} className="flex items-center gap-2 cursor-pointer">
                  {scope === 'selected' ? (
                    <Checkbox checked={selected.includes(i)} onCheckedChange={c => changeScope(() => setSelected(prev => c ? [...prev, i].sort((a, b) => a - b) : prev.filter(x => x !== i)))} />
                  ) : (
                    <input type="radio" name="jse-one" checked={one === i} onChange={() => changeScope(() => setOne(i))} />
                  )}
                  <span className="text-muted-foreground w-5">{i + 1}</span>
                  <span className="truncate">{fileName(d, i)}</span>
                  <Badge variant="outline" className="text-[10px]">{d.format}</Badge>
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-medium">Fields shown:</span>
            {ALL_GROUPS.map(g => (
              <label key={g} className="flex items-center gap-1.5 cursor-pointer" title={STYLE_KEY_GROUPS[g].keys.join(', ')}>
                <Checkbox checked={groups.includes(g)} onCheckedChange={c => changeScope(() => setGroups(prev => c ? ALL_GROUPS.filter(x => prev.includes(x) || x === g) : prev.filter(x => x !== g)))} />
                {STYLE_KEY_GROUPS[g].label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <MonacoJsonEditor value={text} onChange={v => setText(v ?? '')} theme={theme} height="45vh" />
        </div>

        <div className="space-y-1 text-xs">
          {differing.length > 0 && (
            <p className="flex items-center gap-1 text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5" />Datasets differ in: {differing.join(', ')} (showing values from the first one)</p>
          )}
          {recipeOwned && styleEdited && (
            <p className="flex items-center gap-1 text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5" />A multi-band recipe owns this style; saving from the multi-band editor later may overwrite your edit. Show "Recipe metadata" to remove it.</p>
          )}
          {errors.map(e => <p key={e} className="text-destructive">{e}</p>)}
        </div>

        <DialogFooter className="flex items-center gap-2 sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!dirty} onClick={() => setText(initialText)}><RotateCcw className="h-4 w-4 mr-2" />Reset</Button>
            <Button variant="outline" size="sm" onClick={format}><Wand2 className="h-4 w-4 mr-2" />Format JSON</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
            <Button size="sm" disabled={!dirty || errors.length > 0} onClick={apply}>Apply</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JsonStyleEditorDialog;
