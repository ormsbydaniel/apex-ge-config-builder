
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Trash2, Clock, Info, Edit } from 'lucide-react';
import { DataSourceItem as DataSourceItemType, TimeframeType, Service, DataSourceMeta, DataSourceLayout } from '@/types/config';
import { extractDisplayName } from '@/utils/urlDisplay';
import { useToast } from '@/hooks/use-toast';
import { formatTimestampForTimeframe } from '@/utils/dateUtils';
import CogMetadataDialog from './CogMetadataDialog';
import FlatGeobufMetadataDialog from './FlatGeobufMetadataDialog';
import WmsWmtsMetadataDialog from './WmsWmtsMetadataDialog';

interface DataSourceItemProps {
  dataSource: DataSourceItemType;
  index: number;
  onRemove: (index: number) => void;
  onEdit?: (index: number) => void;
  showPosition?: boolean;
  showStatsLevel?: boolean;
  timeframe?: TimeframeType;
  onManageTimestamps?: () => void;
  services?: Service[];
  currentMeta?: DataSourceMeta;
  currentLayout?: DataSourceLayout;
  sourceName?: string;
  onUpdateMeta?: (updates: Partial<DataSourceMeta>) => void;
  onUpdateLayout?: (updates: Partial<DataSourceLayout>) => void;
}

const DataSourceItem = ({ 
  dataSource, 
  index, 
  onRemove,
  onEdit, 
  showPosition = false, 
  showStatsLevel = false,
  timeframe = 'None',
  onManageTimestamps,
  services = [],
  currentMeta,
  currentLayout,
  sourceName,
  onUpdateMeta,
  onUpdateLayout
}: DataSourceItemProps) => {
  const { toast } = useToast();
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [showFlatGeobufDialog, setShowFlatGeobufDialog] = useState(false);
  const [showWmsWmtsDialog, setShowWmsWmtsDialog] = useState(false);

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
  
  // Check if this data source uses TIME parameter (WMS/WMTS with temporal control but no timestamps)
  const isWmsOrWmts = dataSource.format?.toLowerCase() === 'wms' || dataSource.format?.toLowerCase() === 'wmts';
  const hasTimeParameter = isWmsOrWmts && timeframe !== 'None' && !hasTimestamps;

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
        
        {/* Info icon for COG files */}
        {dataSource.format?.toLowerCase() === 'cog' && dataSource.url && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowMetadataDialog(true)}
            className="h-6 w-6 p-0 flex-shrink-0"
            title="View COG Metadata"
          >
            <Info className="h-3 w-3" />
          </Button>
        )}
        
        {/* Info icon for FlatGeobuf files */}
        {dataSource.format?.toLowerCase() === 'flatgeobuf' && dataSource.url && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFlatGeobufDialog(true)}
            className="h-6 w-6 p-0 flex-shrink-0"
            title="View FlatGeobuf Metadata"
          >
            <Info className="h-3 w-3" />
          </Button>
        )}
        
        {/* Info icon for WMS/WMTS layers */}
        {(dataSource.format?.toLowerCase() === 'wms' || dataSource.format?.toLowerCase() === 'wmts') && dataSource.url && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowWmsWmtsDialog(true)}
            className="h-6 w-6 p-0 flex-shrink-0"
            title={`View ${dataSource.format.toUpperCase()} Capabilities`}
          >
            <Info className="h-3 w-3" />
          </Button>
        )}
        
        {/* Date pill for temporal layers */}
        {hasTimestamps && timeframe !== 'None' && dataSource.timestamps && dataSource.timestamps[0] && (
          <Badge variant="secondary" className="text-xs flex-shrink-0 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            {formatTimestampForTimeframe(dataSource.timestamps[0], timeframe)}
          </Badge>
        )}
        
        {showStatsLevel && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            L: {getLevel()}
          </span>
        )}
        
        <span className="text-xs text-gray-500 flex-shrink-0">
          Z: {getZIndex()}
        </span>
        
        {dataSource.opacity !== undefined && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            Opacity: {Math.round(dataSource.opacity * 100)}%
          </span>
        )}
        
        {/* TIME parameter badge for WMS/WMTS layers with temporal control but no timestamps */}
        {hasTimeParameter && (
          <Badge variant="secondary" className="text-xs flex-shrink-0 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            TIME PARAM
          </Badge>
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

        {onEdit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(index)}
            className="h-8 w-8 p-0"
            title="Edit Dataset"
          >
            <Edit className="h-3 w-3" />
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
      
      {/* COG Metadata Dialog */}
      {dataSource.format?.toLowerCase() === 'cog' && dataSource.url && (
        <CogMetadataDialog
          url={dataSource.url}
          filename={getDisplayName()}
          isOpen={showMetadataDialog}
          onClose={() => setShowMetadataDialog(false)}
          currentMeta={currentMeta}
          onUpdateMeta={onUpdateMeta}
        />
      )}
      
      {/* FlatGeobuf Metadata Dialog */}
      {dataSource.format?.toLowerCase() === 'flatgeobuf' && dataSource.url && (
        <FlatGeobufMetadataDialog
          url={dataSource.url}
          open={showFlatGeobufDialog}
          onOpenChange={setShowFlatGeobufDialog}
        />
      )}
      
      {/* WMS/WMTS Capabilities Dialog */}
      {(dataSource.format?.toLowerCase() === 'wms' || dataSource.format?.toLowerCase() === 'wmts') && dataSource.url && (
        <WmsWmtsMetadataDialog
          url={dataSource.url}
          format={dataSource.format.toLowerCase() as 'wms' | 'wmts'}
          layerName={dataSource.layers}
          isOpen={showWmsWmtsDialog}
          onClose={() => setShowWmsWmtsDialog(false)}
          sourceName={sourceName}
          currentLayout={currentLayout}
          onUpdateLayout={onUpdateLayout}
        />
      )}
    </div>
  );
};

export default DataSourceItem;
