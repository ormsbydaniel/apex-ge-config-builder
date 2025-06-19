
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Trash2 } from 'lucide-react';
import { DataSourceItem as DataSourceItemType } from '@/types/config';
import { extractDisplayName } from '@/utils/urlDisplay';
import { useToast } from '@/hooks/use-toast';

interface DataSourceItemProps {
  dataSource: DataSourceItemType;
  index: number;
  onRemove: (index: number) => void;
  showPosition?: boolean;
  showStatsLevel?: boolean;
}

const DataSourceItem = ({ dataSource, index, onRemove, showPosition = false, showStatsLevel = false }: DataSourceItemProps) => {
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
    return extractDisplayName(dataSource.url || '', dataSource.format);
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

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Badge variant="outline" className="text-xs flex-shrink-0">
          {dataSource.format.toUpperCase()}
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
        
        <span className="text-xs text-gray-500 flex-shrink-0">
          Z: {getLevel()}
        </span>

        {showStatsLevel && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            L: {getLevel()}
          </span>
        )}
        
        {showPosition && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            Pos: {getPosition()}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
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
