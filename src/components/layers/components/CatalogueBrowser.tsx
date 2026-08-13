import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Folder, Map, Search, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CatalogueDataset, CatalogueLayer } from '@/types/config';
import { useToast } from '@/hooks/use-toast';
import { DataSourceFormat } from '@/types/config';
import {
  fetchCatalogueCollection,
  groupCatalogueDatasetsByTheme,
  isCatalogueDatasetSelectable,
  catalogueDatasetUnavailableReason,
  catalogueDatasetFormat,
} from '@/utils/catalogueService';

import { fetchServiceVersion } from '@/utils/serviceCapabilities';
import {
  CatalogueStyleSuggestion,
  legendToStyleSuggestion,
  primaryLayerLegend,
  describeStyleSuggestion,
  styleSuggestionPreviewCss,
} from '@/utils/catalogueLegend';


function ExpandableText({ text, className = '' }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={className}>
      <p className={`text-sm text-muted-foreground ${expanded ? '' : 'line-clamp-2'}`}>{text}</p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="text-xs text-primary hover:underline mt-1"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}

export interface CatalogueLayerSelection {
  datasetIdentifier: string;
  layerIdentifier: string;
  serviceUrl: string;
  getCapabilitiesUrl: string;
  title: string;
  layerTitle?: string;
  abstract?: string;
  format: 'wmts' | 'wms';
  version?: string;
  /** Styling derived from the catalogue legend, applied when the layer is added. */
  styleSuggestion?: CatalogueStyleSuggestion;
}



interface CatalogueBrowserProps {
  serviceUrl: string;
  serviceName: string;
  /** Default format for layers discovered in this catalogue. */
  defaultFormat?: 'wmts' | 'wms';
  onLayerSelect: (layers: CatalogueLayerSelection | CatalogueLayerSelection[]) => void;
}

type BrowserStep = 'themes' | 'datasets' | 'layers';

