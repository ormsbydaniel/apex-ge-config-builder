
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Layers, Clock } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';

const ConfigStats = () => {
  const { config } = useConfig();

  const layerCount = config.sources.length;
  const serviceCount = config.services.length;
  const interfaceGroupCount = config.interfaceGroups.length;

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Configuration Overview
        </CardTitle>
        <CardDescription>
          Current statistics and information about your configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Layers</span>
            </div>
            <Badge variant="secondary">{layerCount}</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Services</span>
            </div>
            <Badge variant="secondary">{serviceCount}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Interface Groups:</span>
            <Badge variant="outline">{interfaceGroupCount}</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Last saved: {formatLastSaved(config.lastSaved)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Configuration Version: {config.version}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigStats;
