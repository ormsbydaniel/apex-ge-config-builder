import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, X, Database, Globe } from 'lucide-react';
import { Service } from '@/types/config';
import { ChartConfig, ChartSource } from '@/types/chart';
import { useToast } from '@/hooks/use-toast';
import { useConfig } from '@/contexts/ConfigContext';
import { ServiceSelectionModal } from './ServiceSelectionModals';
import { ServiceCardList } from './ServiceCardList';

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
  }, [directUrl, chartTitle, chartLabel, dispatch]);

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

    const chartConfig: ChartConfig = {
      chartType: 'xy',
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
      // Preserve existing chart configuration and just update source
      const updatedChart: ChartConfig = {
        ...editingChart,
        ...(chartTitle.trim() && { title: chartTitle.trim() }),
        sources: [chartSource]
      };
      onUpdateChart(updatedChart, editingIndex);
      toast({
        title: "Chart Updated",
        description: "Chart configuration has been updated.",
      });
    } else {
      onAddChart(chartConfig);
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Chart Source' : 'Add Chart Source'}</CardTitle>
          <CardDescription>
            Configure the data source for your chart. Currently supports CSV format.
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
