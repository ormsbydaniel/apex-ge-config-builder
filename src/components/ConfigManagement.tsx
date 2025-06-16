import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Download, RotateCcw, FileText, AlertTriangle, Settings } from 'lucide-react';
import { useConfigImport, useConfigExport } from '@/hooks/useConfigIO';
import { useConfig } from '@/contexts/ConfigContext';
import { ValidationErrorDetails } from '@/types/config';
import ValidationErrorDetailsComponent from './ValidationErrorDetails';
import ExportOptionsDialog, { ExportOptions } from './ExportOptionsDialog';

const ConfigManagement = () => {
  const { config, dispatch } = useConfig();
  const { importConfig } = useConfigImport();
  const { exportConfig } = useConfigExport();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorDetails[]>([]);
  const [jsonError, setJsonError] = useState<any>(null);
  const [errorFileName, setErrorFileName] = useState<string>('');

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleNewConfig = () => {
    dispatch({ type: 'RESET_CONFIG' });
  };

  const handleExportWithOptions = (options: ExportOptions) => {
    exportConfig(options);
  };

  const handleQuickExport = () => {
    exportConfig({ 
      singleItemArrayToObject: false, 
      configureCogsAsImages: false, 
      removeEmptyCategories: false,
      includeCategoryValues: true,
      addNormalizeFalseToCogs: false
    });
  };

  const handleFileSelectWithErrorHandling = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const result = await importConfig(file);
      if (!result.success) {
        setValidationErrors(result.errors || []);
        setJsonError(result.jsonError || null);
        setErrorFileName(file.name);
        setShowErrorDialog(true);
      }
    }
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configuration Management
          </CardTitle>
          <CardDescription>
            Load existing configurations or create new ones. Export your current configuration for backup or sharing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Button
              onClick={handleImportClick}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
              disabled={config.isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Load Configuration
            </Button>
            
            <Button
              onClick={handleQuickExport}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Quick Export
            </Button>

            <Button
              onClick={() => setShowExportDialog(true)}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Export Options
            </Button>
            
            <Button
              onClick={handleNewConfig}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              New Configuration
            </Button>
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelectWithErrorHandling}
            className="hidden"
          />

          {config.lastSaved && (
            <div className="text-sm text-slate-600 pt-2 border-t">
              <span className="font-medium">Last saved:</span> {config.lastSaved.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

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
            <ValidationErrorDetailsComponent 
              errors={validationErrors}
              fileName={errorFileName}
              jsonError={jsonError}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConfigManagement;
