import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfig } from '@/contexts/ConfigContext';
import { Settings, MapPin, ZoomIn, Edit } from 'lucide-react';

interface SettingsTabProps {
  config: any;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ config }) => {
  const { dispatch } = useConfig();
  
  // Local state for input values to allow free typing
  const currentCenter = config.mapConstraints?.center || [0, 0];
  const [latitudeInput, setLatitudeInput] = useState(currentCenter[1].toFixed(6));
  const [longitudeInput, setLongitudeInput] = useState(currentCenter[0].toFixed(6));
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState(config.layout.navigation.logo);
  
  // Theme colors state
  const [primaryColor, setPrimaryColor] = useState(config.layout.theme?.primaryColor || '#003247');
  const [secondaryColor, setSecondaryColor] = useState(config.layout.theme?.secondaryColor || '#f3f7f8');
  const [tertiaryColor, setTertiaryColor] = useState(config.layout.theme?.tertiaryColor || '#335e6f');
  const [primaryFontColor, setPrimaryFontColor] = useState(config.layout.theme?.primaryFontColor || '#ffffff');
  const [secondaryFontColor, setSecondaryFontColor] = useState(config.layout.theme?.secondaryFontColor || '#333333');
  
  // Update local state when config changes
  useEffect(() => {
    const center = config.mapConstraints?.center || [0, 0];
    setLatitudeInput(center[1].toFixed(6));
    setLongitudeInput(center[0].toFixed(6));
  }, [config.mapConstraints?.center]);

  useEffect(() => {
    setLogoUrl(config.layout.navigation.logo);
  }, [config.layout.navigation.logo]);

  useEffect(() => {
    if (config.layout.theme) {
      setPrimaryColor(config.layout.theme.primaryColor || '#003247');
      setSecondaryColor(config.layout.theme.secondaryColor || '#f3f7f8');
      setTertiaryColor(config.layout.theme.tertiaryColor || '#335e6f');
      setPrimaryFontColor(config.layout.theme.primaryFontColor || '#ffffff');
      setSecondaryFontColor(config.layout.theme.secondaryFontColor || '#333333');
    }
  }, [config.layout.theme]);

  const validateAndUpdateLatitude = (value: string) => {
    const latitude = parseFloat(value);
    if (!isNaN(latitude) && latitude >= -90 && latitude <= 90) {
      const currentCenter = config.mapConstraints?.center || [0, 0];
      dispatch({
        type: 'UPDATE_MAP_CONSTRAINTS',
        payload: { center: [currentCenter[0], latitude] }
      });
    }
  };

  const validateAndUpdateLongitude = (value: string) => {
    const longitude = parseFloat(value);
    if (!isNaN(longitude) && longitude >= -180 && longitude <= 180) {
      const currentCenter = config.mapConstraints?.center || [0, 0];
      dispatch({
        type: 'UPDATE_MAP_CONSTRAINTS',
        payload: { center: [longitude, currentCenter[1]] }
      });
    }
  };

  const handleLatitudeBlur = () => {
    validateAndUpdateLatitude(latitudeInput);
  };

  const handleLongitudeBlur = () => {
    validateAndUpdateLongitude(longitudeInput);
  };

  const handleLatitudeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndUpdateLatitude(latitudeInput);
    }
  };

  const handleLongitudeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndUpdateLongitude(longitudeInput);
    }
  };

  const isValidLatitude = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= -90 && num <= 90;
  };

  const isValidLongitude = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= -180 && num <= 180;
  };

  const handleZoomChange = (value: number[]) => {
    dispatch({
      type: 'UPDATE_MAP_CONSTRAINTS',
      payload: { zoom: value[0] }
    });
  };

  const handleSaveLogo = () => {
    dispatch({
      type: 'UPDATE_LAYOUT',
      payload: { field: 'logo', value: logoUrl }
    });
    setIsEditingLogo(false);
  };

  const handleCancelLogo = () => {
    setLogoUrl(config.layout.navigation.logo);
    setIsEditingLogo(false);
  };

  const handleColorChange = (field: string, value: string) => {
    dispatch({
      type: 'UPDATE_THEME',
      payload: { field, value }
    });
  };

  const handleResetColors = () => {
    const defaults = {
      primaryColor: '#003247',
      secondaryColor: '#f3f7f8',
      tertiaryColor: '#335e6f',
      primaryFontColor: '#ffffff',
      secondaryFontColor: '#333333'
    };
    
    setPrimaryColor(defaults.primaryColor);
    setSecondaryColor(defaults.secondaryColor);
    setTertiaryColor(defaults.tertiaryColor);
    setPrimaryFontColor(defaults.primaryFontColor);
    setSecondaryFontColor(defaults.secondaryFontColor);
    
    Object.entries(defaults).forEach(([field, value]) => {
      dispatch({
        type: 'UPDATE_THEME',
        payload: { field, value }
      });
    });
  };

  const handleResetPrimary = () => {
    const defaults = { primaryColor: '#003247', primaryFontColor: '#ffffff' };
    setPrimaryColor(defaults.primaryColor);
    setPrimaryFontColor(defaults.primaryFontColor);
    dispatch({ type: 'UPDATE_THEME', payload: { field: 'primaryColor', value: defaults.primaryColor } });
    dispatch({ type: 'UPDATE_THEME', payload: { field: 'primaryFontColor', value: defaults.primaryFontColor } });
  };

  const handleResetSecondary = () => {
    const defaults = { secondaryColor: '#f3f7f8', secondaryFontColor: '#333333' };
    setSecondaryColor(defaults.secondaryColor);
    setSecondaryFontColor(defaults.secondaryFontColor);
    dispatch({ type: 'UPDATE_THEME', payload: { field: 'secondaryColor', value: defaults.secondaryColor } });
    dispatch({ type: 'UPDATE_THEME', payload: { field: 'secondaryFontColor', value: defaults.secondaryFontColor } });
  };

  const handleResetTertiary = () => {
    const defaults = { tertiaryColor: '#335e6f' };
    setTertiaryColor(defaults.tertiaryColor);
    dispatch({ type: 'UPDATE_THEME', payload: { field: 'tertiaryColor', value: defaults.tertiaryColor } });
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Navigation Settings Subsection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Navigation Settings</h3>
            
            {/* Map Centre */}
            <div className="flex items-start gap-6">
              <div className="flex items-center gap-2 pt-8 w-[180px]">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <Label className="text-base font-medium whitespace-nowrap">Map centre at start</Label>
              </div>
              <div className="flex-1">
                <div className="px-2">
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-sm">Latitude</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              id="latitude"
                              type="text"
                              value={latitudeInput}
                              onChange={(e) => setLatitudeInput(e.target.value)}
                              onBlur={handleLatitudeBlur}
                              onKeyPress={handleLatitudeKeyPress}
                              placeholder="0"
                              className={`w-[140px] ${!isValidLatitude(latitudeInput) ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                          </TooltipTrigger>
                          {!isValidLatitude(latitudeInput) && (
                            <TooltipContent>
                              <p>Please enter a valid latitude between -90 and 90</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-sm">Longitude</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              id="longitude"
                              type="text"
                              value={longitudeInput}
                              onChange={(e) => setLongitudeInput(e.target.value)}
                              onBlur={handleLongitudeBlur}
                              onKeyPress={handleLongitudeKeyPress}
                              placeholder="0"
                              className={`w-[140px] ${!isValidLongitude(longitudeInput) ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                          </TooltipTrigger>
                          {!isValidLongitude(longitudeInput) && (
                            <TooltipContent>
                              <p>Please enter a valid longitude between -180 and 180</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zoom at Start */}
            <div className="flex items-start gap-6">
              <div className="space-y-2 w-[180px]">
                <div className="flex items-center gap-2">
                  <ZoomIn className="h-5 w-5 text-muted-foreground" />
                  <Label className="text-base font-medium whitespace-nowrap">Zoom at start</Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded inline-block w-[140px]">
                        {getZoomTooltip(currentZoom)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Current zoom level: {currentZoom}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex-1 space-y-4 pt-2">
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
            </div>
          </div>

          {/* Branding Settings Subsection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Branding Settings</h3>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
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
                <div className="w-[20%]">
                  <div 
                    className="flex justify-center border rounded-lg p-4 min-h-[80px]" 
                    style={{ backgroundColor: primaryColor }}
                  >
                    {config.layout.navigation.logo ? (
                      <img src={config.layout.navigation.logo} alt="Logo" className="max-h-16 max-w-full object-contain" onError={e => {
                        e.currentTarget.style.display = 'none';
                      }} />
                    ) : (
                      <div className="text-sm text-slate-500 italic flex items-center">No logo set</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Colour Scheme */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Colour Scheme</h3>
              </div>
              
              <div className="grid gap-4" style={{ gridTemplateColumns: 'auto auto auto auto auto' }}>
                {/* Colours */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Colours</h4>
                  
                  <div className="space-y-2">
                    <div className="h-10 flex items-center">
                      <Label className="font-medium whitespace-nowrap italic">Primary (title & menu 1)</Label>
                    </div>
                    <div className="h-10 flex items-center">
                      <Label className="font-medium whitespace-nowrap italic">Secondary (menu 2)</Label>
                    </div>
                    <div className="h-10 flex items-center">
                      <Label className="font-medium whitespace-nowrap italic">Tertiary (panel)</Label>
                    </div>
                  </div>
                </div>

                {/* Background */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Background</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          handleColorChange('primaryColor', e.target.value);
                        }}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => {
                          setPrimaryColor(e.target.value);
                          handleColorChange('primaryColor', e.target.value);
                        }}
                        className="w-24 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => {
                          setSecondaryColor(e.target.value);
                          handleColorChange('secondaryColor', e.target.value);
                        }}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => {
                          setSecondaryColor(e.target.value);
                          handleColorChange('secondaryColor', e.target.value);
                        }}
                        className="w-24 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        id="tertiaryColor"
                        type="color"
                        value={tertiaryColor}
                        onChange={(e) => {
                          setTertiaryColor(e.target.value);
                          handleColorChange('tertiaryColor', e.target.value);
                        }}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={tertiaryColor}
                        onChange={(e) => {
                          setTertiaryColor(e.target.value);
                          handleColorChange('tertiaryColor', e.target.value);
                        }}
                        className="w-24 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Font */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Font</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="primaryFontColor"
                        type="color"
                        value={primaryFontColor}
                        onChange={(e) => {
                          setPrimaryFontColor(e.target.value);
                          handleColorChange('primaryFontColor', e.target.value);
                        }}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={primaryFontColor}
                        onChange={(e) => {
                          setPrimaryFontColor(e.target.value);
                          handleColorChange('primaryFontColor', e.target.value);
                        }}
                        className="w-24 text-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        id="secondaryFontColor"
                        type="color"
                        value={secondaryFontColor}
                        onChange={(e) => {
                          setSecondaryFontColor(e.target.value);
                          handleColorChange('secondaryFontColor', e.target.value);
                        }}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={secondaryFontColor}
                        onChange={(e) => {
                          setSecondaryFontColor(e.target.value);
                          handleColorChange('secondaryFontColor', e.target.value);
                        }}
                        className="w-24 text-sm"
                      />
                    </div>

                    <div className="h-10"></div>
                  </div>
                </div>

                {/* Previews */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Previews</h4>
                  
                  <div className="space-y-2">
                    <div className="h-10 flex items-center">
                      <div 
                        className="flex items-center justify-center px-4 py-2 rounded border font-medium w-full"
                        style={{ 
                          color: primaryFontColor, 
                          backgroundColor: primaryColor 
                        }}
                      >
                        Lorem ipsum ...
                      </div>
                    </div>

                    <div className="h-10 flex items-center">
                      <div 
                        className="flex items-center justify-center px-4 py-2 rounded border font-medium w-full"
                        style={{ 
                          color: secondaryFontColor, 
                          backgroundColor: secondaryColor 
                        }}
                      >
                        Lorem ipsum ...
                      </div>
                    </div>

                    <div className="h-10 flex items-center">
                      <div 
                        className="flex items-center justify-center rounded border w-full h-full"
                        style={{ 
                          backgroundColor: tertiaryColor 
                        }}
                      >
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reset Buttons */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Reset</h4>
                  
                  <div className="space-y-2">
                    <div className="h-10 flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetPrimary}
                        className="w-full"
                      >
                        Reset to default
                      </Button>
                    </div>

                    <div className="h-10 flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetSecondary}
                        className="w-full"
                      >
                        Reset to default
                      </Button>
                    </div>

                    <div className="h-10 flex items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetTertiary}
                        className="w-full"
                      >
                        Reset to default
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset All Button */}
              <div className="flex justify-end mt-4">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleResetColors}
                >
                  Reset all
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;