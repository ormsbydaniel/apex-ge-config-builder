import React, { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Check, AlertTriangle, Loader2, Info, Zap, XCircle, ArrowUpDown, Filter as FilterIcon } from 'lucide-react';
import { DataSource, LayerValidationResult } from '@/types/config';
import { validateBatchLayers } from '@/utils/layerValidation';
import {
  deriveHealthcheckColumns,
  DataAccessStatus,
  PerformanceStatus,
  dataAccessLabel,
  performanceLabel,
} from '@/utils/healthcheckColumns';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  onValidationComplete?: (results: Map<number, LayerValidationResult>) => void;
  existingResults?: Map<number, LayerValidationResult>;
}

type RowState = 'queued' | 'checking' | 'done';

// ---------- Badge renderers ----------

const DataAccessBadge: React.FC<{ status: DataAccessStatus }> = ({ status }) => {
  const styles: Record<DataAccessStatus, string> = {
    pass: 'bg-green-50 text-green-700 border-green-200',
    partial: 'bg-amber-50 text-amber-700 border-amber-200',
    fail: 'bg-red-50 text-red-700 border-red-200',
    na: 'bg-muted text-muted-foreground border-border',
  };
  const Icon =
    status === 'pass' ? Check :
    status === 'partial' ? AlertTriangle :
    status === 'fail' ? XCircle : Info;
  return (
    <Badge variant="outline" className={styles[status]}>
      <Icon className="h-3 w-3 mr-1" />
      {dataAccessLabel[status]}
    </Badge>
  );
};

const PerformanceBadge: React.FC<{ status: PerformanceStatus }> = ({ status }) => {
  const styles: Record<PerformanceStatus, string> = {
    good: 'bg-green-50 text-green-700 border-green-200',
    average: 'bg-amber-50 text-amber-700 border-amber-200',
    poor: 'bg-red-50 text-red-700 border-red-200',
    na: 'bg-muted text-muted-foreground border-border',
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {status !== 'na' && <Zap className="h-3 w-3 mr-1" />}
      {performanceLabel[status]}
    </Badge>
  );
};

const StateBadge: React.FC<{ state: RowState }> = ({ state }) => {
  if (state === 'queued') {
    return <Badge variant="outline" className="text-muted-foreground">Queued</Badge>;
  }
  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
      Checking…
    </Badge>
  );
};

// ---------- Main component ----------

