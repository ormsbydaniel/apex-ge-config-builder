import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfig } from '@/contexts/ConfigContext';

interface SettingsTabProps {
  config: any;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ config }) => {
  const { dispatch } = useConfig();

  const handleLatitudeChange = (value: string) => {
    // Allow only numeric input with optional decimal and sign
    const numericRegex = /^-?\d*\.?\d*$/;
    if (!numericRegex.test(value)) return;
    
    const latitude = parseFloat(value);
    if (!isNaN(latitude) && latitude >= -90 && latitude <= 90) {
      const currentCenter = config.mapConstraints?.center || [0, 0];
      dispatch({
        type: 'UPDATE_MAP_CONSTRAINTS',
        payload: { center: [currentCenter[0], latitude] }
      });
    }
  };

  const handleLongitudeChange = (value: string) => {
    // Allow only numeric input with optional decimal and sign
    const numericRegex = /^-?\d*\.?\d*$/;
    if (!numericRegex.test(value)) return;
    
    const longitude = parseFloat(value);
    if (!isNaN(longitude) && longitude >= -180 && longitude <= 180) {
      const currentCenter = config.mapConstraints?.center || [0, 0];
      dispatch({
        type: 'UPDATE_MAP_CONSTRAINTS',
        payload: { center: [longitude, currentCenter[1]] }
      });
    }
  };

  const handleZoomChange = (value: number[]) => {
    dispatch({
      type: 'UPDATE_MAP_CONSTRAINTS',
      payload: { zoom: value[0] }
    });
  };

  const getZoomTooltip = (zoom: number): string => {
    let label = '';
    if (zoom <= 1) label = ' (Global)';
    else if (zoom >= 3 && zoom <= 5) label = ' (Continent)';
    else if (zoom >= 10 && zoom <= 13) label = ' (City)';
    else if (zoom >= 14 && zoom <= 17) label = ' (Street)';
    else if (zoom === 18) label = ' (Buildings)';
    
    return `Zoom ${zoom}${label}`;
  };

  const currentZoom = config.mapConstraints?.zoom || 0;
  const currentCenter = config.mapConstraints?.center || [0, 0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Navigation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Map Centre */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Map Centre</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-sm">Latitude</Label>
                <Input
                  id="latitude"
                  type="text"
                  value={currentCenter[1].toFixed(6)}
                  onChange={(e) => handleLatitudeChange(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-sm">Longitude</Label>
                <Input
                  id="longitude"
                  type="text"
                  value={currentCenter[0].toFixed(6)}
                  onChange={(e) => handleLongitudeChange(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Zoom at Start */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Zoom at Start</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                      {getZoomTooltip(currentZoom)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Current zoom level: {currentZoom}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="px-2">
              <Slider
                value={[currentZoom]}
                onValueChange={handleZoomChange}
                max={28}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0</span>
                <span>14</span>
                <span>28</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;