const CatalogueBrowser = ({ serviceUrl, serviceName, defaultFormat = 'wmts', onLayerSelect }: CatalogueBrowserProps) => {
  const [step, setStep] = useState<BrowserStep>('themes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [datasets, setDatasets] = useState<CatalogueDataset[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<CatalogueDataset | null>(null);
  const [title, setTitle] = useState<string>(serviceName);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const collection = await fetchCatalogueCollection(serviceUrl);
        if (cancelled) return;
        setTitle(collection.meta.title || serviceName);
        setDatasets(collection.datasets || []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Failed to load catalogue');
        toast({
          title: 'Catalogue Error',
          description: e?.message || 'Failed to load catalogue',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [serviceUrl, serviceName, toast]);

  const groupedThemes = useMemo(() => groupCatalogueDatasetsByTheme(datasets), [datasets]);
  const themes = useMemo(() => Array.from(groupedThemes.keys()), [groupedThemes]);

  const filteredThemes = useMemo(() => {
    const visible = showUnavailable
      ? themes
      : themes.filter(theme => (groupedThemes.get(theme) || []).some(isCatalogueDatasetSelectable));
    if (!searchTerm.trim()) return visible;
    const term = searchTerm.toLowerCase();
    return visible.filter(theme => theme.toLowerCase().includes(term));
  }, [themes, searchTerm, showUnavailable, groupedThemes]);


  const themeDatasets = useMemo(() => {
    if (!selectedTheme) return [];
    return groupedThemes.get(selectedTheme) || [];
  }, [selectedTheme, groupedThemes]);

  const filteredDatasets = useMemo(() => {
    const list = showUnavailable
      ? themeDatasets
      : themeDatasets.filter(isCatalogueDatasetSelectable);
    if (!searchTerm.trim() || step !== 'datasets') return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      d =>
        d.title.toLowerCase().includes(term) ||
        (d.abstract && d.abstract.toLowerCase().includes(term)) ||
        d.datasetIdentifier.toLowerCase().includes(term),
    );
  }, [themeDatasets, searchTerm, step, showUnavailable]);


  const filteredLayers = useMemo(() => {
    if (!selectedDataset) return [];
    let layers = selectedDataset.layers || [];
    if (searchTerm.trim() && step === 'layers') {
      const term = searchTerm.toLowerCase();
      layers = layers.filter(
        l =>
          l.identifier.toLowerCase().includes(term) ||
          (l.title && l.title.toLowerCase().includes(term)) ||
          (l.abstract && l.abstract.toLowerCase().includes(term)),
      );
    }
    return layers;
  }, [selectedDataset, searchTerm, step]);

  const selectedDatasetSelectable = selectedDataset ? isCatalogueDatasetSelectable(selectedDataset) : false;

  const handleThemeSelect = (theme: string) => {
    setSelectedTheme(theme);
    setSearchTerm('');
    setStep('datasets');
  };

  const handleDatasetSelect = (dataset: CatalogueDataset) => {
    setSelectedDataset(dataset);
    setSearchTerm('');
    setStep('layers');
  };

  const handleBack = () => {
    if (step === 'layers') {
      setSelectedDataset(null);
      setStep('datasets');
    } else if (step === 'datasets') {
      setSelectedTheme(null);
      setStep('themes');
    }
  };

  const buildSelection = async (
    dataset: CatalogueDataset,
    layer: CatalogueLayer,
  ): Promise<CatalogueLayerSelection> => {
    const format = catalogueDatasetFormat(dataset, defaultFormat);
    const getCapabilitiesUrl = dataset.getCapabilitiesUrl || '';
    const version = getCapabilitiesUrl
      ? await fetchServiceVersion(getCapabilitiesUrl, format as DataSourceFormat)
      : undefined;
    return {
      datasetIdentifier: dataset.datasetIdentifier,
      layerIdentifier: layer.identifier,
      serviceUrl: dataset.serviceUrl || '',
      getCapabilitiesUrl,
      title: dataset.title,
      layerTitle: layer.title,
      abstract: layer.abstract || dataset.abstract,
      format,
      ...(version ? { version } : {}),
    };
  };

  const handleLayerSelect = async (layer: CatalogueLayer) => {
    if (!selectedDataset) return;
    if (!isCatalogueDatasetSelectable(selectedDataset)) {
      toast({
        title: 'Dataset unavailable',
        description: catalogueDatasetUnavailableReason(selectedDataset),
        variant: 'destructive',
      });
      return;
    }
    const selection = await buildSelection(selectedDataset, layer);
    onLayerSelect(selection);
  };

  const handleAddAllDatasetLayers = async () => {
    if (!selectedDataset || !isCatalogueDatasetSelectable(selectedDataset)) return;
    const selections = await Promise.all(
      (selectedDataset.layers || []).map(layer => buildSelection(selectedDataset, layer))
    );
    onLayerSelect(selections);
  };


  const summary = useMemo(() => {
    const available = datasets.filter(isCatalogueDatasetSelectable).length;
    const unavailable = datasets.length - available;
    return { available, unavailable };
  }, [datasets]);


  if (loading && datasets.length === 0) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid gap-3 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error && datasets.length === 0) {
    return (
      <div className="p-6 border rounded-lg bg-destructive/10 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="space-y-4 shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {summary.available} available{summary.unavailable > 0 ? ` · ${summary.unavailable} unavailable` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {step !== 'themes' && (
                <Button variant="outline" size="sm" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              {step === 'layers' && selectedDatasetSelectable && (
                <Button variant="outline" size="sm" onClick={handleAddAllDatasetLayers}>
                  Add all
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-unavailable"
                checked={showUnavailable}
                onCheckedChange={setShowUnavailable}
              />
              <Label htmlFor="show-unavailable" className="text-sm flex items-center gap-1">
                {showUnavailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Show unavailable
              </Label>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={step === 'themes' ? 'Search themes...' : step === 'datasets' ? 'Search datasets...' : 'Search layers...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto mt-4">

      {step === 'themes' && (
        <div className="grid gap-3">
          {filteredThemes.map((theme) => {
            const themeDs = groupedThemes.get(theme) || [];
            const availableCount = themeDs.filter(isCatalogueDatasetSelectable).length;
            const unavailableCount = themeDs.length - availableCount;
            return (
              <Card
                key={theme}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleThemeSelect(theme)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Folder className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">{theme}</h4>
                      <p className="text-sm text-muted-foreground">{themeDs.length} dataset{themeDs.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {unavailableCount > 0 && !showUnavailable && (
                      <Badge variant="outline" className="text-muted-foreground">
                        {unavailableCount} unavailable
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      {availableCount} available
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredThemes.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No themes match your search.</p>
          )}
        </div>
      )}

      {step === 'datasets' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Folder className="h-4 w-4" />
            <span className="font-medium">{selectedTheme}</span>
          </div>
          <div className="grid gap-3">
            {filteredDatasets.map((dataset) => {
              const selectable = isCatalogueDatasetSelectable(dataset);
              const layerCount = dataset.layers?.length ?? 0;
              return (
                <Card
                  key={dataset.datasetIdentifier}
                  className={`cursor-pointer transition-colors ${selectable ? 'hover:border-primary' : 'opacity-60 border-dashed'}`}
                  onClick={() => handleDatasetSelect(dataset)}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-medium ${selectable ? '' : 'text-muted-foreground'}`}>
                          {dataset.title}
                        </h4>
                        {dataset.serviceType && selectable && (
                          <Badge variant="outline">{dataset.serviceType}</Badge>
                        )}
                        {!selectable && (
                          <Badge variant="outline" className="border-muted-foreground text-muted-foreground">
                            Unavailable
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{dataset.datasetIdentifier}</p>
                      {dataset.abstract && (
                        <ExpandableText text={dataset.abstract} className="mt-1" />
                      )}
                      {!selectable && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {catalogueDatasetUnavailableReason(dataset)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {layerCount > 0 && (
                        <Badge variant="outline" className="border-green-300 text-green-700">
                          {layerCount} layer{layerCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredDatasets.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No datasets match your search.</p>
            )}
          </div>
        </div>
      )}

      {step === 'layers' && selectedDataset && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Folder className="h-4 w-4" />
            <span className="font-medium">{selectedTheme}</span>
            <ChevronRight className="h-4 w-4" />
            <Map className="h-4 w-4" />
            <span className="font-medium">{selectedDataset.title}</span>
          </div>
          {!selectedDatasetSelectable && (
            <div className="p-3 border rounded bg-muted/50 text-sm text-muted-foreground flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {catalogueDatasetUnavailableReason(selectedDataset)} Datasets like this are listed for
              information only and cannot be added to your configuration.
            </div>
          )}
          <div className="grid gap-3">
            {filteredLayers.map((layer) => (
              <Card
                key={layer.identifier}
                className={`transition-colors ${selectedDatasetSelectable ? 'hover:border-primary' : 'opacity-60 border-dashed'}`}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${selectedDatasetSelectable ? '' : 'text-muted-foreground'}`}>
                      {layer.title || layer.identifier}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">{layer.identifier}</p>
                    {layer.abstract && (
                      <ExpandableText text={layer.abstract} className="mt-1" />
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            disabled={!selectedDatasetSelectable}
                            onClick={() => handleLayerSelect(layer)}
                          >
                            Add layer
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!selectedDatasetSelectable && (
                        <TooltipContent>
                          <p>Dataset unavailable</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>
            ))}
            {filteredLayers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {(selectedDataset.layers?.length ?? 0) === 0
                  ? 'This dataset has no map layers in the catalogue.'
                  : 'No layers match your search.'}
              </p>
            )}

          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CatalogueBrowser;
