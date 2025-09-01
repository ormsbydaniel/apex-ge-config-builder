import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Globe, FileText, MapPin } from 'lucide-react';
import { DataSourceFormat } from '@/types/config';

interface FormatSelectionCardsProps {
  onFormatSelect: (format: DataSourceFormat) => void;
  onCancel: () => void;
}

const formatConfigs = [
  {
    format: 'geojson' as DataSourceFormat,
    title: 'GeoJSON',
    description: 'Vector data in JSON format',
    icon: FileText,
    color: 'text-blue-600',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    format: 'flatgeobuf' as DataSourceFormat,
    title: 'FlatGeobuf',
    description: 'Optimized binary vector format',
    icon: Database,
    color: 'text-green-600',
    borderColor: 'border-l-green-500',
    bgColor: 'bg-green-50',
  },
  {
    format: 'cog' as DataSourceFormat,
    title: 'Cloud Optimized GeoTIFF',
    description: 'Optimized raster imagery',
    icon: Globe,
    color: 'text-purple-600',
    borderColor: 'border-l-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    format: 'wms' as DataSourceFormat,
    title: 'WMS',
    description: 'Web Map Service',
    icon: MapPin,
    color: 'text-orange-600',
    borderColor: 'border-l-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    format: 'wmts' as DataSourceFormat,
    title: 'WMTS',
    description: 'Web Map Tile Service',
    icon: MapPin,
    color: 'text-red-600',
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50',
  },
];

export const FormatSelectionCards = ({ onFormatSelect, onCancel }: FormatSelectionCardsProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Choose Data Format</h3>
            <p className="text-sm text-muted-foreground">
              Select the format of your data source to continue with configuration.
            </p>
          </div>

          <div className="grid gap-3">
            {formatConfigs.map((config) => {
              const Icon = config.icon;
              return (
                <Card 
                  key={config.format}
                  className={`border-l-4 ${config.borderColor} cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => onFormatSelect(config.format)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{config.title}</h4>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};