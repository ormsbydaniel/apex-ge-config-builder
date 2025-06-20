
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Download } from 'lucide-react';
import { useConfigImport } from '@/hooks/useConfigImport';
import { useConfigExport } from '@/hooks/useConfigExport';

const ConfigFileManager = () => {
  const { importConfig, isImporting } = useConfigImport();
  const { exportConfig } = useConfigExport();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importConfig(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Configuration File Management
        </CardTitle>
        <CardDescription>
          Import existing configurations or export your current setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="config-upload" className="block text-sm font-medium mb-2">
            Import Configuration
          </label>
          <Input
            id="config-upload"
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            disabled={isImporting}
            className="cursor-pointer"
          />
          {isImporting && (
            <p className="text-sm text-muted-foreground mt-1">
              Importing configuration...
            </p>
          )}
        </div>
        
        <div>
          <Button onClick={() => exportConfig()} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigFileManager;
