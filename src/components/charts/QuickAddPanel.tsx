import React, { useState } from 'react';
import { ChartConfig, ChartTrace } from '@/types/chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, GripVertical } from 'lucide-react';
import { getNextColor, getContrastColor } from '@/utils/colorPalettes';

interface QuickAddPanelProps {
  config: ChartConfig;
  columns: string[];
  selectedTraceIndex: number | null;
  onConfigChange: (config: ChartConfig) => void;
  onSelectTrace: (index: number | null) => void;
}

export function QuickAddPanel({
  config,
  columns,
  selectedTraceIndex,
  onConfigChange,
  onSelectTrace,
}: QuickAddPanelProps) {
  const [isXAxisExpanded, setIsXAxisExpanded] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const traces = config.traces || [];
  const usedColumns = new Set([config.x, ...traces.map(t => t.y)].filter(Boolean));
  const availableColumns = columns.filter(col => !usedColumns.has(col));

  const handleXAxisSelect = (column: string) => {
    onConfigChange({ ...config, x: column });
    setIsXAxisExpanded(false);
  };

  const handleAddTrace = (column: string) => {
    const newTrace: ChartTrace = {
      y: column,
      name: column,
      type: 'scatter',
      mode: 'lines',
      line: { color: getNextColor(traces), width: 2 },
      showlegend: true,
    };
    onConfigChange({ ...config, traces: [...traces, newTrace] });
    onSelectTrace(traces.length);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newTraces = [...traces];
    const [removed] = newTraces.splice(draggedIndex, 1);
    newTraces.splice(dropIndex, 0, removed);
    
    onConfigChange({ ...config, traces: newTraces });
    
    // Update selected index if needed
    if (selectedTraceIndex === draggedIndex) {
      onSelectTrace(dropIndex);
    } else if (selectedTraceIndex !== null) {
      if (draggedIndex < selectedTraceIndex && dropIndex >= selectedTraceIndex) {
        onSelectTrace(selectedTraceIndex - 1);
      } else if (draggedIndex > selectedTraceIndex && dropIndex <= selectedTraceIndex) {
        onSelectTrace(selectedTraceIndex + 1);
      }
    }
    
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* X-Axis Row */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground w-12">X-Axis</span>
        
        {isXAxisExpanded ? (
          <div className="flex flex-wrap gap-1">
            {columns.map(col => (
              <Badge
                key={col}
                variant={col === config.x ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => handleXAxisSelect(col)}
              >
                {col}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {config.x ? (
              <Badge variant="default">{config.x}</Badge>
            ) : (
              <span className="text-xs text-muted-foreground italic">Not set</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setIsXAxisExpanded(true)}
            >
              Change
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Y-Axis Row */}
      <div className="flex items-start gap-2">
        <span className="text-xs font-medium text-muted-foreground w-12 pt-1">Y-Axis</span>
        
        <div className="flex flex-wrap gap-1 items-center">
          {/* Selected traces (draggable) */}
          {traces.map((trace, index) => {
            const bgColor = trace.line?.color || '#2563eb';
            const textColor = getContrastColor(bgColor);
            const isSelected = selectedTraceIndex === index;
            const isDragging = draggedIndex === index;
            
            return (
              <Badge
                key={index}
                className={`cursor-pointer transition-opacity ${isDragging ? 'opacity-50' : ''} ${isSelected ? 'ring-2 ring-offset-1 ring-foreground/70' : ''}`}
                style={{ backgroundColor: bgColor, color: textColor }}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectTrace(isSelected ? null : index)}
              >
                <GripVertical className="h-3 w-3 mr-1 opacity-50" />
                {trace.name || trace.y}
              </Badge>
            );
          })}

          {/* Separator */}
          {traces.length > 0 && availableColumns.length > 0 && (
            <span className="text-muted-foreground mx-1">·</span>
          )}

          {/* Available columns */}
          {availableColumns.map(col => (
            <Badge
              key={col}
              variant="outline"
              className="cursor-pointer hover:bg-muted"
              onClick={() => handleAddTrace(col)}
            >
              {col}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
