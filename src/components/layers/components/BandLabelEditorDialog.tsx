import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Hash, Waves, ClipboardPaste, RotateCcw } from 'lucide-react';

interface BandLabelEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: string[];
  onSave: (labels: string[]) => void;
}

const ROW_HEIGHT = 36;
const VISIBLE_ROWS = 30;
const BUFFER = 5;

export function BandLabelEditorDialog({
  open, onOpenChange, labels: initialLabels, onSave
}: BandLabelEditorDialogProps) {
  const [labels, setLabels] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showWavelengthForm, setShowWavelengthForm] = useState(false);
  const [wlStart, setWlStart] = useState('400');
  const [wlStep, setWlStep] = useState('2.5');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setLabels([...initialLabels]);
      setSearch('');
      setShowWavelengthForm(false);
      setScrollTop(0);
    }
  }, [open, initialLabels]);

  const filteredIndices = useMemo(() => {
    if (!search.trim()) return labels.map((_, i) => i);
    const q = search.toLowerCase();
    return labels.reduce<number[]>((acc, label, i) => {
      if (label.toLowerCase().includes(q) || String(i + 1).includes(q)) acc.push(i);
      return acc;
    }, []);
  }, [labels, search]);

  const totalHeight = filteredIndices.length * ROW_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const endIdx = Math.min(filteredIndices.length, startIdx + VISIBLE_ROWS + BUFFER * 2);
  const visibleIndices = filteredIndices.slice(startIdx, endIdx);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const updateLabel = useCallback((index: number, value: string) => {
    setLabels(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const resetToNumbers = () => {
    setLabels(prev => prev.map((_, i) => String(i + 1)));
  };

  const applyWavelengths = () => {
    const start = parseFloat(wlStart);
    const step = parseFloat(wlStep);
    if (isNaN(start) || isNaN(step) || step === 0) return;
    setLabels(prev => prev.map((_, i) => {
      const val = start + i * step;
      return Number.isInteger(val) ? String(val) : val.toFixed(2);
    }));
    setShowWavelengthForm(false);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const values = text.split(/[\n\r,\t]+/).map(s => s.trim()).filter(Boolean);
      if (values.length === 0) return;
      setLabels(prev => {
        const next = [...prev];
        values.forEach((v, i) => { if (i < next.length) next[i] = v; });
        return next;
      });
    } catch {
      // Clipboard not available
    }
  };

  const handleSave = () => {
    onSave(labels);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Band Labels</DialogTitle>
          <DialogDescription>
            {labels.length} bands — edit individual labels or use bulk operations below.
          </DialogDescription>
        </DialogHeader>

        {/* Bulk operations */}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={resetToNumbers}>
            <Hash className="h-3.5 w-3.5 mr-1" />
            Band Numbers
          </Button>
          <Button
            type="button" variant="outline" size="sm"
            onClick={() => setShowWavelengthForm(v => !v)}
          >
            <Waves className="h-3.5 w-3.5 mr-1" />
            Wavelengths
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={pasteFromClipboard}>
            <ClipboardPaste className="h-3.5 w-3.5 mr-1" />
            Paste from CSV
          </Button>
        </div>

        {/* Wavelength generator */}
        {showWavelengthForm && (
          <div className="flex items-end gap-2 p-3 rounded-md border bg-muted/30">
            <div className="space-y-1">
              <Label className="text-xs">Start (nm)</Label>
              <Input
                value={wlStart} onChange={e => setWlStart(e.target.value)}
                className="h-8 w-24 text-sm" placeholder="400"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Step (nm)</Label>
              <Input
                value={wlStep} onChange={e => setWlStep(e.target.value)}
                className="h-8 w-24 text-sm" placeholder="2.5"
              />
            </div>
            <Button type="button" size="sm" onClick={applyWavelengths}>Apply</Button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9" placeholder="Search bands..."
          />
        </div>

        {/* Virtualized table */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium px-1">
          <span className="w-12">Band #</span>
          <span className="flex-1">Label</span>
        </div>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto border rounded-md min-h-0"
          style={{ maxHeight: '40vh' }}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            {visibleIndices.map(origIdx => (
              <div
                key={origIdx}
                className="absolute left-0 right-0 flex items-center gap-4 px-3"
                style={{
                  top: filteredIndices.indexOf(origIdx) * ROW_HEIGHT,
                  height: ROW_HEIGHT,
                }}
              >
                <span className="text-xs text-muted-foreground w-12 text-right shrink-0 tabular-nums">
                  {origIdx + 1}
                </span>
                <Input
                  value={labels[origIdx]}
                  onChange={e => updateLabel(origIdx, e.target.value)}
                  className="h-7 text-sm flex-1"
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
