import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Download, RotateCcw, AlertTriangle, Edit } from 'lucide-react';
import { useConfigImport, useConfigExport } from '@/hooks/useConfigIO';
import { useConfig } from '@/contexts/ConfigContext';
import { ValidationErrorDetails } from '@/types/config';
import ValidationErrorDetailsComponent from '../ValidationErrorDetails';
interface ConfigSummaryProps {
  config: any;
}
const ConfigSummary = ({
  config
}: ConfigSummaryProps) => {
  const {
    dispatch
  } = useConfig();
  const {
    handleFileSelect,
    importConfig
  } = useConfigImport();
  const {
    exportConfig
  } = useConfigExport();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
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
    dispatch({
      type: 'RESET_CONFIG'
    });
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
  return <>
      <Card className="sticky top-8 border-primary/20 bg-[o#2D5F72] bg-[#2d5f72]">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-slate-50">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-1">
            <Button onClick={handleImportClick} variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs px-2" disabled={config.isLoading}>
              <Upload className="h-3 w-3 mr-1" />
              Load
            </Button>
            
            <Button onClick={exportConfig} variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50 text-xs px-2">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            
            <Button onClick={handleNewConfig} variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-50 text-xs px-2">
              <RotateCcw className="h-3 w-3 mr-1" />
              New
            </Button>
          </div>

          <Input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelectWithErrorHandling} className="hidden" />

          
          
          {/* Logo Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-50">Logo:</span>
              <Button size="sm" variant="ghost" onClick={() => setIsEditingLogo(true)} className="h-6 w-6 p-0 bg-slate-50">
                <Edit className="h-3 w-3" />
              </Button>
            </div>
            {isEditingLogo ? <div className="space-y-2">
                <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.svg" className="text-xs" />
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleSaveLogo} className="text-xs">
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelLogo} className="text-xs">
                    Cancel
                  </Button>
                </div>
              </div> : <div className="flex justify-center">
                {config.layout.navigation.logo ? <img src={config.layout.navigation.logo} alt="Logo" className="max-h-12 max-w-full object-contain" onError={e => {
              e.currentTarget.style.display = 'none';
            }} /> : <div className="text-xs text-slate-500 italic">No logo set</div>}
              </div>}
          </div>

          
          
          <div className="space-y-2 text-sm">
            {/* Title Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-50 font-bold">Title:</span>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(true)} className="h-6 w-6 p-0 bg-slate-50">
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
              {isEditingTitle ? <div className="space-y-2">
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Geospatial Explorer" className="text-xs" />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={handleSaveTitle} className="text-xs">
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelTitle} className="text-xs">
                      Cancel
                    </Button>
                  </div>
                </div> : <span className="text-slate-50 font-bold">{config.layout.navigation.title}</span>}
            </div>

            <Separator className="my-3" />

            <div>
              <span className="font-medium text-slate-50">Interface Groups: </span>
              <span className="text-slate-50">{config.interfaceGroups.length} groups</span>
            </div>
            <div>
              <span className="font-medium text-slate-50">Exclusivity Sets: </span>
              <span className="text-slate-50">{config.exclusivitySets.length} sets</span>
            </div>
            <div>
              <span className="font-medium text-slate-50">Services: </span>
              <span className="text-slate-50">{config.services.length} services</span>
            </div>
            <div>
              <span className="font-medium text-slate-50">Layers: </span>
              <span className="text-slate-50">{config.sources.length} layers</span>
            </div>
          </div>
          
          {config.lastSaved && <>
              <Separator />
              <div className="text-xs text-slate-50">
                <span className="font-medium">Last saved: </span>
                {config.lastSaved.toLocaleString()}
              </div>
            </>}
          
          {config.isLoading && <>
              <Separator />
              <div className="text-sm text-blue-600">
                Loading configuration...
              </div>
            </>}
        </CardContent>
      </Card>

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
    </>;
};
export default ConfigSummary;