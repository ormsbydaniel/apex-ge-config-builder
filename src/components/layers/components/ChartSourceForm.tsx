import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, Database, Globe, ChevronDown, ChevronRight } from 'lucide-react';
import { Service } from '@/types/config';
import { DataSourceItem } from '@/types/dataSource';
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
import { ChartSettingsPanel } from '@/components/charts/ChartSettingsPanel';
import { useChartEditorState } from '@/hooks/useChartEditorState';
import { fetchAndParseCSV } from '@/utils/csvParser';
import { fetchCogHeaderMetadata } from '@/utils/cogMetadata';
import { fetchCogCenterPixel } from '@/utils/cogSamplePixel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Activity, Loader2, Tag, Settings2, ListTree } from 'lucide-react';
import { BandLabelEditorDialog } from './BandLabelEditorDialog';

interface ChartSourceFormProps {
  services: Service[];
  onAddChart: (chart: ChartConfig) => void;
  onCancel: () => void;
  editingChart?: ChartConfig;
  editingIndex?: number;
  onUpdateChart?: (chart: ChartConfig, chartIndex: number) => void;
  cogSources?: DataSourceItem[];
}

export function ChartSourceForm({
  services,
  onAddChart,
  onCancel,
  editingChart,
  editingIndex,
  onUpdateChart,
  cogSources = []
}: ChartSourceFormProps) {
  const { toast } = useToast();
  const { dispatch } = useConfig();
  
  const [sourceType, setSourceType] = useState<'service' | 'direct' | 'pixelValues' | 'fieldValues'>(
    editingChart?.sources?.[0]?.type === 'pixelValues'
      ? 'pixelValues'
      : editingChart?.sources?.[0]?.type === 'inline'
        ? 'fieldValues'
        : 'direct'
  );
  const [selectedCogIndex, setSelectedCogIndex] = useState<number>(0);
  const [bandLabels, setBandLabels] = useState<string[]>([]);
  const [bandLabelDialogOpen, setBandLabelDialogOpen] = useState(false);
  const [bandCount, setBandCount] = useState<number>(0);
  const [bandLoading, setBandLoading] = useState(false);
  const bandFetchRef = useRef(0);
  const [samplePixelValues, setSamplePixelValues] = useState<number[] | null>(null);
  const [inlineFields, setInlineFields] = useState<string[]>(
    Array.isArray(editingChart?.sources?.[0]?.fields) ? (editingChart!.sources![0].fields as string[]) : []
  );
  const [sampleLoading, setSampleLoading] = useState(false);
  const sampleFetchRef = useRef(0);
  const [directUrl, setDirectUrl] = useState(editingChart?.sources?.[0]?.url || '');
  const [chartTitle, setChartTitle] = useState(editingChart?.title || '');
  const [chartSubtitle, setChartSubtitle] = useState(editingChart?.subtitle || '');
  const [chartLabel, setChartLabel] = useState(editingChart?.sources?.[0]?.label || '');
  
  // Modal state for service selection
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Chart configuration sections — when editing an existing chart,
  // collapse everything except Preview so the user sees the chart first.
  const isEditMode = editingChart !== undefined;
  const [configOpen, setConfigOpen] = useState(!isEditMode);
  const [titleOpen, setTitleOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  
  // Use chart editor state hook
  const {
    config: chartConfig,
    setConfig: setChartConfig,
    parsedData,
    numericColumns,
    selectedTraceIndex,
    setSelectedTraceIndex,
    isLoading: csvLoading,
  } = useChartEditorState({
    // IMPORTANT: pass through the actual chart when editing so the form is populated.
    // In "add" mode, let the hook initialize its own defaults; we then sync sources from directUrl.
    initialConfig: editingChart,
  });
  
  // Get available columns from parsed data
  const availableColumns = parsedData.columns;

  // Stabilize cogSources to prevent effect re-triggers from parent re-renders
  const cogSourcesKey = cogSources.map(s => s.url || '').join('|');
  const stableCogSources = useMemo(() => cogSources, [cogSourcesKey]);

  // Track dirty state
  const [isDirty, setIsDirty] = useState(false);

  // Sync form state with editingChart when it changes
  useEffect(() => {
    if (editingChart) {
      setDirectUrl(editingChart.sources?.[0]?.url || '');
      setChartTitle(editingChart.title || '');
      setChartSubtitle(editingChart.subtitle || '');
      setChartLabel(editingChart.sources?.[0]?.label || '');
      setIsDirty(false);
    }
  }, [editingChart]);

  // Initialize band labels from editingChart if pixelValues
  useEffect(() => {
    if (editingChart?.sources?.[0]?.type === 'pixelValues' && Array.isArray(editingChart.x)) {
      setBandLabels(editingChart.x as string[]);
      setBandCount((editingChart.x as string[]).length);
    }
  }, [editingChart]);

  // Hydrate inline fields when editing an existing inline chart
  useEffect(() => {
    if (editingChart?.sources?.[0]?.type === 'inline' && Array.isArray(editingChart.sources[0].fields)) {
      setInlineFields(editingChart.sources[0].fields as string[]);
    }
  }, [editingChart]);

  // When entering Field Values mode, default chartConfig to a Pie shape
  // matching the target inline JSON contract (x:'field', traces[0]={y:'value', type:'pie'}).
  useEffect(() => {
    if (sourceType !== 'fieldValues') return;
    setChartConfig(prev => {
      const firstTrace = prev.traces?.[0];
      const alreadyPie = firstTrace?.type === 'pie' || prev.chartType === 'pie';
      if (alreadyPie && prev.x === 'field') return prev;
      return {
        ...prev,
        chartType: 'pie',
        x: 'field',
        traces: [{ y: 'value', type: 'pie' }],
        layout: { height: 400, showlegend: true, ...(prev.layout || {}) },
      };
    });
  }, [sourceType, setChartConfig]);

  // Fetch COG header metadata to detect band count when source changes
  useEffect(() => {
    if (sourceType !== 'pixelValues' || stableCogSources.length === 0) return;
    const source = stableCogSources[selectedCogIndex];
    if (!source?.url) return;

    const requestId = ++bandFetchRef.current;
    setBandLoading(true);

    fetchCogHeaderMetadata(source.url)
      .then((meta) => {
        if (requestId !== bandFetchRef.current) return;
        const count = meta.samplesPerPixel || 1;
        setBandCount(count);

        // Only auto-populate if labels are empty or count changed
        setBandLabels(prev => {
          if (prev.length === count) return prev;
          return Array.from({ length: count }, (_, i) => String(i + 1));
        });
      })
      .catch(() => {
        if (requestId !== bandFetchRef.current) return;
        if (bandCount === 0) {
          setBandCount(1);
          setBandLabels(['1']);
        }
      })
      .finally(() => {
        if (requestId === bandFetchRef.current) setBandLoading(false);
      });
  }, [sourceType, selectedCogIndex, stableCogSources]);

  // Sync band labels to chartConfig.x and ensure a default trace exists
  useEffect(() => {
    if (sourceType !== 'pixelValues' || bandLabels.length === 0) return;
    setChartConfig(prev => {
      const updates: Partial<ChartConfig> = { x: bandLabels };
      if (!prev.traces || prev.traces.length === 0) {
        updates.traces = [{ name: 'Reflectance', type: 'scatter', mode: 'lines' }];
        setSelectedTraceIndex(0);
      }
      return { ...prev, ...updates };
    });
  }, [bandLabels, sourceType, setChartConfig, setSelectedTraceIndex]);

  // Fetch sample pixel values from COG center when bands are ready
  useEffect(() => {
    if (sourceType !== 'pixelValues' || stableCogSources.length === 0 || bandCount === 0) {
      setSamplePixelValues(null);
      return;
    }
    const source = stableCogSources[selectedCogIndex];
    if (!source?.url) return;

    const requestId = ++sampleFetchRef.current;
    setSampleLoading(true);

    fetchCogCenterPixel(source.url)
      .then((result) => {
        if (requestId !== sampleFetchRef.current) return;
        setSamplePixelValues(result.bandValues);
      })
      .catch(() => {
        if (requestId !== sampleFetchRef.current) return;
        setSamplePixelValues(null);
      })
      .finally(() => {
        if (requestId === sampleFetchRef.current) setSampleLoading(false);
      });
  }, [sourceType, selectedCogIndex, stableCogSources, bandCount]);


  useEffect(() => {
    const trimmedUrl = directUrl.trim();
    const currentUrl = chartConfig.sources?.[0]?.url;
    
    if (trimmedUrl && trimmedUrl !== currentUrl) {
      setChartConfig(prev => ({
        ...prev,
        sources: [{ type: 'externalURL' as const, url: trimmedUrl, format: 'csv' as const }]
      }));
    }
  }, [directUrl, chartConfig.sources, setChartConfig]);

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
          labels: (typeof chartConfig.x === 'string' ? chartConfig.x : '') || '',
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
          y: firstTrace?.y || (typeof chartConfig.x === 'string' ? chartConfig.x : '') || '',
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
    
    if (sourceType === 'pixelValues') {
      if (cogSources.length === 0) {
        toast({
          title: "No COG Sources",
          description: "This layer has no COG data sources configured.",
          variant: "destructive"
        });
        return;
      }

      const chartSource: ChartSource = {
        type: 'pixelValues',
        ...(chartLabel.trim() && { label: chartLabel.trim() })
      };

      const finalConfig: ChartConfig = {
        ...chartConfig,
        title: chartTitle.trim() || undefined,
        subtitle: chartSubtitle.trim() || undefined,
        sources: [chartSource]
      };

      dispatch({
        type: 'SET_UNSAVED_FORM_CHANGES',
        payload: { hasChanges: false, description: null }
      });

      if (editingChart && editingIndex !== undefined && onUpdateChart) {
        onUpdateChart(finalConfig, editingIndex);
        toast({ title: "Chart Updated", description: "Chart configuration has been updated." });
      } else {
        onAddChart(finalConfig);
        toast({ title: "Chart Added", description: "Chart has been added to the layer." });
      }
      return;
    }

    if (sourceType === 'fieldValues') {
      const chartSource: ChartSource = {
        type: 'inline',
        fields: inlineFields,
        ...(chartLabel.trim() && { label: chartLabel.trim() })
      };

      const finalConfig: ChartConfig = {
        ...chartConfig,
        title: chartTitle.trim() || undefined,
        subtitle: chartSubtitle.trim() || undefined,
        sources: [chartSource]
      };

      dispatch({
        type: 'SET_UNSAVED_FORM_CHANGES',
        payload: { hasChanges: false, description: null }
      });

      if (editingChart && editingIndex !== undefined && onUpdateChart) {
        onUpdateChart(finalConfig, editingIndex);
        toast({ title: "Chart Updated", description: "Chart configuration has been updated." });
      } else {
        onAddChart(finalConfig);
        toast({ title: "Chart Added", description: "Chart has been added to the layer." });
      }
      return;
    }

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
      title: chartTitle.trim() || undefined,
      subtitle: chartSubtitle.trim() || undefined,
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
  const isPixelValuesReady = sourceType === 'pixelValues' && bandLabels.length > 0 && !bandLoading;
  const isFieldValuesMode = sourceType === 'fieldValues';
  const showConfig = hasUrl || isPixelValuesReady || isFieldValuesMode;
  const showPreview = (hasUrl && hasColumns) || isPixelValuesReady || isFieldValuesMode;
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
              <div className="grid grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setSourceType('direct')}
                  className={`p-4 border rounded-lg text-center flex flex-col items-center transition-colors ${
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
                  className={`p-4 border rounded-lg text-center flex flex-col items-center transition-colors ${
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
                <button
                  type="button"
                  onClick={() => setSourceType('pixelValues')}
                  className={`p-4 border rounded-lg text-center flex flex-col items-center transition-colors ${
                    sourceType === 'pixelValues'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Activity className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-medium">Pixel Values</div>
                  <div className="text-sm text-muted-foreground">
                    Spectral signature from COG bands
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('fieldValues')}
                  className={`p-4 border rounded-lg text-center flex flex-col items-center transition-colors ${
                    sourceType === 'fieldValues'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <ListTree className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-medium">Field Values</div>
                  <div className="text-sm text-muted-foreground">
                    Charts from vector data fields
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

            {/* URL Input - only for CSV-based sources */}
            {sourceType !== 'pixelValues' && sourceType !== 'fieldValues' && (
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
            )}

            {/* Pixel Values: COG source selector */}
            {sourceType === 'pixelValues' && (
              <div className="space-y-4">
                {cogSources.length === 0 ? (
                  <div className="flex items-center gap-2 p-4 border border-dashed rounded-lg text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    No COG data sources are configured on this layer. Add a COG data source first.
                  </div>
                ) : cogSources.length > 1 ? (
                  <div className="space-y-2">
                    <Label>Sample Source</Label>
                    <Select
                      value={String(selectedCogIndex)}
                      onValueChange={(v) => setSelectedCogIndex(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a COG source" />
                      </SelectTrigger>
                      <SelectContent>
                        {cogSources.map((src, i) => {
                          const label = src.url
                            ? src.url.split('/').pop()?.split('?')[0] || `Source ${i + 1}`
                            : `Source ${i + 1}`;
                          return (
                            <SelectItem key={i} value={String(i)}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose which COG source to use for band detection and sample preview
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Using: {cogSources[0]?.url?.split('/').pop()?.split('?')[0] || 'COG source'}
                  </div>
                )}

                {/* Band Label Editor */}
                {cogSources.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <Label>Band Labels (X-Axis)</Label>
                      {bandLoading && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Detecting bands...
                        </span>
                      )}
                    </div>
                    {!bandLoading && bandCount > 0 && (
                      <div className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                        <div>
                          <p className="text-sm font-medium">
                            {bandCount} band{bandCount !== 1 ? 's' : ''} detected
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Using band numbers as X-axis labels
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setBandLabelDialogOpen(true)}
                        >
                          <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                          Customize Labels
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Chart Title (collapsible: main title, sub-title, source label) */}
            <Collapsible open={titleOpen} onOpenChange={setTitleOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 bg-muted/50 rounded-lg hover:bg-muted">
                {titleOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="font-medium">Chart Title(s)</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chartTitle">Main Title (optional)</Label>
                    <Input
                      id="chartTitle"
                      value={chartTitle}
                      onChange={(e) => setChartTitle(e.target.value)}
                      placeholder="Enter chart title"
                    />
                    <p className="text-xs text-muted-foreground">
                      Also used in drop down when multiple charts available
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chartSubtitle">Sub-title (optional)</Label>
                    <Input
                      id="chartSubtitle"
                      value={chartSubtitle}
                      onChange={(e) => setChartSubtitle(e.target.value)}
                      placeholder="Enter chart sub-title"
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Chart Configuration Section - only show when URL is provided */}
            {showConfig && (
              <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 bg-muted/50 rounded-lg hover:bg-muted">
                  {configOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">Chart Data Configuration</span>
                  {csvLoading && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                      <span className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading CSV...
                    </span>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  {isPixelValuesReady ? (
                    <>
                      {/* Simplified chart type selector for pixelValues - no pie/histogram */}
                      <ChartTypeSelector
                        config={chartConfig}
                        onChange={setChartConfig}
                      />

                      {/* Trace styling only - no column pickers needed */}
                      {chartConfig.traces && chartConfig.traces.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Trace Styling</Label>
                          {chartConfig.traces.map((trace, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">{trace.name || `Trace ${i + 1}`}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs ml-auto"
                                onClick={() => setSelectedTraceIndex(i)}
                              >
                                Edit
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedTrace && selectedTraceIndex !== null && (
                        <TraceEditor
                          trace={selectedTrace}
                          traceIndex={selectedTraceIndex}
                          columns={bandLabels}
                          hideYColumn
                          onUpdate={(updatedTrace) => {
                            const newTraces = [...(chartConfig.traces || [])];
                            newTraces[selectedTraceIndex] = updatedTrace;
                            setChartConfig({ ...chartConfig, traces: newTraces });
                          }}
                          onRemove={() => {
                            const newTraces = [...(chartConfig.traces || [])];
                            newTraces.splice(selectedTraceIndex, 1);
                            setChartConfig({ ...chartConfig, traces: newTraces });
                            setSelectedTraceIndex(null);
                          }}
                        />
                      )}
                    </>
                  ) : csvLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <span className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-sm">Fetching CSV data...</span>
                    </div>
                  ) : availableColumns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <span className="text-sm">No columns found. Please check the CSV URL.</span>
                    </div>
                  ) : (
                    <>
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
                          numericColumns={numericColumns}
                          onConfigChange={setChartConfig}
                        />
                      ) : displayType === 'histogram' ? (
                        <HistogramEditor
                          config={chartConfig}
                          numericColumns={numericColumns}
                          onConfigChange={setChartConfig}
                        />
                      ) : (
                        <div className="flex gap-4">
                          {/* Quick Add Panel for X/Y selection */}
                          <div className="w-[40%]">
                            <QuickAddPanel
                              config={chartConfig}
                              columns={availableColumns}
                              selectedTraceIndex={selectedTraceIndex}
                              onConfigChange={setChartConfig}
                              onSelectTrace={setSelectedTraceIndex}
                            />
                          </div>

                          {/* Trace Editor */}
                          {selectedTrace && selectedTraceIndex !== null && (
                            <div className="w-[60%]">
                              <TraceEditor
                                trace={selectedTrace}
                                traceIndex={selectedTraceIndex}
                                columns={availableColumns}
                                onUpdate={(updatedTrace) => {
                                  const newTraces = [...(chartConfig.traces || [])];
                                  newTraces[selectedTraceIndex] = updatedTrace;
                                  setChartConfig({ ...chartConfig, traces: newTraces });
                                }}
                                onRemove={() => {
                                  const newTraces = [...(chartConfig.traces || [])];
                                  newTraces.splice(selectedTraceIndex, 1);
                                  setChartConfig({ ...chartConfig, traces: newTraces });
                                  setSelectedTraceIndex(null);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Chart Settings Section (axes + legend) - hidden for pie charts */}
            {showConfig && displayType !== 'pie' && (
              <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 bg-muted/50 rounded-lg hover:bg-muted">
                  {settingsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">Legend and Axis Settings</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <ChartSettingsPanel config={chartConfig} onChange={setChartConfig} />
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Preview Section */}
            {showPreview && (
              <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-3 bg-muted/50 rounded-lg hover:bg-muted">
                  {previewOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">Preview</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <div className="border rounded-lg p-4 bg-background">
                    {sampleLoading && isPixelValuesReady ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                        <span className="text-sm">Fetching sample pixel data...</span>
                      </div>
                    ) : (
                      <>
                        <PlotlyChartViewer
                          config={{
                            ...chartConfig,
                            title: chartTitle || chartConfig.title,
                            subtitle: chartSubtitle || chartConfig.subtitle,
                            ...(sourceType === 'pixelValues' ? { sources: [{ type: 'pixelValues' as const }] } : {})
                          }}
                          data={parsedData}
                          sampleData={samplePixelValues || undefined}
                        />
                        {isPixelValuesReady && samplePixelValues && (
                          <p className="text-xs text-muted-foreground text-center mt-1 italic">
                            Sample data from center pixel — actual chart will use clicked location
                          </p>
                        )}
                        {isPixelValuesReady && !samplePixelValues && !sampleLoading && (
                          <p className="text-xs text-destructive text-center mt-1">
                            Could not fetch sample pixel data. Preview shows placeholder values.
                          </p>
                        )}
                      </>
                    )}
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
          allowedFormats={['csv']}
          sourceContext="chart"
        />
      )}

      {/* Band Label Editor Dialog */}
      <BandLabelEditorDialog
        open={bandLabelDialogOpen}
        onOpenChange={setBandLabelDialogOpen}
        labels={bandLabels}
        onSave={setBandLabels}
      />
    </>
  );
}
