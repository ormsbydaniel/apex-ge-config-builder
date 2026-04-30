import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, Download, RotateCcw, AlertTriangle, Edit, Check, Triangle, ChevronDown, Layers, Users, Lock, Server, Map, FileText, Github, Sparkles, Link as LinkIcon, Zap, Stethoscope, CircleDot, XCircle, CircleDashed } from 'lucide-react';
import { deriveHealthcheckColumns, dataAccessLabel, performanceLabel, DataAccessStatus, PerformanceStatus } from '@/utils/healthcheckColumns';
import { useConfigImport, useConfigExport } from '@/hooks/useConfigIO';
import { useConfig } from '@/contexts/ConfigContext';
import { ValidationErrorDetails, LayerValidationResult } from '@/types/config';
import ValidationErrorDetailsComponent from '../ValidationErrorDetails';
import ExportOptionsDialog, { ExportOptions } from '../ExportOptionsDialog';
import LoadConfigDialog from './LoadConfigDialog';
import AttributionMissingDialog from './AttributionMissingDialog';
import CompleteLayersDialog from './CompleteLayersDialog';
import { calculateQAStats } from '@/utils/qaUtils';
import { ConfigStatCard } from './components/ConfigStatCard';
import { QAStatCard } from './components/QAStatCard';
import { LayerIssuesDialog } from './components/LayerIssuesDialog';
import LatestUpdatesSection from './components/LatestUpdatesSection';
import { DataSource } from '@/types/config';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

interface HomeTabProps {
  config: any;
}

