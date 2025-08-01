
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Trash2, Clock } from 'lucide-react';
import { DataSourceItem as DataSourceItemType, TimeframeType, Service } from '@/types/config';
import { extractDisplayName } from '@/utils/urlDisplay';
import { useToast } from '@/hooks/use-toast';
import { formatTimestampForTimeframe } from '@/utils/dateUtils';

interface DataSourceItemProps {
  dataSource: DataSourceItemType;
  index: number;
  onRemove: (index: number) => void;
  showPosition?: boolean;
  showStatsLevel?: boolean;
  timeframe?: TimeframeType;
  onManageTimestamps?: () => void;
  services?: Service[];
}

const DataSourceItem = ({ 
  dataSource, 
  index, 
  onRemove, 
  showPosition = false, 
  showStatsLevel = false,
  timeframe = 'None',
  onManageTimestamps,
  services = []
}: DataSourceItemProps) => {
  const { toast } = useToast();

  const handleCopyUrl = () => {
    if (dataSource.url) {
      navigator.clipboard.writeText(dataSource.url);
      toast({
        title: "URL Copied",
        description: "Data source URL copied to clipboard",
      });
    }
  };

  const getDisplayName = () => {
    const format = dataSource.format?.toLowerCase() || '';
    
    // For web services, try to get the layers parameter
    if (['wms', 'wmts', 'wfs'].includes(format)) {
      if (dataSource.layers) {
        return dataSource.layers;
      }
    }
    
    // For XYZ services, get the domain
    if (format === 'xyz' && dataSource.url) {
      try {
        const url = new URL(dataSource.url);
        return url.hostname;
      } catch (e) {
        // Fall back to extractDisplayName if URL parsing fails
      }
    }
    
    // For all other cases, use the existing utility
    return extractDisplayName(dataSource.url || '', dataSource.format || '');
  };

  const getZIndex = () => {
    return dataSource.zIndex || 0;
  };

  const getLevel = () => {
    return dataSource.level || 0;
  };

  const getPosition = () => {
    const position = dataSource.position;
    if (!position) return 'N/A';
    if (typeof position === 'string') return position;
    return 'N/A';
  };

  const hasZoomLevels = dataSource.minZoom !== undefined || dataSource.maxZoom !== undefined;
  const hasTimestamps = dataSource.timestamps && dataSource.timestamps.length > 0;
  const showTemporalInfo = timeframe !== 'None' && (hasTimestamps || onManageTimestamps);
  
  // Check if this data source uses TIME parameter from service capabilities
  const hasTimeParameter = React.useMemo(() => {
    if (!dataSource.serviceId || !dataSource.layers) return false;
    
    const service = services.find(s => s.id === dataSource.serviceId);
    if (!service?.capabilities) return false;
    
    const layerCapabilities = service.capabilities.layers.find(l => l.name === dataSource.layers);
    return layerCapabilities?.hasTimeDimension || false;
  }, [dataSource.serviceId, dataSource.layers, services]);

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Badge variant="outline" className="text-xs flex-shrink-0">
          {dataSource.format?.toUpperCase() || 'UNKNOWN'}
        </Badge>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm font-medium truncate flex-1 cursor-help">
                {getDisplayName()}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs break-all">{dataSource.url || 'No URL'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Date pill for temporal layers */}
        {hasTimestamps && timeframe !== 'None' && dataSource.timestamps && dataSource.timestamps[0] && (
          <Badge variant="secondary" className="text-xs flex-shrink-0 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {formatTimestampForTimeframe(dataSource.timestamps[0], timeframe)}
          </Badge>
        )}
        
        <span className="text-xs text-gray-500 flex-shrink-0">
          Z: {getZIndex()}
        </span>
        
        {/* TIME parameter pill for WMS/WMTS layers */}
        {hasTimeParameter && (
          <Badge variant="secondary" className="text-xs flex-shrink-0 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            TIME param
          </Badge>
        )}
        
        {showStatsLevel && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            L: {getLevel()}
          </span>
        )}
        
        {showPosition && (
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            {getPosition()}
          </Badge>
        )}
        
        {hasZoomLevels && (
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            <span>Zoom:</span>
            <span>
              {dataSource.minZoom !== undefined ? dataSource.minZoom : '∞'}-{dataSource.maxZoom !== undefined ? dataSource.maxZoom : '∞'}
            </span>
          </div>
        )}

        {showTemporalInfo && (
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            <Clock className="h-3 w-3" />
            <span>
              {hasTimestamps 
                ? `${dataSource.timestamps!.length} timestamp${dataSource.timestamps!.length !== 1 ? 's' : ''}`
                : 'No timestamps'
              }
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        {showTemporalInfo && onManageTimestamps && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onManageTimestamps}
            className="h-8 w-8 p-0"
            title="Manage Timestamps"
          >
            <Clock className="h-3 w-3" />
          </Button>
        )}

        {dataSource.url && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyUrl}
            className="h-8 w-8 p-0"
            title="Copy URL"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(index)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default DataSourceItem;
