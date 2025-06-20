
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Download, RotateCcw, AlertTriangle, Edit, Settings, Home } from 'lucide-react';
import { useConfigImport, useConfigExport } from '@/hooks/useConfigIO';
import { useConfig } from '@/contexts/ConfigContext';
import { ValidationErrorDetails } from '@/types/config';
import ValidationErrorDetailsComponent from '../ValidationErrorDetails';
import ExportOptionsDialog, { ExportOptions } from '../ExportOptionsDialog';

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
  const [validationErrors, setValidationErrors] = useState<ValidationErrorDetails[]>([]);
  const [errorFileName, setErrorFileName] = useState<string>('');
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [logoUrl, setLogoUrl] = useState(config.layout.navigation.logo);
  const [title, setTitle] = useState(config.layout.navigation.title);

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
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveLogo = () => {
    dispatch({
      type: 'UPDATE_LAYOUT',
      payload: {
        field: 'logo',
        value: logoUrl
      }
    });
    setIsEditingLogo(false);
  };

  const handleCancelLogo = () => {
    setLogoUrl(config.layout.navigation.logo);
    setIsEditingLogo(false);
  };

  const handleSaveTitle = () => {
    dispatch({
      type: 'UPDATE_LAYOUT',
      payload: {
        field: 'title',
        value: title
      }
    });
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setTitle(config.layout.navigation.title);
    setIsEditingTitle(false);
  };

  // Update local state when config changes
  React.useEffect(() => {
    setLogoUrl(config.layout.navigation.logo);
    setTitle(config.layout.navigation.title);
  }, [config.layout.navigation.logo, config.layout.navigation.title]);

  return (
    <>
      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Home className="h-5 w-5" />
              Configuration Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button onClick={handleImportClick} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" disabled={config.isLoading}>
                <Upload className="h-4 w-4 mr-2" />
                Load Config
              </Button>
              
              <Button onClick={handleQuickExport} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                <Download className="h-4 w-4 mr-2" />
                Quick Export
              </Button>
              
              <Button onClick={() => setShowExportDialog(true)} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                <Settings className="h-4 w-4 mr-2" />
                Export Options
              </Button>

              <Button onClick={handleNewConfig} variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                <RotateCcw className="h-4 w-4 mr-2" />
                New Config
              </Button>
            </div>

            <Input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelectWithErrorHandling} className="hidden" />

            <Separator />

            {/* Logo Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Application Branding</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Logo:</span>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingLogo(true)} className="h-6 w-6 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                  {isEditingLogo ? (
                    <div className="space-y-2">
                      <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.svg" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveLogo}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelLogo}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center border rounded-lg p-4 bg-gray-50 min-h-[80px]">
                      {config.layout.navigation.logo ? (
                        <img src={config.layout.navigation.logo} alt="Logo" className="max-h-16 max-w-full object-contain" onError={e => {
                          e.currentTarget.style.display = 'none';
                        }} />
                      ) : (
                        <div className="text-sm text-slate-500 italic flex items-center">No logo set</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Title:</span>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(true)} className="h-6 w-6 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                  {isEditingTitle ? (
                    <div className="space-y-2">
                      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Geospatial Explorer" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveTitle}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelTitle}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center border rounded-lg p-4 bg-gray-50 min-h-[80px]">
                      <span className="text-lg font-medium">{config.layout.navigation.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Configuration Statistics */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Configuration Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{config.interfaceGroups.length}</div>
                  <div className="text-sm text-slate-600">Interface Groups</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{config.exclusivitySets.length}</div>
                  <div className="text-sm text-slate-600">Exclusivity Sets</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{config.services.length}</div>
                  <div className="text-sm text-slate-600">Services</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{config.sources.length}</div>
                  <div className="text-sm text-slate-600">Layers</div>
                </div>
              </div>
            </div>
            
            {config.lastSaved && (
              <>
                <Separator />
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Last saved: </span> 
                  {config.lastSaved.toLocaleString()}
                </div>
              </>
            )}
            
            {config.isLoading && (
              <>
                <Separator />
                <div className="text-sm text-blue-600">
                  Loading configuration...
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ExportOptionsDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExportWithOptions}
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