const HomeTab = ({ config }: HomeTabProps) => {
  const { dispatch } = useConfig();
  const { handleFileSelect, importConfig, importConfigFromUrl } = useConfigImport();
  const { exportConfig } = useConfigExport();
  const { guardAction, isOpen: showUnsavedDialog, onConfirm: onUnsavedConfirm, onCancel: onUnsavedCancel } = useUnsavedChangesGuard();
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAttributionDialog, setShowAttributionDialog] = useState(false);
  const [showCompleteLayersDialog, setShowCompleteLayersDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorDetails[]>([]);
  const [showLayerIssuesDialog, setShowLayerIssuesDialog] = useState(false);
  const [layerIssuesTitle, setLayerIssuesTitle] = useState('');
  const [layerIssuesList, setLayerIssuesList] = useState<Array<{ source: DataSource; interfaceGroup: string; layerName: string }>>([]);
  
  // Get validation results from context
  const validationResults = config.validationResults;
  
  const handleValidationComplete = (results: Map<number, LayerValidationResult>) => {
    dispatch({
      type: 'UPDATE_VALIDATION_RESULTS',
      payload: results
    });
  };
  const [errorFileName, setErrorFileName] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(config.layout.navigation.title);
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [version, setVersion] = useState(config.version || '1.0.0');

  const handleImportClick = () => {
    guardAction(() => setShowLoadDialog(true));
  };

  const handleLoadDialogError = (errors: ValidationErrorDetails[], fileName: string) => {
    setValidationErrors(errors);
    setErrorFileName(fileName);
    setShowErrorDialog(true);
  };

  const handleNewConfig = () => {
    guardAction(() => dispatch({ type: 'RESET_CONFIG' }));
  };

  const handleQuickExport = () => {
    exportConfig({
      sortToMatchUiOrder: false
    });
  };

  const handleExportWithOptions = (options: ExportOptions) => {
    exportConfig(options);
  };


  const handleSaveTitle = () => {
    dispatch({
      type: 'UPDATE_LAYOUT',
      payload: { field: 'title', value: title }
    });
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setTitle(config.layout.navigation.title);
    setIsEditingTitle(false);
  };

  React.useEffect(() => {
    setTitle(config.layout.navigation.title);
  }, [config.layout.navigation.title]);

  React.useEffect(() => {
    setVersion(config.version || '1.0.0');
  }, [config.version]);

  const handleSaveVersion = () => {
    dispatch({
      type: 'UPDATE_VERSION',
      payload: version
    });
    setIsEditingVersion(false);
  };

  const handleCancelVersion = () => {
    setVersion(config.version || '1.0.0');
    setIsEditingVersion(false);
  };

  const handleAttributionUpdates = (updates: Array<{ index: number; attribution: { text: string; url?: string } }>) => {
    const updatedSources = [...config.sources];
    
    updates.forEach(update => {
      updatedSources[update.index] = {
        ...updatedSources[update.index],
        meta: {
          ...updatedSources[update.index].meta,
          attribution: update.attribution
        }
      };
    });

    dispatch({
      type: 'UPDATE_SOURCES',
      payload: updatedSources
    });
  };

  // Calculate QA statistics
  const qaStats = calculateQAStats(config.sources);

  // Helper function to get interface group name for a source
  const getInterfaceGroupName = (source: DataSource): string => {
    // Check if it's a base layer first
    if (source.isBaseLayer) {
      return 'Base Layer';
    }
    
    // Check layout.interfaceGroup (this is where it's actually stored)
    if (source.layout?.interfaceGroup) {
      return source.layout.interfaceGroup;
    }
    
    return 'Ungrouped';
  };

  // Helper function to extract layers with missing legend
  const getMissingLegendLayers = () => {
    const layers: Array<{ source: DataSource; interfaceGroup: string; layerName: string; index: number }> = [];
    
    config.sources.forEach((source: DataSource, index: number) => {
      // Exclude base layers
      if (source.isBaseLayer) {
        return;
      }
      
      const hasData = source.data && source.data.length > 0 && source.data.some(d => d.url);
      const hasStatistics = source.statistics && source.statistics.length > 0 && source.statistics.some(s => s.url);
      const hasAnyContent = hasData || hasStatistics;
      
      const hasLegend = source.layout?.layerCard?.legend?.url || 
                       source.layout?.infoPanel?.legend?.url ||
                       (source.meta?.categories && source.meta.categories.length > 0) ||
                       (source.meta?.startColor && source.meta?.endColor);
      
      if (hasAnyContent && !hasLegend) {
        layers.push({
          source,
          interfaceGroup: getInterfaceGroupName(source),
          layerName: source.name || 'Unnamed Layer',
          index
        });
      }
    });
    
    // Sort by interface group order, then by source index
    return layers.sort((a, b) => {
      const getGroupOrder = (group: string) => {
        if (group === 'Base Layer') return 1000; // Base layers after interface groups
        if (group === 'Ungrouped') return 2000; // Ungrouped comes last
        
        // Interface groups: use their position in config.interfaceGroups array
        const groupIndex = config.interfaceGroups?.indexOf(group);
        if (groupIndex !== undefined && groupIndex >= 0) {
          return groupIndex;
        }
        
        return 1500; // Unknown groups between base and ungrouped
      };
      
      const orderA = getGroupOrder(a.interfaceGroup);
      const orderB = getGroupOrder(b.interfaceGroup);
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Within same group, maintain source order by index
      return a.index - b.index;
    });
  };

  // Helper function to extract layers with no data/statistics
  const getNoDataLayers = () => {
    const layers: Array<{ source: DataSource; interfaceGroup: string; layerName: string; index: number }> = [];
    
    config.sources.forEach((source: DataSource, index: number) => {
      const hasData = source.data && source.data.length > 0 && source.data.some(d => d.url);
      const hasStatistics = source.statistics && source.statistics.length > 0 && source.statistics.some(s => s.url);
      const hasAnyContent = hasData || hasStatistics;
      
      if (!hasAnyContent) {
        layers.push({
          source,
          interfaceGroup: getInterfaceGroupName(source),
          layerName: source.name || 'Unnamed Layer',
          index
        });
      }
    });
    
    // Sort by interface group order, then by source index
    return layers.sort((a, b) => {
      const getGroupOrder = (group: string) => {
        if (group === 'Base Layer') return 1000; // Base layers after interface groups
        if (group === 'Ungrouped') return 2000; // Ungrouped comes last
        
        // Interface groups: use their position in config.interfaceGroups array
        const groupIndex = config.interfaceGroups?.indexOf(group);
        if (groupIndex !== undefined && groupIndex >= 0) {
          return groupIndex;
        }
        
        return 1500; // Unknown groups between base and ungrouped
      };
      
      const orderA = getGroupOrder(a.interfaceGroup);
      const orderB = getGroupOrder(b.interfaceGroup);
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Within same group, maintain source order by index
      return a.index - b.index;
    });
  };

  // Handler for missing legend card click
  const handleMissingLegendClick = () => {
    const layers = getMissingLegendLayers();
    setLayerIssuesTitle('Missing Legend');
    setLayerIssuesList(layers);
    setShowLayerIssuesDialog(true);
  };

  // Handler for no data/statistics card click
  const handleNoDataClick = () => {
    const layers = getNoDataLayers();
    setLayerIssuesTitle('No Data / Statistics');
    setLayerIssuesList(layers);
    setShowLayerIssuesDialog(true);
  };

  // Performance warning count + click handler — only meaningful after a validation run.
  const perfWarningCount = validationResults && validationResults.size > 0
    ? Array.from(validationResults.values()).filter((r: LayerValidationResult) => r.overallStatus === 'performance-warning').length
    : 0;

  const handlePerformanceClick = () => {
    if (!validationResults || validationResults.size === 0) return;
    const layers: Array<{ source: DataSource; interfaceGroup: string; layerName: string }> = [];
    config.sources.forEach((source: DataSource, index: number) => {
      const result = validationResults.get(index);
      if (result?.overallStatus === 'performance-warning') {
        layers.push({
          source,
          interfaceGroup: getInterfaceGroupName(source),
          layerName: source.name || 'Unnamed Layer',
        });
      }
    });
    setLayerIssuesTitle('Performance Warnings');
    setLayerIssuesList(layers);
    setShowLayerIssuesDialog(true);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Two Column Layout: Project 50%, Config QA 50% */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Project Card - 50% width */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl">Project</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleImportClick} 
                    variant="outline"
                    size="sm"
                    className="h-9 w-[130px] text-sm font-medium hover:scale-[1.01] transition-transform border-blue-500/50 text-blue-600 hover:bg-blue-500/10"
                    disabled={config.isLoading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Load
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9 w-[130px] text-sm font-medium hover:scale-[1.01] transition-transform border-green-500/50 text-green-600 hover:bg-green-500/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                        <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={handleQuickExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Quick Export (Default)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                        <Download className="h-4 w-4 mr-2" />
                        Export with Options...
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    onClick={handleNewConfig} 
                    variant="outline"
                    size="sm"
                    className="h-9 w-[130px] text-sm font-medium hover:scale-[1.01] transition-transform border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    New
                  </Button>

                </div>
              </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            {/* Title */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">Application Title</label>
                  {!isEditingTitle && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsEditingTitle(true)} 
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {isEditingTitle ? (
                  <div className="space-y-2">
                    <Input 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      placeholder="My Geospatial Explorer"
                      className="font-medium"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveTitle}>
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelTitle}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-lg font-semibold text-foreground p-3 rounded-lg bg-muted/50 border border-border/50">
                    {config.layout.navigation.title}
                  </div>
                )}
              </div>

              {/* Version */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  {!isEditingVersion && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsEditingVersion(true)} 
                      className="h-7 w-7 p-0"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {isEditingVersion ? (
                  <div className="space-y-2">
                    <Input 
                      value={version} 
                      onChange={e => setVersion(e.target.value)} 
                      placeholder="1.0.0"
                      className="font-mono"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveVersion}>
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelVersion}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Badge variant="secondary" className="text-sm font-mono px-3 py-1.5">
                    {config.version || '1.0.0'}
                  </Badge>
                )}
              </div>

              {/* Config Statistics - in one row */}
              <div className="pt-3 border-t border-border/50">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <ConfigStatCard 
                    icon={Users} 
                    value={config.interfaceGroups.length} 
                    label="Interface Groups"
                    gradient="from-blue-500/10 to-blue-500/5"
                  />
                  <ConfigStatCard 
                    icon={Layers} 
                    value={config.sources.filter((s: DataSource) => !s.isBaseLayer).length} 
                    label="Layers"
                    gradient="from-purple-500/10 to-purple-500/5"
                  />
                  <ConfigStatCard 
                    icon={Map} 
                    value={config.sources.filter((s: DataSource) => s.isBaseLayer).length} 
                    label="Base Layers"
                    gradient="from-cyan-500/10 to-cyan-500/5"
                  />
                  <ConfigStatCard 
                    icon={Lock} 
                    value={config.exclusivitySets.length} 
                    label="Exclusivity Sets"
                    gradient="from-amber-500/10 to-amber-500/5"
                  />
                  <ConfigStatCard 
                    icon={Server} 
                    value={config.services.length} 
                    label="Services"
                    gradient="from-green-500/10 to-green-500/5"
                  />
                </div>
              </div>

              {/* Status Info */}
              {(config.lastLoaded || config.lastExported || config.isLoading) && (
                <div className="pt-3 border-t border-border/50 space-y-2">
                  {config.lastLoaded && (
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span>Last loaded: {config.lastLoaded.toLocaleString()}</span>
                      </div>
                      {config.lastLoadedSource && (
                        <div
                          className="text-xs text-muted-foreground flex items-center gap-1.5 pl-4 min-w-0"
                          title={config.lastLoadedSource.label}
                        >
                          {config.lastLoadedSource.type === 'upload' && <Upload className="h-3 w-3 shrink-0" />}
                          {config.lastLoadedSource.type === 'example' && <Sparkles className="h-3 w-3 shrink-0" />}
                          {config.lastLoadedSource.type === 'github' && <Github className="h-3 w-3 shrink-0" />}
                          {config.lastLoadedSource.type === 'url' && <LinkIcon className="h-3 w-3 shrink-0" />}
                          <span className="font-medium capitalize">
                            {config.lastLoadedSource.type === 'github' ? 'GitHub' : config.lastLoadedSource.type}:
                          </span>
                          <span className="truncate font-mono">{config.lastLoadedSource.label}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {config.lastExported && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>Last exported: {config.lastExported.toLocaleString()}</span>
                    </div>
                  )}
                  {config.isLoading && (
                    <div className="text-sm text-blue-600 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      <span>Loading configuration...</span>
                    </div>
                  )}
                </div>
              )}
          </CardContent>
        </Card>

          {/* Config QA - 50% width */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Config Quality Assurance</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-4">
              <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                Config file metrics
              </h3>
              {/* QA Stats in one row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <QAStatCard
                  icon={Check}
                  value={qaStats.success}
                  label="Complete Layers"
                  colorClass="text-green-600"
                  bgGradient="from-green-500/20 to-green-500/5"
                />
                <QAStatCard
                  icon={Triangle}
                  value={qaStats.info}
                  label="Missing Legend"
                  colorClass="text-blue-600"
                  bgGradient="from-blue-500/20 to-blue-500/5"
                  onClick={handleMissingLegendClick}
                />
                <QAStatCard
                  icon={AlertTriangle}
                  value={qaStats.warning}
                  label="Missing Attribution"
                  colorClass="text-amber-600"
                  bgGradient="from-amber-500/20 to-amber-500/5"
                  onClick={() => setShowAttributionDialog(true)}
                />
                <QAStatCard
                  icon={Triangle}
                  value={qaStats.error}
                  label="No Data/Statistics"
                  colorClass="text-red-600"
                  bgGradient="from-red-500/20 to-red-500/5"
                  onClick={handleNoDataClick}
                />
                <QAStatCard
                  icon={Zap}
                  value={validationResults && validationResults.size > 0 ? perfWarningCount : null}
                  label="Performance Warning"
                  colorClass="text-amber-600"
                  bgGradient="from-amber-500/20 to-amber-500/5"
                  onClick={validationResults && validationResults.size > 0 ? handlePerformanceClick : undefined}
                  disabled={!validationResults || validationResults.size === 0}
                  tooltip={
                    !validationResults || validationResults.size === 0
                      ? 'Run Healthcheck to check performance'
                      : 'Layers with data sources that load but exceed size thresholds'
                  }
                />
              </div>

              {/* Healthcheck section */}
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                  Healthcheck
                </h3>
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left column: icon, description, run button */}
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Stethoscope className="h-6 w-6" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Full health check of all layers for validity and performance.
                      </p>
                      <Button
                        onClick={() => setShowCompleteLayersDialog(true)}
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        <Stethoscope className="h-4 w-4 mr-2" />
                        {validationResults.size > 0 ? 'Re-run Healthcheck' : 'Run Healthcheck'}
                      </Button>
                    </div>

                    {/* Right column: Last run nested card */}
                    {(() => {
                      if (validationResults.size === 0) {
                        return (
                          <Card className="h-full border-border/50 bg-background/40">
                            <CardContent className="h-full flex items-center justify-center p-4">
                              <p className="text-xs italic text-muted-foreground/70">
                                Not run yet.
                              </p>
                            </CardContent>
                          </Card>
                        );
                      }

                      const results = Array.from(validationResults.values()) as LayerValidationResult[];
                      const dataCounts: Record<DataAccessStatus, number> = { pass: 0, partial: 0, fail: 0, na: 0 };
                      const perfCounts: Record<PerformanceStatus, number> = { good: 0, average: 0, poor: 0, na: 0 };
                      let latest: Date | undefined;
                      results.forEach(r => {
                        const cols = deriveHealthcheckColumns(r);
                        dataCounts[cols.dataAccess]++;
                        perfCounts[cols.performance]++;
                        if (r.checkedAt && (!latest || r.checkedAt > latest)) latest = r.checkedAt;
                      });

                      const dataRows: Array<{ key: DataAccessStatus; icon: typeof Check; color: string }> = [
                        { key: 'pass', icon: Check, color: 'text-green-600' },
                        { key: 'partial', icon: CircleDashed, color: 'text-amber-600' },
                        { key: 'fail', icon: XCircle, color: 'text-red-600' },
                      ];
                      const perfRows: Array<{ key: PerformanceStatus; icon: typeof CircleDot; color: string }> = [
                        { key: 'good', icon: CircleDot, color: 'text-green-600' },
                        { key: 'average', icon: CircleDashed, color: 'text-amber-600' },
                        { key: 'poor', icon: XCircle, color: 'text-red-600' },
                      ];

                      return (
                        <Card
                          onClick={() => setShowCompleteLayersDialog(true)}
                          className="h-full border-border/50 bg-background/60 cursor-pointer hover:bg-background hover:border-border transition-colors"
                        >
                          <CardContent className="p-3 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                                Last run
                              </div>
                              {latest && (
                                <div className="text-[11px] text-muted-foreground">
                                  {latest.toLocaleString()}
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <div className="text-xs font-semibold text-foreground/80">Data Access</div>
                                {dataRows.map(({ key, icon: Icon, color }) => (
                                  <div key={key} className={`flex items-center gap-1.5 text-xs ${color}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                    <span className="font-medium">{dataCounts[key]}</span>
                                    <span>{dataAccessLabel[key]}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-1.5">
                                <div className="text-xs font-semibold text-foreground/80">Performance</div>
                                {perfRows.map(({ key, icon: Icon, color }) => (
                                  <div key={key} className={`flex items-center gap-1.5 text-xs ${color}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                    <span className="font-medium">{perfCounts[key]}</span>
                                    <span>{performanceLabel[key]}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* What's New Section */}
      <div className="mt-6">
        <LatestUpdatesSection />
      </div>

      <LoadConfigDialog open={showLoadDialog} onOpenChange={setShowLoadDialog} onError={handleLoadDialogError} />

      <ExportOptionsDialog open={showExportDialog} onOpenChange={setShowExportDialog} onExport={handleExportWithOptions} />

      <AttributionMissingDialog 
        open={showAttributionDialog}
        onOpenChange={setShowAttributionDialog}
        config={config}
        onUpdateLayers={handleAttributionUpdates}
      />

      <CompleteLayersDialog 
        open={showCompleteLayersDialog}
        onOpenChange={setShowCompleteLayersDialog}
        config={config}
        onValidationComplete={handleValidationComplete}
        existingResults={validationResults}
      />

      <LayerIssuesDialog
        open={showLayerIssuesDialog}
        onOpenChange={setShowLayerIssuesDialog}
        title={layerIssuesTitle}
        layers={layerIssuesList}
      />

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Configuration Validation Errors
            </DialogTitle>
            <DialogDescription>
              The configuration file contains errors that prevent it from being loaded. Review the details below to understand what needs to be fixed.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ValidationErrorDetailsComponent errors={validationErrors} fileName={errorFileName} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showUnsavedDialog} onOpenChange={(open) => { if (!open) onUnsavedCancel(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Your recent changes have not been exported and will be overwritten. Do you wish to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onUnsavedCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onUnsavedConfirm}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HomeTab;
