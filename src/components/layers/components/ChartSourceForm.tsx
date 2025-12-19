import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, Database, Globe, ChevronDown, ChevronRight } from 'lucide-react';
import { Service } from '@/types/config';
import { ChartConfig, ChartSource, ChartTrace } from '@/types/chart';
import { useToast } from '@/hooks/use-toast';
import { useConfig } from '@/contexts/ConfigContext';
import { ServiceSelectionModal } from './ServiceSelectionModals';
import { ServiceCardList } from './ServiceCardList';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChartTypeSelector } from '@/components/charts/ChartTypeSelector';
import { QuickAddPanel } from '@/components/charts/QuickAddPanel';
import { TraceEditor } from '@/components/charts/TraceEditor';
import { PieEditor } from '@/components/charts/PieEditor';
import { HistogramEditor } from '@/components/charts/HistogramEditor';
import { PlotlyChartViewer } from '@/components/charts/PlotlyChartViewer';
import { useChartEditorState } from '@/hooks/useChartEditorState';
import { fetchAndParseCSV } from '@/utils/csvParser';

interface ChartSourceFormProps {
  services: Service[];
  onAddChart: (chart: ChartConfig) => void;
  onCancel: () => void;
  editingChart?: ChartConfig;
  editingIndex?: number;
  onUpdateChart?: (chart: ChartConfig, chartIndex: number) => void;
}