const CompleteLayersDialog = ({
  open,
  onOpenChange,
  config,
  onValidationComplete,
  existingResults,
}: CompleteLayersDialogProps) => {
  const [validationResults, setValidationResults] = useState<Map<number, LayerValidationResult>>(
    existingResults || new Map()
  );
  const [rowStates, setRowStates] = useState<Map<number, RowState>>(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState({ completed: 0, total: 0, currentLayer: '' });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filters
  const [showPass, setShowPass] = useState(true);
  const [showPartial, setShowPartial] = useState(true);
  const [showFail, setShowFail] = useState(true);
  const [showGood, setShowGood] = useState(true);
  const [showAverage, setShowAverage] = useState(true);
  const [showPoor, setShowPoor] = useState(true);

  // Sort state — only one column can be actively sorted at a time
  type SortColumn = 'none' | 'dataAccess' | 'performance';
  type SortDir = 'worst' | 'best';
  const [sortColumn, setSortColumn] = useState<SortColumn>('none');
  const [sortDir, setSortDir] = useState<SortDir>('worst');

  const setSort = (column: 'dataAccess' | 'performance', dir: SortDir | 'default') => {
    if (dir === 'default') {
      setSortColumn('none');
    } else {
      setSortColumn(column);
      setSortDir(dir);
    }
  };

  const dataAccessRank: Record<DataAccessStatus, number> = { fail: 0, partial: 1, pass: 2, na: 3 };
  const performanceRank: Record<PerformanceStatus, number> = { poor: 0, average: 1, good: 2, na: 3 };

  // Initialize state inside an effect watching `open` to prevent stale overwrites.
  // Always start with a clean slate so opening the dialog triggers a fresh run.
  React.useEffect(() => {
    if (!open) return;
    setValidationResults(new Map());
    setRowStates(new Map());
    setExpandedRows(new Set());
    setValidationProgress({ completed: 0, total: 0, currentLayer: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Get all layers in display order
  const allLayers = useMemo(() => {
    const layers: LayerWithGroup[] = [];
    config.sources.forEach((source: DataSource, index: number) => {
      let group = 'Ungrouped';
      if (source.isBaseLayer) group = 'Base Layers';
      else if (source.layout?.interfaceGroup) group = source.layout.interfaceGroup;
      layers.push({ layer: source, index, group, validationResult: validationResults.get(index) });
    });
    return layers;
  }, [config.sources, validationResults]);

  const sortedLayers = useMemo(() => {
    const base = [...allLayers].sort((a, b) => {
      const getGroupOrder = (group: string) => {
        if (group === 'Base Layers') return 1000;
        if (group === 'Ungrouped') return 2000;
        const groupIndex = config.interfaceGroups?.indexOf(group);
        if (groupIndex !== undefined && groupIndex >= 0) return groupIndex;
        return 1500;
      };
      const orderA = getGroupOrder(a.group);
      const orderB = getGroupOrder(b.group);
      if (orderA !== orderB) return orderA - orderB;
      return a.index - b.index;
    });

    if (sortColumn === 'none') return base;

    const rankFor = (item: LayerWithGroup) => {
      const result = item.validationResult;
      if (!result) return 99; // unvalidated rows go to the bottom
      const cols = deriveHealthcheckColumns(result);
      return sortColumn === 'dataAccess'
        ? dataAccessRank[cols.dataAccess]
        : performanceRank[cols.performance];
    };

    return [...base].sort((a, b) => {
      const ra = rankFor(a);
      const rb = rankFor(b);
      if (ra === rb) return 0;
      return sortDir === 'worst' ? ra - rb : rb - ra;
    });
  }, [allLayers, config.interfaceGroups, sortColumn, sortDir]);

  const filteredLayers = useMemo(() => {
    return sortedLayers.filter(item => {
      const result = item.validationResult;
      // While not yet validated, always show (so the user can watch progress).
      if (!result) return true;
      const { dataAccess, performance } = deriveHealthcheckColumns(result);

      const daOk =
        (dataAccess === 'pass' && showPass) ||
        (dataAccess === 'partial' && showPartial) ||
        (dataAccess === 'fail' && showFail) ||
        dataAccess === 'na';

      const perfOk =
        (performance === 'good' && showGood) ||
        (performance === 'average' && showAverage) ||
        (performance === 'poor' && showPoor) ||
        performance === 'na';

      return daOk && perfOk;
    });
  }, [sortedLayers, showPass, showPartial, showFail, showGood, showAverage, showPoor]);

  const handleRunDetailedReport = useCallback(async () => {
    setIsValidating(true);
    setValidationProgress({ completed: 0, total: allLayers.length, currentLayer: '' });
    // Mark every row as queued upfront for clear UX.
    const queued = new Map<number, RowState>();
    allLayers.forEach(l => queued.set(l.index, 'queued'));
    setRowStates(queued);

    try {
      const layersToValidate = allLayers.map(l => l.layer);
      // Map batch positional index back to the original config.sources index.
      const positionToSourceIndex = allLayers.map(l => l.index);

      const results = await validateBatchLayers(layersToValidate, config.services, {
        onLayerStart: (positionIdx, layerName) => {
          const sourceIdx = positionToSourceIndex[positionIdx];
          setRowStates(prev => {
            const next = new Map(prev);
            next.set(sourceIdx, 'checking');
            return next;
          });
          setValidationProgress(p => ({ ...p, currentLayer: layerName }));
        },
        onLayerResult: (positionIdx, result) => {
          const sourceIdx = positionToSourceIndex[positionIdx];
          setValidationResults(prev => {
            const next = new Map(prev);
            next.set(sourceIdx, result);
            return next;
          });
          setRowStates(prev => {
            const next = new Map(prev);
            next.set(sourceIdx, 'done');
            return next;
          });
        },
        onProgress: (completed, total, layerName) => {
          setValidationProgress({ completed, total, currentLayer: layerName });
        },
      });

      // Re-key results from positional index -> source index for the parent.
      const remapped = new Map<number, LayerValidationResult>();
      results.forEach((r, posIdx) => {
        remapped.set(positionToSourceIndex[posIdx], r);
      });
      onValidationComplete?.(remapped);

      let valid = 0, perf = 0, partial = 0, errors = 0;
      remapped.forEach(r => {
        const { dataAccess, performance } = deriveHealthcheckColumns(r);
        if (dataAccess === 'fail') errors++;
        else if (dataAccess === 'partial') partial++;
        else if (performance !== 'good' && performance !== 'na') perf++;
        else valid++;
      });

      toast({
        title: 'Healthcheck Complete',
        description: `${valid} pass, ${perf} performance, ${partial} partial, ${errors} fail`,
      });
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: 'Healthcheck Failed',
        description: 'An error occurred. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  }, [allLayers, config.services, onValidationComplete]);

  // Auto-run validation each time the dialog opens (fresh run every time)
  React.useEffect(() => {
    if (open && !isValidating) {
      handleRunDetailedReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleRowExpansion = (layerKey: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(layerKey)) next.delete(layerKey);
      else next.add(layerKey);
      return next;
    });
  };

  // Summary counts (derived)
  const summary = useMemo(() => {
    let pass = 0, partial = 0, fail = 0, good = 0, average = 0, poor = 0;
    validationResults.forEach(r => {
      const cols = deriveHealthcheckColumns(r);
      if (cols.dataAccess === 'pass') pass++;
      else if (cols.dataAccess === 'partial') partial++;
      else if (cols.dataAccess === 'fail') fail++;
      if (cols.performance === 'good') good++;
      else if (cols.performance === 'average') average++;
      else if (cols.performance === 'poor') poor++;
    });
    return { pass, partial, fail, good, average, poor };
  }, [validationResults]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Layer Healthcheck</DialogTitle>
          <DialogDescription>
            Real-time validation of every layer's data access and performance.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {allLayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No layers found in configuration.
            </div>
          ) : (
            <>
              {/* Progress indicator */}
              {isValidating && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">
                      Checking layers… {validationProgress.completed} / {validationProgress.total}
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

              {/* Summary + filters */}
              {validationResults.size > 0 && (
                <div className="mb-4 space-y-3">
                  <div className="p-4 bg-muted/50 border rounded-md">
                    <div className="text-sm font-medium mb-2">Healthcheck Summary</div>
                    <div className="flex gap-4 text-sm flex-wrap">
                      <span className="text-green-600">{summary.pass} Pass</span>
                      <span className="text-amber-600">{summary.partial} Partial</span>
                      <span className="text-red-600">{summary.fail} Fail</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-green-600">{summary.good} Good perf</span>
                      <span className="text-amber-600">{summary.average} Average perf</span>
                      <span className="text-red-600">{summary.poor} Poor perf</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Filter:</span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Data Access</span>
                      <FilterCheckbox id="f-pass" label="Pass" checked={showPass} onChange={setShowPass} />
                      <FilterCheckbox id="f-partial" label="Partial" checked={showPartial} onChange={setShowPartial} />
                      <FilterCheckbox id="f-fail" label="Fail" checked={showFail} onChange={setShowFail} />
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">Performance</span>
                      <FilterCheckbox id="f-good" label="Good" checked={showGood} onChange={setShowGood} />
                      <FilterCheckbox id="f-average" label="Average" checked={showAverage} onChange={setShowAverage} />
                      <FilterCheckbox id="f-poor" label="Poor" checked={showPoor} onChange={setShowPoor} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Interface Group</TableHead>
                      <TableHead>Layer Name</TableHead>
                      <TableHead className="w-[160px]">Data Access</TableHead>
                      <TableHead className="w-[140px]">Performance</TableHead>
                      <TableHead className="w-[130px] text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLayers.map((item) => {
                      const layerKey = `${item.index}`;
                      const isExpanded = expandedRows.has(layerKey);
                      const result = item.validationResult;
                      const rowState = rowStates.get(item.index);
                      const hasUrlResults = result && result.urlResults.length > 0;
                      const cols = result ? deriveHealthcheckColumns(result) : null;

                      const rowBg = cols?.dataAccess === 'fail'
                        ? 'bg-red-50/50'
                        : cols?.performance === 'poor'
                          ? 'bg-red-50/30'
                          : cols?.dataAccess === 'partial' || cols?.performance === 'average'
                            ? 'bg-amber-50/40'
                            : '';

                      return (
                        <React.Fragment key={layerKey}>
                          <TableRow className={rowBg}>
                            <TableCell className="text-muted-foreground text-sm">{item.group}</TableCell>
                            <TableCell className="font-medium">{item.layer.name}</TableCell>
                            <TableCell>
                              {cols ? (
                                <DataAccessBadge status={cols.dataAccess} />
                              ) : rowState === 'checking' ? (
                                <StateBadge state="checking" />
                              ) : (
                                <StateBadge state="queued" />
                              )}
                            </TableCell>
                            <TableCell>
                              {cols ? (
                                <PerformanceBadge status={cols.performance} />
                              ) : rowState === 'checking' ? (
                                <StateBadge state="checking" />
                              ) : (
                                <StateBadge state="queued" />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {hasUrlResults && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => toggleRowExpansion(layerKey)}
                                >
                                  <ChevronRight
                                    className={`h-3.5 w-3.5 mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                  />
                                  {isExpanded ? 'Hide details' : 'View details'}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>

                          {isExpanded && hasUrlResults && (
                            <TableRow>
                              <TableCell colSpan={5} className="bg-muted/30 p-4">
                                <div className="space-y-2">
                                  <div className="text-sm font-medium mb-2">URL Validation Details</div>
                                  {result!.urlResults.map((urlResult, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm p-2 bg-background rounded border">
                                      <div className="flex-shrink-0 mt-0.5">
                                        {urlResult.status === 'valid' ? (
                                          <Check className="h-4 w-4 text-green-600" />
                                        ) : urlResult.status === 'performance-warning' ? (
                                          <Zap className="h-4 w-4 text-amber-600" />
                                        ) : urlResult.status === 'error' ? (
                                          <AlertTriangle className="h-4 w-4 text-red-600" />
                                        ) : urlResult.status === 'skipped' ? (
                                          <Info className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <Badge variant="outline" className="text-xs">{urlResult.type}</Badge>
                                          {urlResult.format && (
                                            <Badge variant="outline" className="text-xs">{urlResult.format.toUpperCase()}</Badge>
                                          )}
                                          {urlResult.validationType && (
                                            <Badge variant="outline" className="text-xs bg-muted">{urlResult.validationType}</Badge>
                                          )}
                                          <span className={`text-xs font-medium ${
                                            urlResult.status === 'valid' ? 'text-green-600' :
                                            urlResult.status === 'performance-warning' ? 'text-amber-600' :
                                            urlResult.status === 'error' ? 'text-red-600' :
                                            urlResult.status === 'skipped' ? 'text-muted-foreground' :
                                            'text-blue-600'
                                          }`}>
                                            {urlResult.status === 'performance-warning' ? 'performance' : urlResult.status}
                                          </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground break-all">{urlResult.url}</div>
                                        {urlResult.layers && (
                                          <div className="text-xs text-muted-foreground mt-1">Layer: {urlResult.layers}</div>
                                        )}
                                        {urlResult.warning && (
                                          <div className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                                            <Zap className="h-3 w-3" />
                                            {urlResult.warning}
                                          </div>
                                        )}
                                        {urlResult.error && (
                                          <div className="text-xs text-red-600 mt-1">{urlResult.error}</div>
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
                  {allLayers.length} layer{allLayers.length !== 1 ? 's' : ''} found
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FilterCheckbox: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ id, label, checked, onChange }) => (
  <div className="flex items-center gap-2">
    <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v as boolean)} />
    <Label htmlFor={id} className="text-sm cursor-pointer">{label}</Label>
  </div>
);

export default CompleteLayersDialog;
