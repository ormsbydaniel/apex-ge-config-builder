
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';

const ConfigMetadataEditor = () => {
  const { config, dispatch } = useConfig();

  const handleLogoChange = (value: string) => {
    dispatch({
      type: 'UPDATE_LAYOUT',
      payload: { field: 'logo', value }
    });
  };

  const handleTitleChange = (value: string) => {
    dispatch({
      type: 'UPDATE_LAYOUT',
      payload: { field: 'title', value }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Application Settings
        </CardTitle>
        <CardDescription>
          Configure the basic appearance and branding of your application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="app-title">Application Title</Label>
          <Input
            id="app-title"
            value={config.layout.navigation.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter application title"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="app-logo">Logo URL</Label>
          <Input
            id="app-logo"
            value={config.layout.navigation.logo}
            onChange={(e) => handleLogoChange(e.target.value)}
            placeholder="Enter logo URL"
          />
        </div>

        {config.layout.navigation.logo && (
          <div className="space-y-2">
            <Label>Logo Preview</Label>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#2d5f72' }}>
              <img
                src={config.layout.navigation.logo}
                alt="Logo preview"
                className="h-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfigMetadataEditor;
