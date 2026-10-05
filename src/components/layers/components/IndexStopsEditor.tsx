import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { IndexLegendStop } from '@/utils/rgbComposite/indices';

interface IndexStopsEditorProps {
  stops: IndexLegendStop[];
  onChange: (stops: IndexLegendStop[]) => void;
}

function nextStop(stops: IndexLegendStop[]): IndexLegendStop {
  if (stops.length < 2) return { value: stops.length ? 1 : -1, color: '#808080', meaning: 'New stop' };
  let gapIndex = 0;
  for (let i = 1; i < stops.length - 1; i++) {
    if (stops[i + 1].value - stops[i].value > stops[gapIndex + 1].value - stops[gapIndex].value) gapIndex = i;
  }
  const before = stops[gapIndex];
  const after = stops[gapIndex + 1];
  return {
    value: Number(((before.value + after.value) / 2).toFixed(3)),
    color: before.color,
    meaning: 'New stop',
  };
}

export default function IndexStopsEditor({ stops, onChange }: IndexStopsEditorProps) {
  const update = (index: number, patch: Partial<IndexLegendStop>) =>
    onChange(stops.map((stop, i) => i === index ? { ...stop, ...patch } : stop));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[5.5rem_8.5rem_minmax(8rem,1fr)_2rem] gap-2 text-[11px] text-muted-foreground">
        <span>At value</span><span>Use</span><span>Legend meaning</span><span />
      </div>
      {stops.map((stop, index) => (
        <div key={index} className="grid grid-cols-[5.5rem_8.5rem_minmax(8rem,1fr)_2rem] items-center gap-2">
          <Input
            aria-label={`Stop ${index + 1} value`}
            type="number"
            min={-1}
            max={1}
            step={0.01}
            className="h-8 text-xs"
            value={stop.value}
            onChange={(event) => update(index, { value: Number(event.target.value) })}
          />
          <div className="flex min-w-0 items-center gap-1.5">
            <input
              aria-label={`Stop ${index + 1} colour`}
              type="color"
              className="h-8 w-9 shrink-0 rounded border bg-background p-0"
              value={/^#[0-9a-f]{6}$/i.test(stop.color) ? stop.color : '#000000'}
              onChange={(event) => update(index, { color: event.target.value.toUpperCase() })}
            />
            <Input
              aria-label={`Stop ${index + 1} colour value`}
              className="h-8 min-w-0 px-2 text-xs"
              value={stop.color}
              onChange={(event) => update(index, { color: event.target.value })}
            />
          </div>
          <Input
            aria-label={`Stop ${index + 1} legend meaning`}
            className="h-8 min-w-0 text-xs"
            value={stop.meaning}
            onChange={(event) => update(index, { meaning: event.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Remove stop ${index + 1}`}
            disabled={stops.length <= 2}
            onClick={() => onChange(stops.filter((_, i) => i !== index))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...stops, nextStop(stops)].sort((a, b) => a.value - b.value))}
      >
        <Plus className="mr-1 h-3 w-3" /> Add stop
      </Button>
    </div>
  );
}