import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, AlertTriangle, Plus, X } from 'lucide-react';
import { DataSourceItem } from '@/types/dataSource';
import { detectFieldsFromSource, DetectedField } from '@/utils/fieldDetection';

interface FieldSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vectorSources: DataSourceItem[];
  selectedFields: string[];
  onSave: (fields: string[]) => void;
}

const NUMERIC_TYPES = new Set(['int', 'integer', 'double', 'float', 'long', 'short', 'number']);
const isNumericType = (type: string) => NUMERIC_TYPES.has(type.toLowerCase());

export function FieldSelectorDialog({
  open,
  onOpenChange,
  vectorSources,
  selectedFields: initialSelected,
  onSave,
}: FieldSelectorDialogProps) {
  const [detected, setDetected] = useState<DetectedField[]>([]);
  const [manualFields, setManualFields] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState('');

  // Initialize / reset state when dialog opens (per project core rule)
  useEffect(() => {
    if (!open) return;

    setChecked([...initialSelected]);
    setNewFieldName('');
    setError(null);
    setManualFields([]);

    const source = vectorSources[0];
    if (!source?.url || !source?.format) {
      setDetected([]);
      setManualFields([...initialSelected]);
      return;
    }

    setLoading(true);
    let cancelled = false;

    detectFieldsFromSource(source.url, source.format)
      .then(fields => {
        if (cancelled) return;
        setDetected(fields);
        const detectedNames = new Set(fields.map(f => f.name));
        setManualFields(initialSelected.filter(f => !detectedNames.has(f)));
      })
      .catch(err => {
        if (cancelled) return;
        setError(err?.message || 'Failed to detect fields');
        setDetected([]);
        setManualFields([...initialSelected]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, vectorSources, initialSelected]);

  const toggleField = useCallback((name: string) => {
    setChecked(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }, []);

  const numericNames = useMemo(
    () => detected.filter(f => isNumericType(f.type)).map(f => f.name),
    [detected]
  );

  const selectAllNumeric = () => {
    setChecked(prev => Array.from(new Set([...prev, ...numericNames])));
  };

  const clearAll = () => setChecked([]);

  const addManualField = () => {
    const name = newFieldName.trim();
    if (!name) return;
    if (!manualFields.includes(name) && !detected.some(d => d.name === name)) {
      setManualFields(prev => [...prev, name]);
    }
    setChecked(prev => prev.includes(name) ? prev : [...prev, name]);
    setNewFieldName('');
  };

  const removeManualField = (name: string) => {
    setManualFields(prev => prev.filter(n => n !== name));
    setChecked(prev => prev.filter(n => n !== name));
  };

  const handleSave = () => {
    // Preserve order: detected fields in detection order, then manual fields, filtered to checked.
    const allOrdered = [...detected.map(f => f.name), ...manualFields];
    const finalFields = allOrdered.filter(name => checked.includes(name));
    onSave(finalFields);
    onOpenChange(false);
  };

  const sourceLabel = useMemo(() => {
    const src = vectorSources[0];
    if (!src?.url) return null;
    return src.url.split('/').pop()?.split('?')[0] || src.url;
  }, [vectorSources]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Fields for Pie Chart</DialogTitle>
          <DialogDescription>
            {sourceLabel
              ? <>Properties detected from <span className="font-mono text-xs">{sourceLabel}</span></>
              : 'No vector source attached to this layer — add fields manually below.'}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">Detecting fields…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Could not detect fields</p>
              <p className="text-xs text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">You can still add field names manually below.</p>
            </div>
          </div>
        )}

        {!loading && (detected.length > 0 || manualFields.length > 0) && (
          <>
            {detected.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={selectAllNumeric} disabled={numericNames.length === 0}
                >
                  Select all numeric ({numericNames.length})
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearAll}>
                  Clear all
                </Button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto border rounded-md min-h-0" style={{ maxHeight: '40vh' }}>
              <TooltipProvider delayDuration={400}>
                {detected.map(field => {
                  const numeric = isNumericType(field.type);
                  return (
                    <label
                      key={`d-${field.name}`}
                      className={`flex items-center gap-3 px-3 py-2 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 ${
                        numeric ? '' : 'opacity-70'
                      }`}
                    >
                      <Checkbox
                        checked={checked.includes(field.name)}
                        onCheckedChange={() => toggleField(field.name)}
                      />
                      <span className="text-sm flex-1 truncate">{field.name}</span>
                      {numeric ? (
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {field.type}
                        </span>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {field.type}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Non-numeric — pie slice will be a placeholder value.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </label>
                  );
                })}

                {manualFields.map(name => (
                  <div
                    key={`m-${name}`}
                    className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={checked.includes(name)}
                      onCheckedChange={() => toggleField(name)}
                    />
                    <span className="text-sm flex-1 truncate">{name}</span>
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      manual
                    </span>
                    <Button
                      type="button" variant="ghost" size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeManualField(name)}
                      aria-label={`Remove ${name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </TooltipProvider>
            </div>
          </>
        )}

        {!loading && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Add field manually</Label>
            <div className="flex gap-2">
              <Input
                value={newFieldName}
                onChange={e => setNewFieldName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addManualField();
                  }
                }}
                placeholder="Property name"
                className="h-8 text-sm flex-1"
              />
              <Button type="button" size="sm" variant="outline" onClick={addManualField}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Fields ({checked.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
