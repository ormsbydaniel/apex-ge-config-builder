import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, Download, RotateCcw, AlertTriangle, Edit, Check, Triangle, ChevronDown, Layers, Users, Lock, Server } from 'lucide-react';
import { useConfigImport, useConfigExport } from '@/hooks/useConfigIO';
import { useConfig } from '@/contexts/ConfigContext';
import { ValidationErrorDetails } from '@/types/config';
import ValidationErrorDetailsComponent from '../ValidationErrorDetails';
import ExportOptionsDialog, { ExportOptions } from '../ExportOptionsDialog';
import AttributionMissingDialog from './AttributionMissingDialog';
import { calculateQAStats } from '@/utils/qaUtils';
import { ConfigStatCard } from './components/ConfigStatCard';
import { QAStatCard } from './components/QAStatCard';

interface HomeTabProps {
  config: any;
}

const HomeTab = ({ config }: HomeTabProps) => {
  const { dispatch } = useConfig();
  const { handleFileSelect, importConfig } = useConfigImport();
  const { exportConfig } = useConfigExport();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAttributionDialog, setShowAttributionDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorDetails[]>([]);
  const [errorFileName, setErrorFileName] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(config.layout.navigation.title);
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [version, setVersion] = useState(config.version || '1.0.0');

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleNewConfig = () => {
    dispatch({ type: 'RESET_CONFIG' });
  };

  const handleQuickExport = () => {
    exportConfig({
      singleItemArrayToObject: false,
      configureCogsAsImages: false,
      removeEmptyCategories: false,
      includeCategoryValues: true,
      addNormalizeFalseToCogs: false,
      transformSwipeLayersToData: false,
      changeFormatToType: false
    });
  };

  const handleExportWithOptions = (options: ExportOptions) => {
    exportConfig(options);
  };

  const handleFileSelectWithErrorHandling = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const result = await importConfig(file);
      if (!result.success && result.errors) {
        setValidationErrors(result.errors);
        setErrorFileName(file.name);
        setShowErrorDialog(true);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Hero Action Buttons */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button 
                onClick={handleImportClick} 
                size="lg"
                className="h-14 text-base font-medium hover:scale-[1.02] transition-transform"
                disabled={config.isLoading}
              >
                <Upload className="h-5 w-5 mr-2" />
                Load Configuration
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="h-14 text-base font-medium hover:scale-[1.02] transition-transform"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
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
                size="lg"
                className="h-14 text-base font-medium hover:scale-[1.02] transition-transform"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                New Configuration
              </Button>
            </div>
            <Input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelectWithErrorHandling} className="hidden" />
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Project Info */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between group">
                  <label className="text-sm font-medium text-muted-foreground">Application Title</label>
                  {!isEditingTitle && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsEditingTitle(true)} 
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  <div className="text-xl font-semibold text-foreground p-3 rounded-lg bg-muted/30 border border-border/50">
                    {config.layout.navigation.title}
                  </div>
                )}
              </div>

              {/* Version */}
              <div className="space-y-2">
                <div className="flex items-center justify-between group">
                  <label className="text-sm font-medium text-muted-foreground">Version</label>
                  {!isEditingVersion && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsEditingVersion(true)} 
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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

              {/* Status Info */}
              {(config.lastSaved || config.isLoading) && (
                <div className="pt-4 border-t border-border/50 space-y-2">
                  {config.lastSaved && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Last saved: {config.lastSaved.toLocaleString()}</span>
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

          {/* Right Column: Statistics */}
          <div className="space-y-6">
            {/* Configuration Statistics */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Configuration Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <ConfigStatCard 
                    icon={Users} 
                    value={config.interfaceGroups.length} 
                    label="Interface Groups"
                    gradient="from-blue-500/10 to-blue-500/5"
                  />
                  <ConfigStatCard 
                    icon={Layers} 
                    value={config.sources.length} 
                    label="Layers"
                    gradient="from-purple-500/10 to-purple-500/5"
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
              </CardContent>
            </Card>

            {/* Quality Assurance Statistics */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Quality Assurance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
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
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ExportOptionsDialog open={showExportDialog} onOpenChange={setShowExportDialog} onExport={handleExportWithOptions} />

      <AttributionMissingDialog 
        open={showAttributionDialog}
        onOpenChange={setShowAttributionDialog}
        config={config}
        onUpdateLayers={handleAttributionUpdates}
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
    </>
  );
};

export default HomeTab;
