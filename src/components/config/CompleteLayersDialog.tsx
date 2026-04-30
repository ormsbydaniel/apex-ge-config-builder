import React, { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Check, AlertTriangle, Loader2, Info, Zap, XCircle, ArrowUpDown, CircleDot, CircleDashed } from 'lucide-react';
import { DataSource, LayerValidationResult } from '@/types/config';
import { validateBatchLayers } from '@/utils/layerValidation';
import {
  deriveHealthcheckColumns,
  DataAccessStatus,
  PerformanceStatus,
  dataAccessLabel,
  performanceLabel,
  computeDataAccessScore,
  computePerformanceScore,
} from '@/utils/healthcheckColumns';
import { HealthcheckScoreGauge } from './HealthcheckScoreGauge';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

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
  /** When true, the dialog clears existing results and runs a fresh healthcheck on open. When false, it just displays existingResults. */
  autoRun?: boolean;
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
  autoRun = true,
}: CompleteLayersDialogProps) => {
  const [validationResults, setValidationResults] = useState<Map<number, LayerValidationResult>>(
    existingResults || new Map()
  );
  const [rowStates, setRowStates] = useState<Map<number, RowState>>(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState({ completed: 0, total: 0, currentLayer: '' });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Quick filter from the Results card — single-select across both metric groups.
  type QuickFilter =
    | { kind: 'dataAccess'; value: DataAccessStatus }
    | { kind: 'performance'; value: PerformanceStatus }
    | null;
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);

  const toggleQuickFilter = (qf: NonNullable<QuickFilter>) => {
    setQuickFilter(prev => {
      const isSame = prev && prev.kind === qf.kind && prev.value === qf.value;
      if (isSame) return null;
      return qf;
    });
  };

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
  // When autoRun is true (re-run requested) start with a clean slate; otherwise
  // hydrate from existingResults so the user sees the previously executed run.
  React.useEffect(() => {
    if (!open) return;
    setValidationResults(autoRun ? new Map() : (existingResults || new Map()));
    setRowStates(new Map());
    setExpandedRows(new Set());
    setValidationProgress({ completed: 0, total: 0, currentLayer: '' });
    setQuickFilter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Get all layers in the dialog's display order (Interface Group → in-group index)
  // so validation runs in the same order the user sees them, not config-file order.
  const allLayers = useMemo(() => {
    const layers: LayerWithGroup[] = [];
    config.sources.forEach((source: DataSource, index: number) => {
      let group = 'Ungrouped';
      if (source.isBaseLayer) group = 'Base Layers';
      else if (source.layout?.interfaceGroup) group = source.layout.interfaceGroup;
      layers.push({ layer: source, index, group, validationResult: validationResults.get(index) });
    });

    const getGroupOrder = (group: string) => {
      if (group === 'Base Layers') return 1000;
      if (group === 'Ungrouped') return 2000;
      const groupIndex = config.interfaceGroups?.indexOf(group);
      if (groupIndex !== undefined && groupIndex >= 0) return groupIndex;
      return 1500;
    };
    layers.sort((a, b) => {
      const orderA = getGroupOrder(a.group);
      const orderB = getGroupOrder(b.group);
      if (orderA !== orderB) return orderA - orderB;
      return a.index - b.index;
    });
    return layers;
  }, [config.sources, config.interfaceGroups, validationResults]);

  const sortedLayers = useMemo(() => {
    // allLayers is already in default display order (group → index).
    if (sortColumn === 'none') return allLayers;

    const rankFor = (item: LayerWithGroup) => {
      const result = item.validationResult;
      if (!result) return 99; // unvalidated rows go to the bottom
      const cols = deriveHealthcheckColumns(result);
      return sortColumn === 'dataAccess'
        ? dataAccessRank[cols.dataAccess]
        : performanceRank[cols.performance];
    };

    return [...allLayers].sort((a, b) => {
      const ra = rankFor(a);
      const rb = rankFor(b);
      if (ra === rb) return 0;
      return sortDir === 'worst' ? ra - rb : rb - ra;
    });
  }, [allLayers, sortColumn, sortDir]);

  const filteredLayers = useMemo(() => {
    return sortedLayers.filter(item => {
      const result = item.validationResult;
      // While not yet validated, always show (so the user can watch progress).
      if (!result) return true;
      const { dataAccess, performance } = deriveHealthcheckColumns(result);

      // Apply mutually-exclusive quick filter from the Results card.
      if (quickFilter) {
        if (quickFilter.kind === 'dataAccess' && dataAccess !== quickFilter.value) return false;
        if (quickFilter.kind === 'performance' && performance !== quickFilter.value) return false;
      }

      return true;
    });
  }, [sortedLayers, quickFilter]);

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

  // Auto-run validation only when explicitly requested via autoRun prop.
  // When autoRun is false the dialog is opened in view-only mode and just
  // displays the previously executed results.
  React.useEffect(() => {
    if (open && autoRun && !isValidating) {
      handleRunDetailedReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoRun]);

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

  const scores = useMemo(() => {
    const list = Array.from(validationResults.values());
    return {
      dataAccess: computeDataAccessScore(list),
      performance: computePerformanceScore(list),
    };
  }, [validationResults]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
        <div className="grid grid-cols-3 gap-4 items-start">
          {/* Col 1: title + description */}
          <DialogHeader className="text-left space-y-1">
            <DialogTitle>Layer Healthcheck</DialogTitle>
            <DialogDescription>
              Real-time validation of every layer's data access and performance.
            </DialogDescription>
          </DialogHeader>

          {/* Col 2: live results card (fixed width, centered) */}
          <div className="flex justify-center">
            {(isValidating || validationResults.size > 0) && (
              <Card className="w-full max-w-sm border-border/50 bg-background/60">
                <CardContent className="p-3 space-y-3">
                   <div className="flex items-center justify-between gap-2">
                     <div className="text-xs font-semibold text-foreground/80 uppercase tracking-wide shrink-0">
                       Results
                     </div>
                     {isValidating && (
                       <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
                         <span>{validationProgress.completed} / {validationProgress.total}</span>
                         <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                       </div>
                     )}
                   </div>
                   {/* helper text moved to bottom of card */}
                  {isValidating && (
                    <div className="text-[11px] text-muted-foreground truncate min-h-[14px]">
                      {validationProgress.currentLayer ? (
                        <>Currently: <span className="font-medium text-foreground/80">{validationProgress.currentLayer}</span></>
                      ) : (
                        '\u00A0'
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-foreground/80 mb-1">Data Access</div>
                      <SummaryChip
                        icon={Check}
                        toneClass="text-green-600"
                        count={summary.pass}
                        label="Pass"
                        active={quickFilter?.kind === 'dataAccess' && quickFilter.value === 'pass'}
                        onClick={() => toggleQuickFilter({ kind: 'dataAccess', value: 'pass' })}
                      />
                      <SummaryChip
                        icon={CircleDashed}
                        toneClass="text-amber-600"
                        count={summary.partial}
                        label="Partial"
                        active={quickFilter?.kind === 'dataAccess' && quickFilter.value === 'partial'}
                        onClick={() => toggleQuickFilter({ kind: 'dataAccess', value: 'partial' })}
                      />
                      <SummaryChip
                        icon={XCircle}
                        toneClass="text-red-600"
                        count={summary.fail}
                        label="Fail"
                        active={quickFilter?.kind === 'dataAccess' && quickFilter.value === 'fail'}
                        onClick={() => toggleQuickFilter({ kind: 'dataAccess', value: 'fail' })}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-foreground/80 mb-1">Performance</div>
                      <SummaryChip
                        icon={CircleDot}
                        toneClass="text-green-600"
                        count={summary.good}
                        label="Good"
                        active={quickFilter?.kind === 'performance' && quickFilter.value === 'good'}
                        onClick={() => toggleQuickFilter({ kind: 'performance', value: 'good' })}
                      />
                      <SummaryChip
                        icon={CircleDashed}
                        toneClass="text-amber-600"
                        count={summary.average}
                        label="Average"
                        active={quickFilter?.kind === 'performance' && quickFilter.value === 'average'}
                        onClick={() => toggleQuickFilter({ kind: 'performance', value: 'average' })}
                      />
                      <SummaryChip
                        icon={XCircle}
                        toneClass="text-red-600"
                        count={summary.poor}
                        label="Poor"
                        active={quickFilter?.kind === 'performance' && quickFilter.value === 'poor'}
                        onClick={() => toggleQuickFilter({ kind: 'performance', value: 'poor' })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Col 3: live score gauges */}
          <div className="flex items-start justify-end gap-3">
            <HealthcheckScoreGauge
              label="Data Access"
              score={scores.dataAccess}
              isRunning={isValidating}
            />
            <HealthcheckScoreGauge
              label="Performance"
              score={scores.performance}
              isRunning={isValidating}
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col mt-4">
          {allLayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No layers found in configuration.
            </div>
          ) : (
            <>

              <div className="flex-1 overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Interface Group</TableHead>
                      <TableHead>Layer Name</TableHead>
                      <TableHead className="w-[150px] align-top">

                        <ColumnHeader
                          title="Data Access"
                          column="dataAccess"
                          activeSortColumn={sortColumn}
                          activeSortDir={sortDir}
                          onSort={(dir) => setSort('dataAccess', dir)}
                        />
                      </TableHead>
                      <TableHead className="w-[140px] align-top">
                        <ColumnHeader
                          title="Performance"
                          column="performance"
                          activeSortColumn={sortColumn}
                          activeSortDir={sortDir}
                          onSort={(dir) => setSort('performance', dir)}
                        />
                      </TableHead>
                      <TableHead className="w-[130px] text-right align-top">Details</TableHead>
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
                              {hasUrlResults && cols && (cols.dataAccess === 'partial' || cols.dataAccess === 'fail' || cols.performance === 'average' || cols.performance === 'poor') && (
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

const ColumnHeader: React.FC<{
  title: string;
  column: 'dataAccess' | 'performance';
  activeSortColumn: 'none' | 'dataAccess' | 'performance';
  activeSortDir: 'worst' | 'best';
  onSort: (dir: 'default' | 'worst' | 'best') => void;
}> = ({ title, column, activeSortColumn, activeSortDir, onSort }) => {
  const isSorted = activeSortColumn === column;

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex items-center gap-1">
        <span className="font-medium">{title}</span>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${isSorted ? 'text-primary' : 'text-muted-foreground'}`}
                  aria-label={`Sort by ${title}`}
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Sort by {title}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel className="text-xs">Sort {title}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSort('default')}>
              {!isSorted && <Check className="h-3.5 w-3.5 mr-2" />}
              <span className={isSorted ? 'ml-[22px]' : ''}>Default order</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort('worst')}>
              {isSorted && activeSortDir === 'worst' && <Check className="h-3.5 w-3.5 mr-2" />}
              <span className={!(isSorted && activeSortDir === 'worst') ? 'ml-[22px]' : ''}>Worst first</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort('best')}>
              {isSorted && activeSortDir === 'best' && <Check className="h-3.5 w-3.5 mr-2" />}
              <span className={!(isSorted && activeSortDir === 'best') ? 'ml-[22px]' : ''}>Best first</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
};

const SummaryChip: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  toneClass: string;
  count: number;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon: Icon, toneClass, count, label, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={active ? 'Click again to clear filter' : `Filter to ${label} only`}
      className={`w-full flex items-center gap-1.5 text-xs px-1.5 py-0.5 rounded transition-colors ${toneClass} ${
        active
          ? 'bg-primary/5 ring-1 ring-primary/40'
          : 'hover:bg-muted/60'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className={active ? 'font-semibold' : 'font-medium'}>{count}</span>
      <span>{label}</span>
    </button>
  );
};

export default CompleteLayersDialog;
