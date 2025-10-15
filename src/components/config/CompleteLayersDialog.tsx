import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, ChevronRight, Check, AlertTriangle, Loader2, Info } from 'lucide-react';
import { DataSource, LayerValidationResult } from '@/types/config';
import { useTableSorting } from '@/hooks/useTableSorting';
import { validateBatchLayers } from '@/utils/layerValidation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';

interface LayerWithGroup {
  layer: DataSource;
  index: number;
  group: string;
  validationResult?: LayerValidationResult;
}

interface CompleteLayersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: any;
}

const CompleteLayersDialog = ({
  open,
  onOpenChange,
  config
}: CompleteLayersDialogProps) => {
  const [validationResults, setValidationResults] = useState<Map<number, LayerValidationResult>>(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState({ completed: 0, total: 0, currentLayer: '' });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Get complete layers (those with success status in QA)
  const completeLayers = useMemo(() => {
    const layers: LayerWithGroup[] = [];
    
    config.sources.forEach((source: DataSource, index: number) => {
      const hasData = source.data && source.data.length > 0 && source.data.some(d => d.url);
      const hasStatistics = source.statistics && source.statistics.length > 0 && source.statistics.some(s => s.url);
      const hasAnyContent = hasData || hasStatistics;
      const hasAttribution = source.meta?.attribution?.text;
      const hasLegend = source.layout?.layerCard?.legend || source.layout?.infoPanel?.legend;
      
      // Check swipe configuration completeness
      const isSwipeLayer = source.meta?.swipeConfig !== undefined;
      let swipeComplete = true;
      if (isSwipeLayer) {
        const swipeConfig = source.meta.swipeConfig;
        const hasClippedSource = swipeConfig?.clippedSourceName && swipeConfig.clippedSourceName.trim() !== '';
        const hasBaseSources = swipeConfig?.baseSourceNames && swipeConfig.baseSourceNames.length > 0;
        swipeComplete = hasClippedSource && hasBaseSources;
      }
      
      // Only include layers that pass all QA checks (green status)
      const isComplete = hasAnyContent && hasAttribution && hasLegend && (!isSwipeLayer || swipeComplete);
      
      if (isComplete) {
        let group = 'Ungrouped';
        
        if (source.isBaseLayer) {
          group = 'Base Layers';
        } else if (source.layout?.interfaceGroup) {
          group = source.layout.interfaceGroup;
        }
        
        layers.push({
          layer: source,
          index,
          group,
          validationResult: validationResults.get(index)
        });
      }
    });
    
    return layers;
  }, [config.sources, validationResults]);

  // Sort layers to match the Layers tab order:
  // 1. Interface Groups (in config.interfaceGroups order)
  // 2. Base Layers
  // 3. Ungrouped Layers
  const sortedLayers = useMemo(() => {
    return [...completeLayers].sort((a, b) => {
      // Define group order based on LayerHierarchy.tsx logic
      const getGroupOrder = (group: string) => {
        if (group === 'Base Layers') return 1000; // Base layers come after interface groups
        if (group === 'Ungrouped') return 2000; // Ungrouped comes last
        
        // Interface groups: use their position in config.interfaceGroups
        const groupIndex = config.interfaceGroups?.indexOf(group);
        if (groupIndex !== undefined && groupIndex >= 0) {
          return groupIndex; // 0-based index for interface groups
        }
        
        return 1500; // Unknown groups go between base and ungrouped
      };
      
      const orderA = getGroupOrder(a.group);
      const orderB = getGroupOrder(b.group);
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Within same group, maintain source order (by index)
      return a.index - b.index;
    });
  }, [completeLayers, config.interfaceGroups]);

  const handleRunDetailedReport = async () => {
    setIsValidating(true);
    setValidationProgress({ completed: 0, total: completeLayers.length, currentLayer: '' });
    
    try {
      const layersToValidate = completeLayers.map(l => l.layer);
      
      const results = await validateBatchLayers(
        layersToValidate,
        (completed, total, layerName) => {
          setValidationProgress({ completed, total, currentLayer: layerName });
        }
      );
      
      setValidationResults(results);
      
      // Count results
      const errorCount = Array.from(results.values()).filter(r => r.overallStatus === 'error').length;
      const partialCount = Array.from(results.values()).filter(r => r.overallStatus === 'partial').length;
      const validCount = Array.from(results.values()).filter(r => r.overallStatus === 'valid').length;
      
      toast({
        title: "Validation Complete",
        description: `${validCount} valid, ${partialCount} partial, ${errorCount} with errors`,
      });
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Failed",
        description: "An error occurred during validation. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const toggleRowExpansion = (layerKey: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(layerKey)) {
        next.delete(layerKey);
      } else {
        next.add(layerKey);
      }
      return next;
    });
  };


  const getStatusBadge = (result?: LayerValidationResult) => {
    if (!result) {
      return <Badge variant="outline" className="text-muted-foreground">Not Validated</Badge>;
    }
    
    switch (result.overallStatus) {
      case 'valid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Valid
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Issues Found
          </Badge>
        );
      case 'checking':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Checking...
          </Badge>
        );
      default:
        return <Badge variant="outline">Not Validated</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Complete Layers Validation</DialogTitle>
          <DialogDescription>
            Review all complete layers and run a detailed report to validate data sources and statistics URLs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {completeLayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No complete layers found. Complete layers have data, attribution, and legend configured.
            </div>
          ) : (
            <>
              {/* Progress indicator */}
              {isValidating && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Validating layers... {validationProgress.completed} / {validationProgress.total}
                    </span>
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                  {validationProgress.currentLayer && (
                    <div className="text-xs text-blue-700">
                      Currently checking: {validationProgress.currentLayer}
                    </div>
                  )}
                </div>
              )}

              {/* Summary after validation */}
              {validationResults.size > 0 && !isValidating && (
                <div className="mb-4 p-4 bg-muted/50 border rounded-md">
                  <div className="text-sm font-medium mb-2">Validation Summary</div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">
                      {Array.from(validationResults.values()).filter(r => r.overallStatus === 'valid').length} Valid
                    </span>
                    <span className="text-amber-600">
                      {Array.from(validationResults.values()).filter(r => r.overallStatus === 'partial').length} Partial
                    </span>
                    <span className="text-red-600">
                      {Array.from(validationResults.values()).filter(r => r.overallStatus === 'error').length} Issues
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex-1 overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Interface Group</TableHead>
                      <TableHead>Layer Name</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLayers.map((item) => {
                      const layerKey = `${item.index}`;
                      const isExpanded = expandedRows.has(layerKey);
                      const hasUrlResults = item.validationResult && item.validationResult.urlResults.length > 0;
                      const hasIssues = item.validationResult && (item.validationResult.overallStatus === 'error' || item.validationResult.overallStatus === 'partial');
                      
                      return (
                        <React.Fragment key={layerKey}>
                          <TableRow className={hasIssues ? 'bg-red-50/50' : ''}>
                            <TableCell>
                              {hasUrlResults && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleRowExpansion(layerKey)}
                                >
                                  <ChevronRight 
                                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                  />
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>{item.group}</TableCell>
                            <TableCell className="font-medium">
                              {item.layer.name}
                            </TableCell>
                            <TableCell>{getStatusBadge(item.validationResult)}</TableCell>
                          </TableRow>
                          
                          {/* Expanded details row */}
                          {isExpanded && hasUrlResults && (
                            <TableRow>
                              <TableCell colSpan={4} className="bg-muted/30 p-4">
                                <div className="space-y-2">
                                  <div className="text-sm font-medium mb-2">URL Validation Details</div>
                                  {item.validationResult!.urlResults.map((urlResult, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-background rounded border">
                                      <div className="flex-shrink-0 mt-0.5">
                                        {urlResult.status === 'valid' ? (
                                          <Check className="h-4 w-4 text-green-600" />
                                        ) : urlResult.status === 'error' ? (
                                          <AlertTriangle className="h-4 w-4 text-red-600" />
                                        ) : (
                                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge variant="outline" className="text-xs">
                                            {urlResult.type}
                                          </Badge>
                                          <span className={`text-xs font-medium ${
                                            urlResult.status === 'valid' ? 'text-green-600' : 
                                            urlResult.status === 'error' ? 'text-red-600' : 
                                            'text-blue-600'
                                          }`}>
                                            {urlResult.status}
                                          </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground break-all">
                                          {urlResult.url}
                                        </div>
                                        {urlResult.error && (
                                          <div className="text-xs text-red-600 mt-1">
                                            Error: {urlResult.error}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 flex justify-between items-center border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  {completeLayers.length} complete layer{completeLayers.length !== 1 ? 's' : ''} found
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={handleRunDetailedReport}
                    disabled={isValidating}
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Info className="h-4 w-4 mr-2" />
                        Run Detailed Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteLayersDialog;
