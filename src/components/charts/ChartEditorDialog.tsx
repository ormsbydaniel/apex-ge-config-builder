import React, { useState } from 'react';
import { ChartConfig } from '@/types/chart';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useChartEditorState } from '@/hooks/useChartEditorState';
import { PlotlyChartViewer } from './PlotlyChartViewer';
import { ChartTypeSelector } from './ChartTypeSelector';
import { QuickAddPanel } from './QuickAddPanel';
import { TraceEditor } from './TraceEditor';
import { PieEditor } from './PieEditor';
import { HistogramEditor } from './HistogramEditor';

interface ChartEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chart?: ChartConfig;
  onSave: (chart: ChartConfig) => void;
}

export function ChartEditorDialog({ open, onOpenChange, chart, onSave }: ChartEditorDialogProps) {
  const [chartOpen, setChartOpen] = useState(true);
  const [dataOpen, setDataOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    config, setConfig, updateConfig,
    parsedData, isLoading, numericColumns,
    selectedTraceIndex, setSelectedTraceIndex,
    updateTrace, removeTrace,
  } = useChartEditorState({ initialConfig: chart });

  const isHistogram = config.traces?.some(t => t.type === 'histogram');
  const isPie = config.chartType === 'pie';

  const handleSave = () => {
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{chart ? 'Edit Chart' : 'New Chart'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left: Editor */}
          <div className="space-y-4">
            {/* Data Source URL */}
            <div>
              <Label>CSV Data URL</Label>
              <Input
                value={config.sources?.[0]?.url || ''}
                onChange={(e) => updateConfig({ sources: [{ url: e.target.value, format: 'csv' }] })}
                placeholder="https://example.com/data.csv"
              />
            </div>

            {/* Chart Section */}
            <Collapsible open={chartOpen} onOpenChange={setChartOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm w-full p-2 hover:bg-muted rounded">
                {chartOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Chart
              </CollapsibleTrigger>
              <CollapsibleContent className="p-2 space-y-3">
                <ChartTypeSelector config={config} onChange={setConfig} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={config.title || ''}
                      onChange={(e) => updateConfig({ title: e.target.value })}
                      placeholder="Chart title"
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Subtitle</Label>
                    <Input
                      value={config.subtitle || ''}
                      onChange={(e) => updateConfig({ subtitle: e.target.value })}
                      placeholder="Subtitle"
                      className="h-8"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Chart Data Section */}
            <Collapsible open={dataOpen} onOpenChange={setDataOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 font-medium text-sm w-full p-2 hover:bg-muted rounded">
                {dataOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Chart Data
              </CollapsibleTrigger>
              <CollapsibleContent className="p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : parsedData.columns.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Enter a CSV URL to load columns</p>
                ) : isPie ? (
                  <PieEditor
                    config={config}
                    columns={parsedData.columns}
                    numericColumns={numericColumns}
                    onConfigChange={setConfig}
                  />
                ) : isHistogram ? (
                  <HistogramEditor
                    config={config}
                    numericColumns={numericColumns}
                    onConfigChange={setConfig}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <QuickAddPanel
                      config={config}
                      columns={parsedData.columns}
                      selectedTraceIndex={selectedTraceIndex}
                      onConfigChange={setConfig}
                      onSelectTrace={setSelectedTraceIndex}
                    />
                    {selectedTraceIndex !== null && config.traces?.[selectedTraceIndex] && (
                      <TraceEditor
                        trace={config.traces[selectedTraceIndex]}
                        traceIndex={selectedTraceIndex}
                        columns={parsedData.columns}
                        onUpdate={(trace) => updateTrace(selectedTraceIndex, trace)}
                        onRemove={() => removeTrace(selectedTraceIndex)}
                      />
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Right: Preview */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-4">Preview</h3>
            <PlotlyChartViewer config={config} data={parsedData} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Chart</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