export function ChartSourceForm({
  services,
  onAddChart,
  onCancel,
  editingChart,
  editingIndex,
  onUpdateChart
}: ChartSourceFormProps) {
  const { toast } = useToast();
  const { dispatch } = useConfig();
  
  const [sourceType, setSourceType] = useState<'service' | 'direct'>('direct');
  const [directUrl, setDirectUrl] = useState(editingChart?.sources?.[0]?.url || '');
  const [chartTitle, setChartTitle] = useState(editingChart?.title || '');
  const [chartLabel, setChartLabel] = useState(editingChart?.sources?.[0]?.label || '');
  
  // Modal state for service selection
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Chart configuration sections
  const [configOpen, setConfigOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  
  // Use chart editor state hook
  const {
    config: chartConfig,
    setConfig: setChartConfig,
    parsedData,
    numericColumns,
    selectedTraceIndex,
    setSelectedTraceIndex,
    isLoading: csvLoading
  } = useChartEditorState({ 
    initialConfig: editingChart || { 
      chartType: 'xy', 
      sources: directUrl ? [{ type: 'externalURL', url: directUrl, format: 'csv' }] : [] 
    } 
  });
  
  // Get available columns from parsed data
  const availableColumns = parsedData.columns;

  // Track dirty state
  const [isDirty, setIsDirty] = useState(false);

  // Sync form state with editingChart when it changes
  useEffect(() => {
    if (editingChart) {
      setDirectUrl(editingChart.sources?.[0]?.url || '');
      setChartTitle(editingChart.title || '');
      setChartLabel(editingChart.sources?.[0]?.label || '');
      setIsDirty(false);
    }
  }, [editingChart]);

  // Track dirty state and update ConfigContext
  useEffect(() => {
    const hasUrl = directUrl.trim() !== '';
    if (hasUrl) {
      setIsDirty(true);
      dispatch({
        type: 'SET_UNSAVED_FORM_CHANGES',
        payload: { hasChanges: true, description: `Chart: ${directUrl || 'New Chart'}` }
      });
    }
  }, [directUrl, chartTitle, chartLabel, chartConfig, dispatch]);

  const handleServiceSelect = (service: Service) => {
    setSelectedServiceForModal(service);
    setShowServiceModal(true);
  };

  const handleServiceModalSelection = (
    selection: string | Array<{ url: string; format: string; datetime?: string }>,
    layers: string = '',
    format?: string,
    datetime?: string
  ) => {
    // Handle single selection
    if (typeof selection === 'string') {
      setDirectUrl(selection);
    }
    
    setShowServiceModal(false);
    setSelectedServiceForModal(null);
  };

  const handleServiceModalClose = () => {
    setShowServiceModal(false);
    setSelectedServiceForModal(null);
  };

  // Chart type helpers
  const getDisplayType = () => {
    if (chartConfig.pie) return 'pie';
    const firstTrace = chartConfig.traces?.[0];
    if (!firstTrace) return 'line';
    if (firstTrace.type === 'histogram') return 'histogram';
    if (firstTrace.type === 'bar') return 'bar';
    if (firstTrace.fill && firstTrace.fill !== 'none') return 'area';
    return 'line';
  };

  const handleTypeChange = (newType: 'line' | 'area' | 'bar' | 'histogram' | 'pie') => {
    if (newType === 'pie') {
      // Convert to pie
      const firstTrace = chartConfig.traces?.[0];
      setChartConfig({
        ...chartConfig,
        pie: {
          labels: chartConfig.x || '',
          values: firstTrace?.y || '',
          hole: 0
        },
        traces: undefined
      });
    } else if (newType === 'histogram') {
      // Convert to histogram
      const firstTrace = chartConfig.traces?.[0];
      setChartConfig({
        ...chartConfig,
        pie: undefined,
        traces: [{
          y: firstTrace?.y || chartConfig.x || '',
          type: 'histogram',
          name: 'Histogram'
        }]
      });
    } else {
      // Convert to XY chart
      if (chartConfig.pie) {
        setChartConfig({
          ...chartConfig,
          pie: undefined,
          x: chartConfig.pie.labels,
          traces: [{
            y: chartConfig.pie.values,
            type: newType === 'bar' ? 'bar' : 'scatter',
            mode: newType === 'bar' ? undefined : 'lines',
            fill: newType === 'area' ? 'tozeroy' : undefined
          }]
        });
      } else {
        // Update existing traces
        setChartConfig({
          ...chartConfig,
          traces: (chartConfig.traces || []).map(t => ({
            ...t,
            type: newType === 'bar' ? 'bar' : 'scatter',
            mode: newType === 'bar' ? undefined : 'lines',
            fill: newType === 'area' ? 'tozeroy' : undefined
          }))
        });
      }
    }
  };

  // Trace management
  const handleAddTrace = (column: string) => {
    const newTrace: ChartTrace = {
      y: column,
      name: column
    };
    setChartConfig({
      ...chartConfig,
      traces: [...(chartConfig.traces || []), newTrace]
    });
    setSelectedTraceIndex((chartConfig.traces || []).length);
  };

  const handleRemoveTrace = (index: number) => {
    const newTraces = [...(chartConfig.traces || [])];
    newTraces.splice(index, 1);
    setChartConfig({ ...chartConfig, traces: newTraces });
    if (selectedTraceIndex === index) {
      setSelectedTraceIndex(Math.max(0, index - 1));
    } else if (selectedTraceIndex > index) {
      setSelectedTraceIndex(selectedTraceIndex - 1);
    }
  };

  const handleUpdateTrace = (index: number, updates: Partial<ChartTrace>) => {
    const newTraces = [...(chartConfig.traces || [])];
    newTraces[index] = { ...newTraces[index], ...updates };
    setChartConfig({ ...chartConfig, traces: newTraces });
  };

  const handleReorderTraces = (newOrder: number[]) => {
    const oldTraces = chartConfig.traces || [];
    const newTraces = newOrder.map(i => oldTraces[i]);
    setChartConfig({ ...chartConfig, traces: newTraces });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!directUrl.trim()) {
      toast({
        title: "Missing URL",
        description: "Please provide a chart data source URL.",
        variant: "destructive"
      });
      return;
    }

    const chartSource: ChartSource = {
      type: 'externalURL',
      url: directUrl.trim(),
      format: 'csv',
      ...(chartLabel.trim() && { label: chartLabel.trim() })
    };

    const finalConfig: ChartConfig = {
      ...chartConfig,
      ...(chartTitle.trim() && { title: chartTitle.trim() }),
      sources: [chartSource]
    };

    // Clear unsaved changes flag
    dispatch({
      type: 'SET_UNSAVED_FORM_CHANGES',
      payload: { hasChanges: false, description: null }
    });

    // Check if we're in edit mode
    if (editingChart && editingIndex !== undefined && onUpdateChart) {
      onUpdateChart(finalConfig, editingIndex);
      toast({
        title: "Chart Updated",
        description: "Chart configuration has been updated.",
      });
    } else {
      onAddChart(finalConfig);
      toast({
        title: "Chart Added",
        description: "Chart has been added to the layer.",
      });
    }
  };

  const handleCancel = () => {
    // Clear unsaved changes flag
    dispatch({
      type: 'SET_UNSAVED_FORM_CHANGES',
      payload: { hasChanges: false, description: null }
    });
    onCancel();
  };

  const isEditing = editingChart !== undefined && editingIndex !== undefined;
  const displayType = getDisplayType();
  const hasUrl = directUrl.trim() !== '';
  const hasColumns = availableColumns.length > 0;
  const selectedTrace = chartConfig.traces?.[selectedTraceIndex];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Chart Source' : 'Add Chart Source'}</CardTitle>
          <CardDescription>
            Configure the data source and chart settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Data Source</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSourceType('direct')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    sourceType === 'direct'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Globe className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-medium">Direct Connection</div>
                  <div className="text-sm text-muted-foreground">
                    Enter a URL to a CSV file
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('service')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    sourceType === 'service'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Database className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-medium">From Service</div>
                  <div className="text-sm text-muted-foreground">
                    Select from configured services
                  </div>
                </button>
              </div>
            </div>

            {/* Service Selection */}
            {sourceType === 'service' && (
              <div className="space-y-4">
                <Label>Select a Service</Label>
                {services.length > 0 ? (
                  <ServiceCardList
                    services={services}
                    onServiceSelect={handleServiceSelect}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                    No services configured. Add a service in the Services menu.
                  </div>
                )}
              </div>
            )}

            {/* Chart Title */}
            <div className="space-y-2">
              <Label htmlFor="chartTitle">Chart Title (optional)</Label>
              <Input
                id="chartTitle"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                placeholder="Enter chart title"
              />
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="url">CSV URL</Label>
              <Input
                id="url"
                value={directUrl}
                onChange={(e) => setDirectUrl(e.target.value)}
                placeholder="https://example.com/data.csv"
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL to your CSV data file
              </p>
            </div>

            {/* Source Label */}
            <div className="space-y-2">
              <Label htmlFor="chartLabel">Source Label (optional)</Label>
              <Input
                id="chartLabel"
                value={chartLabel}
                onChange={(e) => setChartLabel(e.target.value)}
                placeholder="Enter source label"
              />
            </div>

            {/* Chart Configuration Section - only show when URL is provided */}
            {hasUrl && (
              <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 bg-muted/50 rounded-lg hover:bg-muted">
                  {configOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">Chart Configuration</span>
                  {csvLoading && <span className="text-xs text-muted-foreground ml-2">(Loading data...)</span>}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  {/* Chart Type Selector */}
                  <ChartTypeSelector
                    config={chartConfig}
                    onChange={setChartConfig}
                  />

                  {/* Conditional editors based on chart type */}
                  {displayType === 'pie' ? (
                    <PieEditor
                      config={chartConfig}
                      columns={availableColumns}
                      onConfigChange={setChartConfig}
                    />
                  ) : displayType === 'histogram' ? (
                    <HistogramEditor
                      config={chartConfig}
                      columns={availableColumns}
                      onConfigChange={setChartConfig}
                    />
                  ) : (
                    <>
                      {/* Quick Add Panel for X/Y selection */}
                      <QuickAddPanel
                        config={chartConfig}
                        columns={availableColumns}
                        selectedTraceIndex={selectedTraceIndex}
                        onConfigChange={setChartConfig}
                        onSelectTrace={setSelectedTraceIndex}
                      />

                      {/* Trace Editor */}
                      {selectedTrace && selectedTraceIndex !== null && (
                        <TraceEditor
                          trace={selectedTrace}
                          traceIndex={selectedTraceIndex}
                          config={chartConfig}
                          onConfigChange={setChartConfig}
                        />
                      )}
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Preview Section */}
            {hasUrl && hasColumns && (
              <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 bg-muted/50 rounded-lg hover:bg-muted">
                  {previewOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">Preview</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="border rounded-lg p-4 bg-background">
                    <PlotlyChartViewer
                      config={{...chartConfig, title: chartTitle || chartConfig.title}}
                      data={parsedData}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Chart' : 'Add Chart'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Service Selection Modal */}
      {selectedServiceForModal && (
        <ServiceSelectionModal
          service={selectedServiceForModal}
          isOpen={showServiceModal}
          onClose={handleServiceModalClose}
          onSelect={handleServiceModalSelection}
        />
      )}
    </>
  );
}
